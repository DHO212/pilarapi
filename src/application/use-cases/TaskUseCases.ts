import { Task } from "../../domain/entities/Task";
import { TaskNotFoundError } from "../../domain/errors/DomainError";
import type { TaskRepository } from "../../domain/repositories/TaskRepository";
import { TaskDescription, TaskId, TaskTitle } from "../../domain/value-objects/TaskValueObjects";
import type { CreateTaskInput, TaskOutput, UpdateTaskInput } from "../dto/TaskDto";
import { toTaskOutput } from "../dto/TaskMapper";
import type { IdGenerator } from "../ports/IdGenerator";
import type { TaskStatus } from "../../domain/entities/Task";

export class CreateTaskUseCase {
  constructor(
    private readonly repo: TaskRepository,
    private readonly idGen: IdGenerator,
  ) {}

  async execute(input: CreateTaskInput): Promise<TaskOutput> {
    const id = TaskId.create(this.idGen.generate());
    const title = TaskTitle.create(input.title);
    const description = TaskDescription.create(input.description ?? "");
    const task = Task.create({ id, title, description });
    await this.repo.save(task);
    return toTaskOutput(task);
  }
}

export class ListTasksUseCase {
  constructor(private readonly repo: TaskRepository) {}

  async execute(): Promise<TaskOutput[]> {
    const tasks = await this.repo.findAll();
    return tasks.map(toTaskOutput);
  }
}

export class GetTaskUseCase {
  constructor(private readonly repo: TaskRepository) {}

  async execute(id: string): Promise<TaskOutput> {
    const taskId = TaskId.create(id);
    const task = await this.repo.findById(taskId);
    if (!task) throw new TaskNotFoundError(id);
    return toTaskOutput(task);
  }
}

export class UpdateTaskUseCase {
  constructor(private readonly repo: TaskRepository) {}

  async execute(id: string, input: UpdateTaskInput): Promise<TaskOutput> {
    const taskId = TaskId.create(id);
    const task = await this.repo.findById(taskId);
    if (!task) throw new TaskNotFoundError(id);
    if (input.title !== undefined) task.rename(TaskTitle.create(input.title));
    if (input.description !== undefined) task.changeDescription(TaskDescription.create(input.description));
    await this.repo.save(task);
    return toTaskOutput(task);
  }
}

export class ChangeStatusUseCase {
  constructor(private readonly repo: TaskRepository) {}

  async execute(id: string, status: TaskStatus): Promise<TaskOutput> {
    const taskId = TaskId.create(id);
    const task = await this.repo.findById(taskId);
    if (!task) throw new TaskNotFoundError(id);
    task.changeStatus(status);
    await this.repo.save(task);
    return toTaskOutput(task);
  }
}

export class DeleteTaskUseCase {
  constructor(private readonly repo: TaskRepository) {}

  async execute(id: string): Promise<void> {
    const taskId = TaskId.create(id);
    const task = await this.repo.findById(taskId);
    if (!task) throw new TaskNotFoundError(id);
    await this.repo.delete(taskId);
  }
}
