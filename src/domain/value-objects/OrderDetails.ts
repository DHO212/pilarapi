import type { Money } from "../value-objects/PaymentValueObjects";
import type { UserId } from "../value-objects/UserValueObjects";
import { ValidationError } from "../errors/DomainError";

// Value Object komposit — bungkus payer + money biar Order gak pegang 3 field terpisah
export class OrderDetails {
  private constructor(
    private readonly payerId: UserId,
    private readonly amount: Money,
  ) {}

  static create(payerId: UserId, amount: Money): OrderDetails {
    if (amount.isZero()) throw new ValidationError("Order amount cannot be zero");
    return new OrderDetails(payerId, amount);
  }

  getPayerId(): UserId {
    return this.payerId;
  }

  getAmount(): Money {
    return this.amount;
  }
}

// Lifecycle terpisah — status + timestamps (2 vars, high cohesion)
export class OrderLifecycle {
  constructor(
    private status: OrderStatus,
    private updatedAt: Date,
  ) {}

  getStatus(): OrderStatus {
    return this.status;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  transition(next: OrderStatus): void {
    if (!ORDER_TRANSITIONS[this.status].includes(next)) {
      throw new ValidationError(`Cannot transition order from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = new Date();
  }
}

export type OrderStatus = "pending" | "paid" | "cancelled";

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
};
