import type { Money, OrderId, PaymentId } from "../value-objects/PaymentValueObjects";
import { ValidationError } from "../errors/DomainError";

export type PaymentStatus = "requires_payment" | "succeeded" | "failed";

export class Payment {
  private constructor(
    private readonly id: PaymentId,
    private readonly orderId: OrderId,
    private readonly amount: Money,
    private status: PaymentStatus,
    private readonly createdAt: Date,
  ) {}

  static create(params: { id: PaymentId; orderId: OrderId; amount: Money }): Payment {
    return new Payment(params.id, params.orderId, params.amount, "requires_payment", new Date());
  }

  static reconstitute(params: {
    id: PaymentId;
    orderId: OrderId;
    amount: Money;
    status: PaymentStatus;
    createdAt: Date;
  }): Payment {
    return new Payment(params.id, params.orderId, params.amount, params.status, params.createdAt);
  }

  getId(): PaymentId {
    return this.id;
  }

  getOrderId(): OrderId {
    return this.orderId;
  }

  getAmount(): Money {
    return this.amount;
  }

  getStatus(): PaymentStatus {
    return this.status;
  }

  succeed(): void {
    this.ensurePending();
    this.status = "succeeded";
  }

  fail(): void {
    this.ensurePending();
    this.status = "failed";
  }

  private ensurePending(): void {
    if (this.status !== "requires_payment") throw new ValidationError("Payment already finalized");
  }
}
