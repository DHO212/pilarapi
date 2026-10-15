import type { Order } from "../entities/Order";
import type { OrderId } from "../value-objects/PaymentValueObjects";

// First-Class Collection untuk Order — behavior di collection, bukan di repo
export class OrderCollection {
  constructor(private readonly items: Order[] = []) {}

  add(order: Order): void {
    this.items.push(order);
  }

  findById(id: OrderId): Order | null {
    return this.items.find((o) => o.getId().toString() === id.toString()) ?? null;
  }

  filterPaid(): Order[] {
    return this.items.filter((o) => o.isPaid());
  }

  filterPending(): Order[] {
    return this.items.filter((o) => o.getStatus() === "pending");
  }

  totalPaidAmount(): number {
    return this.filterPaid().reduce((s, o) => s + o.getAmount().getAmount(), 0);
  }

  toArray(): Order[] {
    return [...this.items];
  }

  count(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}
