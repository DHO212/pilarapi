import type { Email, HashedPassword, UserId } from "../value-objects/UserValueObjects";

export class User {
  private constructor(
    private readonly id: UserId,
    private readonly email: Email,
    private passwordHash: HashedPassword,
    private readonly createdAt: Date,
  ) {}

  static create(params: { id: UserId; email: Email; passwordHash: HashedPassword }): User {
    return new User(params.id, params.email, params.passwordHash, new Date());
  }

  static reconstitute(params: { id: UserId; email: Email; passwordHash: HashedPassword; createdAt: Date }): User {
    return new User(params.id, params.email, params.passwordHash, params.createdAt);
  }

  getId(): UserId {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getPasswordHash(): HashedPassword {
    return this.passwordHash;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  changePassword(hash: HashedPassword): void {
    this.passwordHash = hash;
  }
}
