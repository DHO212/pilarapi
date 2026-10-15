import type { Order } from "../../domain/entities/Order";
import type { Payment } from "../../domain/entities/Payment";
import type { OrderRepository } from "../../domain/repositories/OrderRepository";
import type { PaymentRepository } from "../../domain/repositories/PaymentRepository";
import type { OrderId, PaymentId } from "../../domain/value-objects/PaymentValueObjects";

export class InMemoryOrderRepository implements OrderRepository {
  private store = new Map<string, Order>();
  async save(order: Order): Promise<void> {
    this.store.set(order.getId().toString(), order);
  }
  async findById(id: OrderId): Promise<Order | null> {
    return this.store.get(id.toString()) ?? null;
  }
  async findAll(): Promise<Order[]> {
    return [...this.store.values()];
  }
  clear(): void {
    this.store.clear();
  }
}

export class InMemoryPaymentRepository implements PaymentRepository {
  private store = new Map<string, Payment>();
  async save(p: Payment): Promise<void> {
    this.store.set(p.getId().toString(), p);
  }
  async findById(id: PaymentId): Promise<Payment | null> {
    return this.store.get(id.toString()) ?? null;
  }
  async findAll(): Promise<Payment[]> {
    return [...this.store.values()];
  }
  clear(): void {
    this.store.clear();
  }
}
