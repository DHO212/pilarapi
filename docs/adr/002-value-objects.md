# ADR 002: Value Objects & First-Class Collections

Date: 2026-10-15
Status: Accepted

## Context
Primitive obsession (string/number mentah) bikin validasi scattered dan bug currency/empty. Koleksi array mentah bikin behavior scattered di repo.

## Decision
- Wrap semua domain primitives jadi Value Objects: TaskId, Email, Money (minor unit + currency), OrderDetails, OrderLifecycle, dll — validasi di constructor/factory, immutable.
- Wrap array jadi First-Class Collection: TaskCollection, OrderCollection — behavior (filterPaid, total) di collection, bukan di repo.

## Consequences
- Pro: invalid state unrepresentable — fail fast — searchability & type safety
- Pro: Law of Demeter terjaga — `order.getDetails().getAmount()` lewat VO, bukan `order.amount`
- Con: boilerplate ekstra — mitigasi: VO kecil (<20 lines) + factory `create`
