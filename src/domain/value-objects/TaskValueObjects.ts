import { ValidationError } from "../errors/DomainError";

export class TaskId {
  private constructor(private readonly value: string) {}

  static create(value: string): TaskId {
    if (!value || !value.trim()) throw new ValidationError("TaskId cannot be empty");
    return new TaskId(value.trim());
  }

  static generate(): TaskId {
    return new TaskId(crypto.randomUUID());
  }

  toString(): string {
    return this.value;
  }

  equals(other: TaskId): boolean {
    return this.value === other.value;
  }
}

export class TaskTitle {
  private constructor(private readonly value: string) {}

  static create(value: string): TaskTitle {
    const v = value?.trim() ?? "";
    if (!v) throw new ValidationError("Title cannot be empty");
    if (v.length > 120) throw new ValidationError("Title max 120 chars");
    return new TaskTitle(v);
  }

  toString(): string {
    return this.value;
  }
}

export class TaskDescription {
  private constructor(private readonly value: string) {}

  static create(value: string): TaskDescription {
    const v = (value ?? "").trim();
    if (v.length > 500) throw new ValidationError("Description max 500 chars");
    return new TaskDescription(v);
  }

  toString(): string {
    return this.value;
  }

  isEmpty(): boolean {
    return this.value.length === 0;
  }
}
