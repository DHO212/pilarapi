# ADR 004: Payment — Money Minor Unit + Idempotency + Gateway Port

Date: 2026-10-15
Status: Accepted

## Context
Float untuk uang rawan error. Gateway eksternal butuh idempotency dan swappable.

## Decision
- Money: integer minor unit + currency string — `Money.create(25000, "IDR")` — add() cek currency mismatch — isZero() cek
- PaymentGateway port: `charge({ amount: Money, idempotencyKey: string })` — PayOrderUseCase pakai `paymentId` sebagai idempotencyKey
- TogglePaymentGateway / FakePaymentGateway untuk test deterministik — prod swap ke Xendit/Stripe tanpa ubah use-case (OCP)
- Order state-machine via OrderLifecycle — pending → paid/cancelled — transition guard — no else

## Consequences
- Pro: uang presisi — no float — explicit currency
- Pro: idempotency built-in — retry aman
- Con: minor unit butuh konversi di UI (tampilkan 25000 → Rp 25.000 di mapper)
