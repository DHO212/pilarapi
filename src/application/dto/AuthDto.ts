export type RegisterInput = {
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthOutput = {
  user: { id: string; email: string; createdAt: string };
  token: string;
};

export type MeOutput = {
  id: string;
  email: string;
  createdAt: string;
};
