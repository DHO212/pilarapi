import type { TaskDescription, TaskId, TaskTitle } from "../value-objects/TaskValueObjects";
import { ValidationError } from "../errors/DomainError";

export type TaskStatus = "todo" | "in_progress" | "done";

const VALID_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ["in_progress"],
  in_progress: ["done", "todo"],
  done: [],
};

export class Task {
  private constructor(
    private readonly id: TaskId,
    private title: TaskTitle,
    private description: TaskDescription,
    private status: TaskStatus,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(params: { id: TaskId; title: TaskTitle; description: TaskDescription }): Task {
    const now = new Date();
    return new Task(params.id, params.title, params.description, "todo", now, now);
  }

  static reconstitute(params: {
    id: TaskId;
    title: TaskTitle;
    description: TaskDescription;
    status: TaskStatus;
    createdAt: Date;
    updatedAt: Date;
  }): Task {
    if (!VALID_STATUSES.includes(params.status)) throw new ValidationError(`Invalid status: ${params.status}`);
    return new Task(params.id, params.title, params.description, params.status, params.createdAt, params.updatedAt);
  }

  getId(): TaskId {
    return this.id;
  }

  getTitle(): TaskTitle {
    return this.title;
  }

  getDescription(): TaskDescription {
    return this.description;
  }

  getStatus(): TaskStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  rename(title: TaskTitle): void {
    this.title = title;
    this.touch();
  }

  changeDescription(description: TaskDescription): void {
    this.description = description;
    this.touch();
  }

  changeStatus(next: TaskStatus): void {
    if (!ALLOWED_TRANSITIONS[this.status].includes(next)) {
      throw new ValidationError(`Cannot transition from ${this.status} to ${next}`);
    }
    this.status = next;
    this.touch();
  }

  isDone(): boolean {
    return this.status === "done";
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
