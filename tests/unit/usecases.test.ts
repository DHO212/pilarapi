import { InMemoryTaskRepository } from "../../src/infrastructure/repositories/InMemoryTaskRepository";
import { TaskDescription, TaskId, TaskTitle } from "../../src/domain/value-objects/TaskValueObjects";
import { Task } from "../../src/domain/entities/Task";
import {
  ChangeStatusUseCase,
  CreateTaskUseCase,
  DeleteTaskUseCase,
  GetTaskUseCase,
  ListTasksUseCase,
  UpdateTaskUseCase,
} from "../../src/application/use-cases/TaskUseCases";

function fixedIdGen(value: string) {
  return { generate: () => value };
}

describe("Use cases — TDD Green path", () => {
  let repo: InMemoryTaskRepository;

  beforeEach(() => {
    repo = new InMemoryTaskRepository();
  });

  it("CreateTaskUseCase creates and persists task", async () => {
    const uc = new CreateTaskUseCase(repo, fixedIdGen("id-1"));
    const out = await uc.execute({ title: "My task", description: "desc" });
    expect(out.id).toBe("id-1");
    expect(out.title).toBe("My task");
    expect(out.status).toBe("todo");
    expect((await repo.findAll()).length).toBe(1);
  });

  it("CreateTaskUseCase validates title (empty fails)", async () => {
    const uc = new CreateTaskUseCase(repo, fixedIdGen("id-x"));
    await expect(uc.execute({ title: "   " })).rejects.toThrow(/cannot be empty/i);
  });

  it("List / Get / Update / Delete flow", async () => {
    const create = new CreateTaskUseCase(repo, fixedIdGen("id-2"));
    const list = new ListTasksUseCase(repo);
    const get = new GetTaskUseCase(repo);
    const update = new UpdateTaskUseCase(repo);
    const del = new DeleteTaskUseCase(repo);

    await create.execute({ title: "A" });
    expect((await list.execute()).length).toBe(1);
    expect((await get.execute("id-2")).title).toBe("A");

    await update.execute("id-2", { title: "B" });
    expect((await get.execute("id-2")).title).toBe("B");

    await del.execute("id-2");
    await expect(get.execute("id-2")).rejects.toThrow(/not found/i);
  });

  it("ChangeStatusUseCase enforces allowed transitions", async () => {
    const create = new CreateTaskUseCase(repo, fixedIdGen("id-3"));
    const change = new ChangeStatusUseCase(repo);
    await create.execute({ title: "S" });
    await expect(change.execute("id-3", "done")).rejects.toThrow(/cannot transition/i);
    await change.execute("id-3", "in_progress");
    await change.execute("id-3", "done");
    const get = new GetTaskUseCase(repo);
    expect((await get.execute("id-3")).status).toBe("done");
  });

  it("GetTask throws NotFound for unknown id", async () => {
    const get = new GetTaskUseCase(repo);
    await expect(get.execute("nope")).rejects.toThrow(/not found/i);
  });

  it("repo is abstraction — swap impl without changing use case (DIP)", async () => {
    // proving DIP: use case depends on TaskRepository interface, not InMemoryTaskRepository concretion
    const fakeRepo: InMemoryTaskRepository = repo;
    const uc = new ListTasksUseCase(fakeRepo);
    await expect(uc.execute()).resolves.toEqual([]);
  });
});
