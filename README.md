# PilarAPI

Portofolio showcase yang 100% ngikutin skill `solid`: TDD Red-Green-Refactor, SOLID, Clean Code, Value Object, Law of Demeter.

## Arsitektur

```
src/
  domain/               # inti bisnis, zero dependency keluar
    entities/Task.ts        # Entity + state machine status
    value-objects/          # TaskId, TaskTitle, TaskDescription (validasi di sini)
    repositories/TaskRepository.ts  # interface (DIP)
    errors/DomainError.ts
  application/          # use case = 1 file per aksi
    use-cases/TaskUseCases.ts  # Create/List/Get/Update/ChangeStatus/Delete
    ports/IdGenerator.ts       # interface IdGenerator (DIP)
    dto/TaskDto + TaskMapper
  infrastructure/       # implementasi konkrit
    repositories/InMemoryTaskRepository.ts
  presentation/
    server.ts           # HTTP stdlib-only (tanpa framework)

tests/
  unit/domain.test.ts      # Value Object + Entity
  unit/usecases.test.ts    # Use case + repo abstraction
  integration/api.test.ts  # HTTP end-to-end
```

## Prinsip yang di-demo

- **SRP** — tiap class satu alasan berubah (Entity, UseCase, Repository, Mapper pisah)
- **OCP** — tambah status / repo baru tanpa ubah use case
- **LSP/ISP** — TaskRepository interface kecil, implementasi bisa di-swap
- **DIP** — use case depend ke interface, bukan ke InMemoryRepo
- **Value Object** — TaskId/Title/Description validasi mandiri, bukan primitive
- **TDD** — test ditulis dulu (lihat tests/unit/domain.test.ts)
- **Law of Demeter** — 1 dot per line, Tell Don't Ask (task.changeStatus, bukan if task.status === ...)
- **Fail fast + guard** — early return, tanpa else

## Cara jalanin

```bash
npm ci
npm run verify   # lint:types + lint (no-else, max-lines) + jest --coverage
npm run build
npm start         # http://localhost:3000
```

CI: `.github/workflows/verify.yml` jalan di push/PR — badge hijau kalau `npm run verify` lolos.

## API

| Method | Path | Body | Status |
|--------|------|------|--------|
| POST | /tasks | {title, description?} | 201 |
| GET | /tasks | - | 200 |
| GET | /tasks/:id | - | 200 / 404 |
| PATCH | /tasks/:id | {title?, description?} | 200 |
| PATCH | /tasks/:id/status | {status: "todo"\|"in_progress"\|"done"} | 200 / 400 |
| DELETE | /tasks/:id | - | 204 |

Transisi status: todo -> in_progress -> done, in_progress -> todo (reopen).

## Upgrade path buat portofolio beneran

- Ganti InMemoryTaskRepository -> Prisma/Drizzle Postgres (tanpa ubah domain/application)
- Tambah Auth slice (User, Session) sebagai vertical slice baru
- Tambah E2E test + CI + coverage badge

## Skill yang dipakai

`solid` (ramziddin/solid-skills) — full load, no aislop.
Referensi: solid-principles.md, tdd.md, clean-code.md, architecture.md, dll di D:\backuphermes\.hermes\skills\solid

## Slices tambahan (full load no aislop)

### Auth slice
- Value Objects: UserId, Email, PlainPassword, HashedPassword
- Entity: User
- Ports: PasswordHasher, TokenIssuer, IdGenerator (DIP)
- Use cases: Register, Login, Me (fail fast, guard)
- Infra: ScryptPasswordHasher + HmacTokenIssuer (swap ke bcrypt/JWT tanpa ubah domain), Fake* buat test
- API: POST /auth/register (201), POST /auth/login (200), GET /auth/me (Bearer)

### Payment slice
- Value Objects: Money (integer minor unit, currency), OrderId, PaymentId
- Entities: Order (pending->paid/cancelled), Payment (requires_payment->succeeded/failed)
- Ports: PaymentGateway (DIP/OCP — tambah gateway baru tanpa ubah use case), OrderRepository, PaymentRepository
- Use cases: CreateOrder, ListOrders, GetOrder, PayOrder (gateway charge + idempotency), CancelOrder
- Infra: InMemoryOrder/Payment repos, TogglePaymentGateway (deterministic buat test)
- API: POST /orders (201), GET /orders, GET /orders/:id, POST /orders/:id/pay, POST /orders/:id/cancel

Semua slice vertical — domain/application gak tau infra. Tambah slice baru gak nyentuh slice lama.

