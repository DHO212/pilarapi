# ADR 001: Clean Architecture + Vertical Slices

Date: 2026-10-15
Status: Accepted

## Context
Portfolio harus demo senior-grade architecture yang gampang diextend tanpa ngerusak existing code. Option: layered tradisional vs Clean Architecture + vertical slices.

## Decision
Pakai Clean Architecture (domain/application/infrastructure/presentation) + vertical slices per fitur (Task / Auth / Payment). Domain owns interfaces (DIP), infra implements. Presentation cuma wiring.

## Consequences
- Pro: tambah slice baru tanpa sentuh slice lama — OCP terjaga — test per slice isolated
- Con: lebih banyak file awal — tapi tiap file kecil & fokus (SRP)
- Dependency rule enforced: domain zero import keluar — di-cek via tsc + eslint gate
