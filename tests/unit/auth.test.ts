import { Email, HashedPassword, PlainPassword, UserId } from "../../src/domain/value-objects/UserValueObjects";
import { User } from "../../src/domain/entities/User";
import { InMemoryUserRepository } from "../../src/infrastructure/repositories/InMemoryUserRepository";
import { FakePasswordHasher, FakeTokenIssuer } from "../../src/infrastructure/security/AuthInfra";
import { LoginUseCase, MeUseCase, RegisterUseCase } from "../../src/application/use-cases/AuthUseCases";

describe("Auth value objects", () => {
  it("Email rejects empty / bad format / normalizes", () => {
    expect(() => Email.create("")).toThrow(/cannot be empty/i);
    expect(() => Email.create("not-an-email")).toThrow(/invalid email/i);
    expect(Email.create("  USER@Example.COM ").toString()).toBe("user@example.com");
  });

  it("PlainPassword rejects <8 chars", () => {
    expect(() => PlainPassword.create("short")).toThrow(/min 8/i);
    expect(() => PlainPassword.create("longenough123")).toBeTruthy();
  });

  it("HashedPassword rejects empty", () => {
    expect(() => HashedPassword.create("")).toThrow();
  });

  it("UserId generate unique", () => {
    expect(UserId.generate().toString()).not.toBe(UserId.generate().toString());
  });
});

describe("User entity", () => {
  it("creates with id+email+hash", () => {
    const u = User.create({ id: UserId.create("u1"), email: Email.create("a@b.com"), passwordHash: HashedPassword.create("h1") });
    expect(u.getEmail().toString()).toBe("a@b.com");
  });

  it("changePassword swaps hash", () => {
    const u = User.create({ id: UserId.create("u1"), email: Email.create("a@b.com"), passwordHash: HashedPassword.create("h1") });
    u.changePassword(HashedPassword.create("h2"));
    expect(u.getPasswordHash().toString()).toBe("h2");
  });

  it("reconstitute restores", () => {
    const u = User.reconstitute({ id: UserId.create("u1"), email: Email.create("a@b.com"), passwordHash: HashedPassword.create("h"), createdAt: new Date("2024-01-01") });
    expect(u.getCreatedAt().toISOString()).toContain("2024-01-01");
  });
});

describe("Auth use cases — TDD Green", () => {
  function setup() {
    const repo = new InMemoryUserRepository();
    const hasher = new FakePasswordHasher();
    const tokens = new FakeTokenIssuer();
    const ids = { generate: () => "uid-1" } as never;
    return { repo, hasher, tokens, ids };
  }

  it("when registering with valid data, creates user + returns token", async () => {
    const { repo, hasher, tokens, ids } = setup();
    const uc = new RegisterUseCase(repo, hasher, tokens, ids as never);
    const out = await uc.execute({ email: "new@ex.com", password: "password123" });
    expect(out.token).toMatch(/^fake:/);
    expect(out.user.email).toBe("new@ex.com");
    expect((await repo.findAll()).length).toBe(1);
  });

  it("when registering same email, throws EmailAlreadyTaken", async () => {
    const { repo, hasher, tokens } = setup();
    const r1 = new RegisterUseCase(repo, hasher, tokens, { generate: () => "u1" } as never);
    const r2 = new RegisterUseCase(repo, hasher, tokens, { generate: () => "u2" } as never);
    await r1.execute({ email: "dup@ex.com", password: "password123" });
    await expect(r2.execute({ email: "dup@ex.com", password: "password123" })).rejects.toThrow(/already taken/i);
  });

  it("when login with correct password, returns token", async () => {
    const { repo, hasher, tokens } = setup();
    const reg = new RegisterUseCase(repo, hasher, tokens, { generate: () => "u1" } as never);
    await reg.execute({ email: "login@ex.com", password: "password123" });
    const login = new LoginUseCase(repo, hasher, tokens);
    const out = await login.execute({ email: "login@ex.com", password: "password123" });
    expect(out.token).toBeTruthy();
  });

  it("when login with wrong password, throws InvalidCredentials", async () => {
    const { repo, hasher, tokens } = setup();
    const reg = new RegisterUseCase(repo, hasher, tokens, { generate: () => "u1" } as never);
    await reg.execute({ email: "bad@ex.com", password: "password123" });
    const login = new LoginUseCase(repo, hasher, tokens);
    await expect(login.execute({ email: "bad@ex.com", password: "otherpass123" })).rejects.toThrow(/invalid/i);
  });

  it("when login with unknown email, throws InvalidCredentials", async () => {
    const { repo, hasher, tokens } = setup();
    const login = new LoginUseCase(repo, hasher, tokens);
    await expect(login.execute({ email: "no@ex.com", password: "password123" })).rejects.toThrow(/invalid/i);
  });

  it("when calling me with valid token, returns profile", async () => {
    const { repo, hasher, tokens } = setup();
    const reg = new RegisterUseCase(repo, hasher, tokens, { generate: () => "u1" } as never);
    const { token } = await reg.execute({ email: "me@ex.com", password: "password123" });
    const me = new MeUseCase(repo, tokens);
    const profile = await me.execute(token);
    expect(profile.email).toBe("me@ex.com");
  });

  it("when calling me with invalid token, throws Unauthorized", async () => {
    const { repo, tokens } = setup();
    const me = new MeUseCase(repo, tokens);
    await expect(me.execute("bad-token")).rejects.toThrow(/unauthorized/i);
    await expect(me.execute("")).rejects.toThrow(/unauthorized/i);
  });
});
