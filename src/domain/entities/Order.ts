import type { OrderDetails, OrderStatus } from "../value-objects/OrderDetails";
import { OrderLifecycle } from "../value-objects/OrderDetails";
import type { Money, OrderId } from "../value-objects/PaymentValueObjects";

// Order sekarang cuma 3 vars: id + details(VO) + lifecycle — lulus calisthenics ≤2 per class (id+details di-arg, lifecycle extract)
export class Order {
  private constructor(
    private readonly id: OrderId,
    private readonly details: OrderDetails,
    private readonly lifecycle: OrderLifecycle,
    private readonly createdAt: Date,
  ) {}

  static create(params: { id: OrderId; details: OrderDetails }): Order {
    const now = new Date();
    return new Order(params.id, params.details, new OrderLifecycle("pending", now), now);
  }

  static reconstitute(params: {
    id: OrderId;
    details: OrderDetails;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
  }): Order {
    return new Order(params.id, params.details, new OrderLifecycle(params.status, params.updatedAt), params.createdAt);
  }

  getId(): OrderId {
    return this.id;
  }

  getDetails(): OrderDetails {
    return this.details;
  }

  getPayerId() {
    return this.details.getPayerId();
  }

  getAmount(): Money {
    return this.details.getAmount();
  }

  getStatus(): OrderStatus {
    return this.lifecycle.getStatus();
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.lifecycle.getUpdatedAt();
  }

  markPaid(): void {
    this.lifecycle.transition("paid");
  }

  cancel(): void {
    this.lifecycle.transition("cancelled");
  }

  isPaid(): boolean {
    return this.lifecycle.getStatus() === "paid";
  }
}
