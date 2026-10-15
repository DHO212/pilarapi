import * as http from "http";
import { createServer } from "../../src/presentation/server";

function req(
  server: http.Server,
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<{ status: number; body: unknown }> {
  const addr = server.address() as { port: number };
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const r = http.request(
      {
        hostname: "127.0.0.1",
        port: addr.port,
        path,
        method,
        headers: { ...(data ? { "Content-Type": "application/json" } : {}), ...(headers ?? {}) },
      },
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

describe("HTTP Auth — integration", () => {
  let server: http.Server;
  beforeAll((done) => {
    server = createServer();
    server.listen(0, done);
  });
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it("POST /auth/register -> 201 + POST /auth/login -> 200 + GET /auth/me -> 200", async () => {
    const reg = await req(server, "POST", "/auth/register", { email: "http@ex.com", password: "password123" });
    expect(reg.status).toBe(201);
    const token = (reg.body as { token: string }).token;
    expect(token).toBeTruthy();

    const login = await req(server, "POST", "/auth/login", { email: "http@ex.com", password: "password123" });
    expect(login.status).toBe(200);

    const me = await req(server, "GET", "/auth/me", undefined, { Authorization: `Bearer ${token}` });
    expect(me.status).toBe(200);
    expect((me.body as { email: string }).email).toBe("http@ex.com");
  });

  it("register duplicate -> 409", async () => {
    await req(server, "POST", "/auth/register", { email: "dup2@ex.com", password: "password123" });
    const dup = await req(server, "POST", "/auth/register", { email: "dup2@ex.com", password: "password123" });
    expect(dup.status).toBe(409);
  });

  it("register invalid -> 400", async () => {
    expect((await req(server, "POST", "/auth/register", { email: "bad", password: "short" })).status).toBe(400);
    expect((await req(server, "POST", "/auth/register", { email: "", password: "" })).status).toBe(400);
  });

  it("login wrong password -> 401", async () => {
    await req(server, "POST", "/auth/register", { email: "wrongpw@ex.com", password: "password123" });
    const bad = await req(server, "POST", "/auth/login", { email: "wrongpw@ex.com", password: "otherpass123" });
    expect(bad.status).toBe(401);
  });

  it("GET /auth/me without token -> 401", async () => {
    const res = await req(server, "GET", "/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET /auth/me with garbage token -> 401", async () => {
    const res = await req(server, "GET", "/auth/me", undefined, { Authorization: "Bearer garbage" });
    expect(res.status).toBe(401);
  });
});
