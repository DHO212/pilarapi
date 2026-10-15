import type { Order } from "../entities/Order";
import type { OrderId } from "../value-objects/PaymentValueObjects";

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
  findAll(): Promise<Order[]>;
}
