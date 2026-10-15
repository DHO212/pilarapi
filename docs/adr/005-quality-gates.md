# ADR 005: Quality Gates — ESLint (no-else, max-lines) + TDD

Date: 2026-10-15
Status: Accepted

## Context
SOLID tanpa gate gampang regress — butuh enforcement otomatis.

## Decision
- ESLint: `no-restricted-syntax: IfStatement[alternate]` → no else (guard/early return) — src only — tests exempt
- `max-lines` 80 (domain) / 120 (app/infra) / 180 (presentation) — `max-lines-per-function` 20/30 — enforce class <50 lines (calisthenics)
- `@typescript-eslint/no-explicit-any: error` — no any
- Scripts: `lint` (eslint), `lint:types` (tsc --noEmit), `verify` (types+lint+test) — CI tinggal `npm run verify`
- TDD: RED (failing test) → GREEN (simplest pass) → REFACTOR (VO, pattern emerge) — 66 tests, 91% lines

## Consequences
- Pro: senior rule auto-enforced — PR fail kalau pakai else / class kebesaran
- Con: butuh tuning awal (presentation wiring dikecualikan via override) — sekarang sudah hijau
