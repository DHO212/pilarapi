import * as http from "http";
import { InMemoryTaskRepository } from "../infrastructure/repositories/InMemoryTaskRepository";
import { InMemoryUserRepository } from "../infrastructure/repositories/InMemoryUserRepository";
import { CryptoIdGenerator } from "../application/ports/IdGenerator";
import { FakePasswordHasher, HmacTokenIssuer } from "../infrastructure/security/AuthInfra";
import {
  ChangeStatusUseCase,
  CreateTaskUseCase,
  DeleteTaskUseCase,
  GetTaskUseCase,
  ListTasksUseCase,
  UpdateTaskUseCase,
} from "../application/use-cases/TaskUseCases";
import { LoginUseCase, MeUseCase, RegisterUseCase } from "../application/use-cases/AuthUseCases";
import { InMemoryOrderRepository, InMemoryPaymentRepository } from "../infrastructure/repositories/InMemoryOrderRepos";
import { TogglePaymentGateway } from "../application/ports/PaymentGateway";
import { CancelOrderUseCase, CreateOrderUseCase as CreateOrderUC, GetOrderUseCase as GetOrderUC, ListOrdersUseCase, PayOrderUseCase } from "../application/use-cases/PaymentUseCases";

const taskRepo = new InMemoryTaskRepository();
const userRepo = new InMemoryUserRepository();
const idGen = new CryptoIdGenerator();
const hasher = new FakePasswordHasher();
const tokens = new HmacTokenIssuer(process.env.AUTH_SECRET ?? "dev-secret-change-me");

const createTask = new CreateTaskUseCase(taskRepo, idGen);
const listTasks = new ListTasksUseCase(taskRepo);
const getTask = new GetTaskUseCase(taskRepo);
const updateTask = new UpdateTaskUseCase(taskRepo);
const changeStatus = new ChangeStatusUseCase(taskRepo);
const deleteTask = new DeleteTaskUseCase(taskRepo);

const register = new RegisterUseCase(userRepo, hasher, tokens, idGen);
const login = new LoginUseCase(userRepo, hasher, tokens);
const me = new MeUseCase(userRepo, tokens);

const orderRepo = new InMemoryOrderRepository();
const paymentRepo = new InMemoryPaymentRepository();
const paymentGateway = new TogglePaymentGateway();
const createOrder = new CreateOrderUC(orderRepo, idGen);
const listOrders = new ListOrdersUseCase(orderRepo);
const getOrder = new GetOrderUC(orderRepo);
const payOrder = new PayOrderUseCase(orderRepo, paymentRepo, paymentGateway, idGen);
const cancelOrder = new CancelOrderUseCase(orderRepo);

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function parseBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
  });
}

function bearer(req: http.IncomingMessage): string {
  const h = req.headers.authorization ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}

export function createServer(): http.Server {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname;
    const method = req.method ?? "GET";
    try {
      if (path === "/auth/register" && method === "POST") {
        const body = (await parseBody(req)) as { email?: string; password?: string };
        const out = await register.execute({ email: body.email ?? "", password: body.password ?? "" });
        return json(res, 201, out);
      }
      if (path === "/auth/login" && method === "POST") {
        const body = (await parseBody(req)) as { email?: string; password?: string };
        const out = await login.execute({ email: body.email ?? "", password: body.password ?? "" });
        return json(res, 200, out);
      }
      if (path === "/auth/me" && method === "GET") {
        const out = await me.execute(bearer(req));
        return json(res, 200, out);
      }
      if (path === "/tasks" && method === "POST") {
        const body = (await parseBody(req)) as { title?: string; description?: string };
        const out = await createTask.execute({ title: body.title ?? "", description: body.description });
        return json(res, 201, out);
      }
      if (path === "/tasks" && method === "GET") {
        const out = await listTasks.execute();
        return json(res, 200, out);
      }
      const match = path.match(/^\/tasks\/([^/]+)(\/status)?$/);
      if (match) {
        const id = decodeURIComponent(match[1]);
        const isStatus = !!match[2];
        if (isStatus && method === "PATCH") {
          const body = (await parseBody(req)) as { status?: string };
          const out = await changeStatus.execute(id, body.status as never);
          return json(res, 200, out);
        }
        if (!isStatus && method === "GET") {
          const out = await getTask.execute(id);
          return json(res, 200, out);
        }
        if (!isStatus && method === "PATCH") {
          const body = (await parseBody(req)) as { title?: string; description?: string };
          const out = await updateTask.execute(id, body);
          return json(res, 200, out);
        }
        if (!isStatus && method === "DELETE") {
          await deleteTask.execute(id);
          res.writeHead(204);
          return res.end();
        }
      }
      // -- Orders & Payments --
      if (path === "/orders" && method === "POST") {
        const body = (await parseBody(req)) as { payerId?: string; amount?: number; currency?: string };
        const out = await createOrder.execute({ payerId: body.payerId ?? "", amount: body.amount ?? 0, currency: body.currency });
        return json(res, 201, out);
      }
      if (path === "/orders" && method === "GET") {
        const out = await listOrders.execute();
        return json(res, 200, out);
      }
      if (path.match(/^\/orders\/[^/]+$/) && method === "GET") {
        const id = decodeURIComponent(path.split("/")[2]);
        const out = await getOrder.execute(id);
        return json(res, 200, out);
      }
      if (path.match(/^\/orders\/[^/]+\/pay$/) && method === "POST") {
        const id = decodeURIComponent(path.split("/")[2]);
        const out = await payOrder.execute(id);
        return json(res, 200, out);
      }
      if (path.match(/^\/orders\/[^/]+\/cancel$/) && method === "POST") {
        const id = decodeURIComponent(path.split("/")[2]);
        const out = await cancelOrder.execute(id);
        return json(res, 200, out);
      }
      return json(res, 404, { error: "Not found" });
    } catch (e: unknown) {
      const err = e as Error & { name?: string };
      if (err.name === "ValidationError") return json(res, 400, { error: err.message });
      if (err.name === "TaskNotFoundError") return json(res, 404, { error: err.message });
      if (err.name === "EmailAlreadyTakenError") return json(res, 409, { error: err.message });
      if (err.name === "InvalidCredentialsError") return json(res, 401, { error: err.message });
      if (err.name === "UnauthorizedError") return json(res, 401, { error: err.message });
      if (err.name === "OrderNotFoundError") return json(res, 404, { error: err.message });
      if (err instanceof SyntaxError) return json(res, 400, { error: "Invalid JSON" });
      return json(res, 500, { error: (err as Error).message ?? "Internal error" });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3000);
  createServer().listen(port, () => console.log(`API listening on http://localhost:${port}`));
}
