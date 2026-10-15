import type { Task } from "../entities/Task";
import type { TaskId } from "../value-objects/TaskValueObjects";

// First-Class Collection — wrap array, kasih behavior, bukan expose array mentah
export class TaskCollection {
  constructor(private readonly items: Task[] = []) {}

  add(task: Task): void {
    this.items.push(task);
  }

  remove(id: TaskId): void {
    const idx = this.items.findIndex((t) => t.getId().equals(id));
    if (idx !== -1) this.items.splice(idx, 1);
  }

  findById(id: TaskId): Task | null {
    return this.items.find((t) => t.getId().equals(id)) ?? null;
  }

  filterDone(): Task[] {
    return this.items.filter((t) => t.isDone());
  }

  filterByStatus(status: string): Task[] {
    return this.items.filter((t) => t.getStatus() === status);
  }

  toArray(): Task[] {
    return [...this.items];
  }

  count(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}
