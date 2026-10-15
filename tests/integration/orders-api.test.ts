import * as http from "http";
import { createServer } from "../../src/presentation/server";

function req(
  server: http.Server,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const addr = server.address() as { port: number };
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const r = http.request(
      { hostname: "127.0.0.1", port: addr.port, path, method, headers: data ? { "Content-Type": "application/json" } : {} },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: buf ? JSON.parse(buf) : null }));
      },
    );
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

describe("HTTP Orders — integration", () => {
  let server: http.Server;
  beforeAll((done) => {
    server = createServer();
    server.listen(0, done);
  });
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it("POST /orders -> 201, GET /orders lists, POST /orders/:id/pay -> paid", async () => {
    const created = await req(server, "POST", "/orders", { payerId: "user-1", amount: 25000, currency: "IDR" });
    expect(created.status).toBe(201);
    const id = (created.body as { id: string }).id;
    const listed = await req(server, "GET", "/orders");
    expect(listed.status).toBe(200);
    const pay = await req(server, "POST", `/orders/${id}/pay`);
    expect(pay.status).toBe(200);
    expect(((pay.body as { order: { status: string } }).order.status)).toBe("paid");
  });

  it("POST /orders with zero amount -> 400", async () => {
    const res = await req(server, "POST", "/orders", { payerId: "user-1", amount: 0 });
    expect(res.status).toBe(400);
  });

  it("POST /orders with empty payerId -> 400", async () => {
    const res = await req(server, "POST", "/orders", { payerId: "", amount: 1000 });
    expect(res.status).toBe(400);
  });

  it("POST /orders/:id/cancel cancels pending", async () => {
    const cr = await req(server, "POST", "/orders", { payerId: "user-2", amount: 5000 });
    const id = (cr.body as { id: string }).id;
    const cancelled = await req(server, "POST", `/orders/${id}/cancel`);
    expect(cancelled.status).toBe(200);
    expect((cancelled.body as { status: string }).status).toBe("cancelled");
  });

  it("pay then cancel fails 400", async () => {
    const cr = await req(server, "POST", "/orders", { payerId: "user-3", amount: 7000 });
    const id = (cr.body as { id: string }).id;
    await req(server, "POST", `/orders/${id}/pay`);
    const bad = await req(server, "POST", `/orders/${id}/cancel`);
    expect(bad.status).toBe(400);
  });

  it("pay unknown order -> 404", async () => {
    const res = await req(server, "POST", "/orders/__nope__/pay");
    expect(res.status).toBe(404);
  });
});
