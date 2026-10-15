import * as crypto from "crypto";
import type { PlainPassword } from "../../domain/value-objects/UserValueObjects";
import { HashedPassword } from "../../domain/value-objects/UserValueObjects";
import type { PasswordHasher } from "../../application/ports/PasswordHasher";
import type { TokenIssuer } from "../../application/ports/TokenIssuer";

// Pure-JS hasher: scrypt-based (std lib only). Swap ke bcrypt/argon2 tanpa ubah domain.
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plain: PlainPassword): Promise<HashedPassword> {
    const salt = crypto.randomBytes(16).toString("hex");
    const derived = crypto.scryptSync(plain.expose(), salt, 32).toString("hex");
    return HashedPassword.create(`${salt}:${derived}`);
  }

  async verify(plain: PlainPassword, hashed: HashedPassword): Promise<boolean> {
    const raw = hashed.expose();
    const sep = raw.indexOf(":");
    if (sep === -1) return false;
    const salt = raw.slice(0, sep);
    const expected = raw.slice(sep + 1);
    const derived = crypto.scryptSync(plain.expose(), salt, 32).toString("hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(expected, "hex"));
  }
}

// Deterministic fake hasher buat test yang cepat
export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: PlainPassword): Promise<HashedPassword> {
    return HashedPassword.create(`fake:${plain.expose()}`);
  }
  async verify(plain: PlainPassword, hashed: HashedPassword): Promise<boolean> {
    return hashed.expose() === `fake:${plain.expose()}`;
  }
}

// Minimal JWT-ish issuer: HMAC-SHA256, tanpa lib eksternal
function b64url(s: string): string {
  return Buffer.from(s).toString("base64url");
}
function b64urlJson(o: unknown): string {
  return b64url(JSON.stringify(o));
}

export class HmacTokenIssuer implements TokenIssuer {
  constructor(private readonly secret: string) {}

  issue(payload: { userId: string; email: string }): string {
    const header = b64urlJson({ alg: "HS256", typ: "JWT" });
    const body = b64urlJson({ ...payload, iat: Date.now() });
    const sig = crypto.createHmac("sha256", this.secret).update(`${header}.${body}`).digest("base64url");
    return `${header}.${body}.${sig}`;
  }

  verify(token: string): { userId: string; email: string } | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, b, s] = parts;
    const expected = crypto.createHmac("sha256", this.secret).update(`${h}.${b}`).digest("base64url");
    if (s.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    try {
      const payload = JSON.parse(Buffer.from(b, "base64url").toString()) as { userId: string; email: string };
      if (!payload.userId || !payload.email) return null;
      return { userId: payload.userId, email: payload.email };
    } catch {
      return null;
    }
  }
}

export class FakeTokenIssuer implements TokenIssuer {
  issue(payload: { userId: string; email: string }): string {
    return `fake:${payload.userId}:${payload.email}`;
  }
  verify(token: string): { userId: string; email: string } | null {
    if (!token.startsWith("fake:")) return null;
    const [, userId, email] = token.split(":");
    if (!userId || !email) return null;
    return { userId, email };
  }
}
