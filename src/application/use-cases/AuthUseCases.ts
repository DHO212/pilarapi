import { User } from "../../domain/entities/User";
import type { UserRepository } from "../../domain/repositories/UserRepository";
import { Email, PlainPassword, UserId } from "../../domain/value-objects/UserValueObjects";
import type { IdGenerator } from "../ports/IdGenerator";
import type { PasswordHasher } from "../ports/PasswordHasher";
import type { TokenIssuer } from "../ports/TokenIssuer";
import type { AuthOutput, LoginInput, MeOutput, RegisterInput } from "../dto/AuthDto";

export class EmailAlreadyTakenError extends Error {
  constructor(email: string) {
    super(`Email already taken: ${email}`);
    this.name = "EmailAlreadyTakenError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

function toMe(user: User): MeOutput {
  return { id: user.getId().toString(), email: user.getEmail().toString(), createdAt: user.getCreatedAt().toISOString() };
}

export class RegisterUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenIssuer,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: RegisterInput): Promise<AuthOutput> {
    const email = Email.create(input.email);
    const existing = await this.users.findByEmail(email);
    if (existing) throw new EmailAlreadyTakenError(email.toString());

    const plain = PlainPassword.create(input.password);
    const hash = await this.hasher.hash(plain);
    const user = User.create({ id: UserId.create(this.ids.generate()), email, passwordHash: hash });
    await this.users.save(user);

    const token = this.tokens.issue({ userId: user.getId().toString(), email: user.getEmail().toString() });
    return { user: toMe(user), token };
  }
}

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenIssuer,
  ) {}

  async execute(input: LoginInput): Promise<AuthOutput> {
    const email = Email.create(input.email);
    const user = await this.users.findByEmail(email);
    if (!user) throw new InvalidCredentialsError();

    const plain = PlainPassword.create(input.password);
    const ok = await this.hasher.verify(plain, user.getPasswordHash());
    if (!ok) throw new InvalidCredentialsError();

    const token = this.tokens.issue({ userId: user.getId().toString(), email: user.getEmail().toString() });
    return { user: toMe(user), token };
  }
}

export class MeUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenIssuer,
  ) {}

  async execute(token: string): Promise<MeOutput> {
    if (!token) throw new UnauthorizedError();
    const payload = this.tokens.verify(token);
    if (!payload) throw new UnauthorizedError();
    const user = await this.users.findByEmail(Email.create(payload.email));
    if (!user) throw new UnauthorizedError();
    if (user.getId().toString() !== payload.userId) throw new UnauthorizedError();
    return toMe(user);
  }
}
