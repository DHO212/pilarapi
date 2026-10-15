import { ValidationError } from "../errors/DomainError";
import type { UserId } from "./UserValueObjects";

// Money sebagai Value Object — never pakai number mentah buat duit
export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string,
  ) {}

  static create(amount: number, currency = "IDR"): Money {
    if (!Number.isFinite(amount)) throw new ValidationError("Amount must be finite");
    if (amount < 0) throw new ValidationError("Amount cannot be negative");
    if (!currency || !currency.trim()) throw new ValidationError("Currency required");
    // simpan sebagai integer minor unit biar anti float error (anggap amount sudah minor)
    if (!Number.isInteger(amount)) throw new ValidationError("Amount must be integer (minor unit)");
    return new Money(amount, currency.toUpperCase());
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new ValidationError("Currency mismatch");
    return new Money(this.amount + other.amount, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  toString(): string {
    return `${this.currency} ${this.amount}`;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}

export class OrderId {
  private constructor(private readonly value: string) {}
  static create(value: string): OrderId {
    if (!value || !value.trim()) throw new ValidationError("OrderId cannot be empty");
    return new OrderId(value.trim());
  }
  static generate(): OrderId {
    return new OrderId(crypto.randomUUID());
  }
  toString(): string {
    return this.value;
  }
}

export class PaymentId {
  private constructor(private readonly value: string) {}
  static create(value: string): PaymentId {
    if (!value || !value.trim()) throw new ValidationError("PaymentId cannot be empty");
    return new PaymentId(value.trim());
  }
  static generate(): PaymentId {
    return new PaymentId(crypto.randomUUID());
  }
  toString(): string {
    return this.value;
  }
}

// Reference ke User tanpa import cycle — cukup UserId string
export type PayerId = UserId;
