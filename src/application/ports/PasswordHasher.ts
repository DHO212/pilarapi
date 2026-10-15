import type { HashedPassword, PlainPassword } from "../../domain/value-objects/UserValueObjects";

export interface PasswordHasher {
  hash(plain: PlainPassword): Promise<HashedPassword>;
  verify(plain: PlainPassword, hashed: HashedPassword): Promise<boolean>;
}
