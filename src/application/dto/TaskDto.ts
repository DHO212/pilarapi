export type CreateTaskInput = {
  title: string;
  description?: string;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
};

export type TaskOutput = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};
