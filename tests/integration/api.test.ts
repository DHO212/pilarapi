import * as http from "http";
import { createServer } from "../../src/presentation/server";

function req(server: http.Server, method: string, path: string, body?: unknown): Promise<{ status: number; body: unknown }> {
  const addr = server.address() as { port: number };
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const r = http.request(
      { hostname: "127.0.0.1", port: addr.port, path, method, headers: data ? { "Content-Type": "application/json" } : {} },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          const parsed = buf ? JSON.parse(buf) : null;
          resolve({ status: res.statusCode ?? 0, body: parsed });
        });
      },
    );
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

describe("HTTP API — integration", () => {
  let server: http.Server;

  beforeAll((done) => {
    server = createServer();
    server.listen(0, done);
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it("POST /tasks -> 201 + GET /tasks lists it", async () => {
    const created = await req(server, "POST", "/tasks", { title: "Porto A", description: "demo" });
    expect(created.status).toBe(201);
    const id = (created.body as { id: string }).id;
    const listed = await req(server, "GET", "/tasks");
    expect(listed.status).toBe(200);
    expect((listed.body as unknown[]).length).toBeGreaterThan(0);
    const got = await req(server, "GET", `/tasks/${id}`);
    expect(got.status).toBe(200);
  });

  it("validation: POST without title -> 400", async () => {
    const res = await req(server, "POST", "/tasks", { title: "" });
    expect(res.status).toBe(400);
  });

  it("PATCH /tasks/:id updates title", async () => {
    const cr = await req(server, "POST", "/tasks", { title: "Patch me" });
    const id = (cr.body as { id: string }).id;
    const patched = await req(server, "PATCH", `/tasks/${id}`, { title: "Patched" });
    expect(patched.status).toBe(200);
    expect((patched.body as { title: string }).title).toBe("Patched");
  });

  it("PATCH /tasks/:id/status enforces transitions", async () => {
    const cr = await req(server, "POST", "/tasks", { title: "Flow" });
    const id = (cr.body as { id: string }).id;
    const bad = await req(server, "PATCH", `/tasks/${id}/status`, { status: "done" });
    expect(bad.status).toBe(400);
    const ok = await req(server, "PATCH", `/tasks/${id}/status`, { status: "in_progress" });
    expect(ok.status).toBe(200);
  });

  it("DELETE /tasks/:id -> 204 and then 404", async () => {
    const cr = await req(server, "POST", "/tasks", { title: "Del me" });
    const id = (cr.body as { id: string }).id;
    const del = await req(server, "DELETE", `/tasks/${id}`);
    expect(del.status).toBe(204);
    const gone = await req(server, "GET", `/tasks/${id}`);
    expect(gone.status).toBe(404);
  });

  it("GET unknown -> 404", async () => {
    const res = await req(server, "GET", "/tasks/__nope__");
    expect(res.status).toBe(404);
  });
});
