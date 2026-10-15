import type { User } from "../entities/User";
import type { Email, UserId } from "../value-objects/UserValueObjects";

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findAll(): Promise<User[]>;
}
