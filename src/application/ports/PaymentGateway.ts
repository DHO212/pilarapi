import type { Money } from "../../domain/value-objects/PaymentValueObjects";

export type ChargeInput = { amount: Money; idempotencyKey: string };

export type ChargeResult =
  | { status: "succeeded"; providerPaymentId: string }
  | { status: "failed"; reason: string };

export interface PaymentGateway {
  charge(input: ChargeInput): Promise<ChargeResult>;
}

// DIP: domain gak tau gateway apa — OCP: tambah gateway baru tinggal implement interface ini

export class FakePaymentGateway implements PaymentGateway {
  constructor(private readonly shouldSucceed = true) {}
  async charge(_input: ChargeInput): Promise<ChargeResult> {
    if (this.shouldSucceed) return { status: "succeeded", providerPaymentId: `prov_${Date.now()}` };
    return { status: "failed", reason: "insufficient_funds" };
  }
}

// Deterministic fake yang bisa di-toggle per test
export class TogglePaymentGateway implements PaymentGateway {
  next: ChargeResult = { status: "succeeded", providerPaymentId: "prov_ok" };
  async charge(_input: ChargeInput): Promise<ChargeResult> {
    return this.next;
  }
}
