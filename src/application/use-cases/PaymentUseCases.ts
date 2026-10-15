import { Order } from "../../domain/entities/Order";
import { Payment } from "../../domain/entities/Payment";
import { ValidationError } from "../../domain/errors/DomainError";
import type { OrderRepository } from "../../domain/repositories/OrderRepository";
import type { PaymentRepository } from "../../domain/repositories/PaymentRepository";
import type { IdGenerator } from "../ports/IdGenerator";
import type { PaymentGateway } from "../ports/PaymentGateway";
import { Money, OrderId, PaymentId } from "../../domain/value-objects/PaymentValueObjects";
import { OrderDetails } from "../../domain/value-objects/OrderDetails";
import { UserId } from "../../domain/value-objects/UserValueObjects";
import type { CreateOrderInput, OrderOutput, OrderWithPaymentOutput, PaymentOutput } from "../dto/PaymentDto";

export class OrderNotFoundError extends Error {
  constructor(id: string) {
    super(`Order not found: ${id}`);
    this.name = "OrderNotFoundError";
  }
}

function toOrderOutput(o: Order): OrderOutput {
  return {
    id: o.getId().toString(),
    payerId: o.getPayerId().toString(),
    amount: o.getAmount().getAmount(),
    currency: o.getAmount().getCurrency(),
    status: o.getStatus(),
    createdAt: o.getCreatedAt().toISOString(),
    updatedAt: o.getUpdatedAt().toISOString(),
  };
}

function toPaymentOutput(p: Payment): PaymentOutput {
  return {
    id: p.getId().toString(),
    orderId: p.getOrderId().toString(),
    amount: p.getAmount().getAmount(),
    currency: p.getAmount().getCurrency(),
    status: p.getStatus(),
    createdAt: (p as unknown as { createdAt: Date }).createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export class CreateOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateOrderInput): Promise<OrderOutput> {
    const payerId = UserId.create(input.payerId);
    const amount = Money.create(input.amount, input.currency ?? "IDR");
    const details = OrderDetails.create(payerId, amount);
    const order = Order.create({ id: OrderId.create(this.ids.generate()), details });
    await this.orders.save(order);
    return toOrderOutput(order);
  }
}

export class ListOrdersUseCase {
  constructor(private readonly orders: OrderRepository) {}
  async execute(): Promise<OrderOutput[]> {
    return (await this.orders.findAll()).map(toOrderOutput);
  }
}

export class GetOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}
  async execute(id: string): Promise<OrderWithPaymentOutput> {
    const order = await this.orders.findById(OrderId.create(id));
    if (!order) throw new OrderNotFoundError(id);
    return { order: toOrderOutput(order), payment: null };
  }
}

export class PayOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly payments: PaymentRepository,
    private readonly gateway: PaymentGateway,
    private readonly ids: IdGenerator,
  ) {}

  async execute(orderId: string): Promise<{ order: OrderOutput; payment: PaymentOutput }> {
    const order = await this.orders.findById(OrderId.create(orderId));
    if (!order) throw new OrderNotFoundError(orderId);
    if (order.getStatus() !== "pending") throw new ValidationError(`Order not payable: ${order.getStatus()}`);

    const payment = Payment.create({ id: PaymentId.create(this.ids.generate()), orderId: order.getId(), amount: order.getAmount() });

    const result = await this.gateway.charge({ amount: order.getAmount(), idempotencyKey: payment.getId().toString() });

    if (result.status === "succeeded") {
      payment.succeed();
      order.markPaid();
    }
    if (result.status === "failed") {
      payment.fail();
    }

    await this.payments.save(payment);
    await this.orders.save(order);

    return { order: toOrderOutput(order), payment: toPaymentOutput(payment) };
  }
}

export class CancelOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}
  async execute(orderId: string): Promise<OrderOutput> {
    const order = await this.orders.findById(OrderId.create(orderId));
    if (!order) throw new OrderNotFoundError(orderId);
    order.cancel();
    await this.orders.save(order);
    return toOrderOutput(order);
  }
}
