# ADR 003: Security — Scrypt Hasher + HMAC TokenIssuer (swappable via ports)

Date: 2026-10-15
Status: Accepted

## Context
Butuh auth tanpa nambah dependency berat — tapi tetap OCP/senior (gampang swap ke bcrypt/JWT lib).

## Decision
- Port interfaces: PasswordHasher, TokenIssuer (DIP) — use-case depend ke interface
- Infra default (stdlib-only): ScryptPasswordHasher (crypto.scrypt + timingSafeEqual) + HmacTokenIssuer (HS256, HMAC-SHA256, base64url)
- Fake impl untuk test cepat: FakePasswordHasher, FakeTokenIssuer (deterministic)
- Swap: ganti infra implement tanpa ubah domain/application — bukti DIP

## Consequences
- Pro: zero external deps — semua stdlib — mudah audit
- Pro: test cepat & deterministic (Fake)
- Con: Scrypt/HMAC bukan bcrypt/JWT standard — untuk portfolio/demo oke — prod swap ke lib proper via port yang sama
- Env: AUTH_SECRET via process.env, default "dev-secret-change-me" (wajib ganti di prod)
