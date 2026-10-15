import type { Task } from "../../domain/entities/Task";
import type { TaskRepository } from "../../domain/repositories/TaskRepository";
import type { TaskId } from "../../domain/value-objects/TaskValueObjects";

export class InMemoryTaskRepository implements TaskRepository {
  private store = new Map<string, Task>();

  async save(task: Task): Promise<void> {
    this.store.set(task.getId().toString(), task);
  }

  async findById(id: TaskId): Promise<Task | null> {
    return this.store.get(id.toString()) ?? null;
  }

  async findAll(): Promise<Task[]> {
    return [...this.store.values()];
  }

  async delete(id: TaskId): Promise<void> {
    this.store.delete(id.toString());
  }

  clear(): void {
    this.store.clear();
  }
}
