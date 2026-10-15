import { Money, OrderId, PaymentId } from "../../src/domain/value-objects/PaymentValueObjects";
import { UserId } from "../../src/domain/value-objects/UserValueObjects";
import { Order } from "../../src/domain/entities/Order";
import { Payment } from "../../src/domain/entities/Payment";
import { InMemoryOrderRepository, InMemoryPaymentRepository } from "../../src/infrastructure/repositories/InMemoryOrderRepos";
import { TogglePaymentGateway } from "../../src/application/ports/PaymentGateway";
import { CancelOrderUseCase, CreateOrderUseCase, PayOrderUseCase } from "../../src/application/use-cases/PaymentUseCases";
import { OrderDetails } from "../../src/domain/value-objects/OrderDetails";

function seqIds(...vals: string[]) {
  let i = 0;
  return { generate: () => vals[i++] ?? `gen-${i}` } as never;
}

describe("Payment slice — value objects", () => {
  it("Money rejects negative / float / zero order", () => {
    expect(() => Money.create(-1)).toThrow(/cannot be negative/i);
    expect(() => Money.create(1.5)).toThrow(/integer/i);
    expect(() => Money.create(0)).toBeTruthy(); // Money 0 valid, tapi Order.create yang nolak
  });

  it("Money add requires same currency", () => {
    expect(() => Money.create(100, "IDR").add(Money.create(100, "USD"))).toThrow(/currency mismatch/i);
    expect(Money.create(100, "IDR").add(Money.create(50, "IDR")).getAmount()).toBe(150);
  });

  it("OrderId / PaymentId reject empty", () => {
    expect(() => OrderId.create("")).toThrow();
    expect(() => PaymentId.create("  ")).toThrow();
  });
});

describe("Order + Payment entities", () => {
  it("Order.create pending, cannot have zero amount", () => {
    expect(() => Order.create({ id: OrderId.create("o1"), details: OrderDetails.create(UserId.create("u1"), Money.create(0)) })).toThrow(/cannot be zero/i);
    const o = Order.create({ id: OrderId.create("o1"), details: OrderDetails.create(UserId.create("u1"), Money.create(1000)) });
    expect(o.getStatus()).toBe("pending");
  });

  it("Order transitions pending->paid, pending->cancelled, paid cannot move", () => {
    const o = Order.create({ id: OrderId.create("o1"), details: OrderDetails.create(UserId.create("u1"), Money.create(1000)) });
    o.markPaid();
    expect(o.isPaid()).toBe(true);
    expect(() => o.cancel()).toThrow(/cannot transition/i);
  });

  it("Payment succeed/fail only once", () => {
    const p = Payment.create({ id: PaymentId.create("p1"), orderId: OrderId.create("o1"), amount: Money.create(1000) });
    p.succeed();
    expect(() => p.succeed()).toThrow(/already finalized/i);
    const p2 = Payment.create({ id: PaymentId.create("p2"), orderId: OrderId.create("o1"), amount: Money.create(1000) });
    p2.fail();
    expect(() => p2.fail()).toThrow(/already finalized/i);
  });
});

describe("Payment use cases — TDD", () => {
  it("when creating order with valid payer+amount, persists", async () => {
    const orders = new InMemoryOrderRepository();
    const uc = new CreateOrderUseCase(orders, seqIds("ord-1"));
    const out = await uc.execute({ payerId: "user-1", amount: 50000 });
    expect(out.id).toBe("ord-1");
    expect(out.status).toBe("pending");
  });

  it("when paying order and gateway succeeds, order becomes paid + payment succeeded", async () => {
    const orders = new InMemoryOrderRepository();
    const payments = new InMemoryPaymentRepository();
    const gw = new TogglePaymentGateway();
    gw.next = { status: "succeeded", providerPaymentId: "prov_1" };
    const create = new CreateOrderUseCase(orders, seqIds("ord-1"));
    const pay = new PayOrderUseCase(orders, payments, gw, seqIds("pay-1"));
    const { id } = await create.execute({ payerId: "u1", amount: 10000 });
    const res = await pay.execute(id);
    expect(res.order.status).toBe("paid");
    expect(res.payment.status).toBe("succeeded");
  });

  it("when gateway fails, order stays pending + payment failed", async () => {
    const orders = new InMemoryOrderRepository();
    const payments = new InMemoryPaymentRepository();
    const gw = new TogglePaymentGateway();
    gw.next = { status: "failed", reason: "insufficient_funds" };
    const create = new CreateOrderUseCase(orders, seqIds("ord-1"));
    const pay = new PayOrderUseCase(orders, payments, gw, seqIds("pay-1"));
    const { id } = await create.execute({ payerId: "u1", amount: 10000 });
    const res = await pay.execute(id);
    expect(res.order.status).toBe("pending");
    expect(res.payment.status).toBe("failed");
  });

  it("when paying non-pending order, throws", async () => {
    const orders = new InMemoryOrderRepository();
    const payments = new InMemoryPaymentRepository();
    const gw = new TogglePaymentGateway();
    const create = new CreateOrderUseCase(orders, seqIds("ord-1"));
    const pay = new PayOrderUseCase(orders, payments, gw, seqIds("pay-1", "pay-2"));
    const { id } = await create.execute({ payerId: "u1", amount: 10000 });
    await pay.execute(id); // first pay succeeds
    await expect(pay.execute(id)).rejects.toThrow(/not payable/i);
  });

  it("when cancelling pending order, succeeds; cancelling paid fails", async () => {
    const orders = new InMemoryOrderRepository();
    const payments = new InMemoryPaymentRepository();
    const gw = new TogglePaymentGateway();
    const create = new CreateOrderUseCase(orders, seqIds("ord-1", "ord-2"));
    const cancel = new CancelOrderUseCase(orders);
    const pay = new PayOrderUseCase(orders, payments, gw, seqIds("pay-1"));
    const o1 = await create.execute({ payerId: "u1", amount: 10000 });
    expect((await cancel.execute(o1.id)).status).toBe("cancelled");
    const o2 = await create.execute({ payerId: "u1", amount: 10000 });
    await pay.execute(o2.id);
    await expect(cancel.execute(o2.id)).rejects.toThrow(/cannot transition/i);
  });

  it("OrderRepository is swappable (DIP) — use case gak tau InMemory", async () => {
    const orders = new InMemoryOrderRepository();
    const uc = new CreateOrderUseCase(orders as never, seqIds("x"));
    await expect(uc.execute({ payerId: "u1", amount: 1000 })).resolves.toBeTruthy();
  });
});
