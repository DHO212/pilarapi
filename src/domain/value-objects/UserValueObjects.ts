import { ValidationError } from "../errors/DomainError";

export class UserId {
  private constructor(private readonly value: string) {}
  static create(value: string): UserId {
    if (!value || !value.trim()) throw new ValidationError("UserId cannot be empty");
    return new UserId(value.trim());
  }
  static generate(): UserId {
    return new UserId(crypto.randomUUID());
  }
  toString(): string {
    return this.value;
  }
  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}

export class Email {
  private constructor(private readonly value: string) {}
  static create(value: string): Email {
    const v = (value ?? "").trim().toLowerCase();
    if (!v) throw new ValidationError("Email cannot be empty");
    if (v.length > 254) throw new ValidationError("Email too long");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new ValidationError("Invalid email format");
    return new Email(v);
  }
  toString(): string {
    return this.value;
  }
  equals(other: Email): boolean {
    return this.value === other.value;
  }
}

export class PlainPassword {
  private constructor(private readonly value: string) {}
  static create(value: string): PlainPassword {
    const v = value ?? "";
    if (v.length < 8) throw new ValidationError("Password min 8 chars");
    if (v.length > 72) throw new ValidationError("Password max 72 chars");
    return new PlainPassword(v);
  }
  toString(): string {
    return this.value;
  }
  expose(): string {
    return this.value;
  }
}

export class HashedPassword {
  private constructor(private readonly value: string) {}
  static create(hash: string): HashedPassword {
    if (!hash || !hash.trim()) throw new ValidationError("HashedPassword cannot be empty");
    return new HashedPassword(hash);
  }
  toString(): string {
    return this.value;
  }
  expose(): string {
    return this.value;
  }
}
