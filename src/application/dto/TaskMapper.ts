import type { Task } from "../../domain/entities/Task";
import type { TaskOutput } from "../dto/TaskDto";

export function toTaskOutput(task: Task): TaskOutput {
  return {
    id: task.getId().toString(),
    title: task.getTitle().toString(),
    description: task.getDescription().toString(),
    status: task.getStatus(),
    createdAt: task.getCreatedAt().toISOString(),
    updatedAt: task.getUpdatedAt().toISOString(),
  };
}
