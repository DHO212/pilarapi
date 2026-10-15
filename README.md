# PilarAPI

Iseng bikin API buat latihan Clean Architecture yang bener, bukan yang asal layering doang.

Awalnya cuma Task API, terus keterusan nambah Auth sama Payment. Ternyata enak juga pake vertical slice, mau nambah fitur baru gak perlu bongkar yang lama.

## Kenapa bikin ini

Bosen liat contoh CRUD yang semua logic numpuk di controller. Disini gw coba pisahin bener sesuai SOLID, domain gak boleh tau infra, validasi di Value Object, logic di entity. Sekalian latihan TDD juga.

## Tech stack

- TypeScript strict
- Node http native aja, gak pake framework
- Jest buat test

## Struktur

```
src/domain        -> entity, value object, repository interface
src/application   -> use case, dto, port
src/infrastructure-> implementasi repo sama security
src/presentation  -> http routing
tests             -> unit + integration
docs/adr          -> catatan keputusan arsitektur
```

Tiap fitur (task, auth, payment) punya slice sendiri. Jadi kalo mau nambah fitur baru tinggal bikin slice baru.

## Cara jalanin

```bash
npm ci
npm run verify  # cek type + lint + test sekalian
npm start       # jalan di localhost:3000
```

Design arsitekturnya ada di `design.html` tinggal buka di browser.

## API

Task:
- POST /tasks
- GET /tasks, GET /tasks/:id
- PATCH /tasks/:id, PATCH /tasks/:id/status
- DELETE /tasks/:id

Auth:
- POST /auth/register, POST /auth/login
- GET /auth/me (pake Bearer token)

Payment:
- POST /orders, GET /orders, GET /orders/:id
- POST /orders/:id/pay, POST /orders/:id/cancel

Semua validasi udah di Value Object jadi kalo ada yang invalid langsung 400.

## Test

66 test, coverage 91% lines. Jalannya `npm test` atau `npm run verify`.

## Next

Rencananya mau ganti InMemory repo ke Postgres pake Prisma, terus nambah domain event buat OrderPaid biar gak coupling ke notifikasi. ADR nya udah gw tulis di `docs/adr`.

---

Dibikin sambil belajar, kalo ada yang bisa di improve kabarin aja.
