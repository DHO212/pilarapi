import type { Payment } from "../entities/Payment";
import type { PaymentId } from "../value-objects/PaymentValueObjects";

export interface PaymentRepository {
  save(payment: Payment): Promise<void>;
  findById(id: PaymentId): Promise<Payment | null>;
  findAll(): Promise<Payment[]>;
}
