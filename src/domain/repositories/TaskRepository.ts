import type { Task } from "../entities/Task";
import type { TaskId } from "../value-objects/TaskValueObjects";

export interface TaskRepository {
  save(task: Task): Promise<void>;
  findById(id: TaskId): Promise<Task | null>;
  findAll(): Promise<Task[]>;
  delete(id: TaskId): Promise<void>;
}
