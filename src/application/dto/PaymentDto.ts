export type CreateOrderInput = { payerId: string; amount: number; currency?: string };
export type OrderOutput = { id: string; payerId: string; amount: number; currency: string; status: string; createdAt: string; updatedAt: string };
export type PayOrderInput = { orderId: string };
export type PaymentOutput = { id: string; orderId: string; amount: number; currency: string; status: string; createdAt: string };
export type OrderWithPaymentOutput = { order: OrderOutput; payment: PaymentOutput | null };
