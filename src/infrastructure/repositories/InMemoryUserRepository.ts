import type { User } from "../../domain/entities/User";
import type { UserRepository } from "../../domain/repositories/UserRepository";
import type { Email, UserId } from "../../domain/value-objects/UserValueObjects";

export class InMemoryUserRepository implements UserRepository {
  private byId = new Map<string, User>();
  private byEmail = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.byId.set(user.getId().toString(), user);
    this.byEmail.set(user.getEmail().toString(), user);
  }

  async findById(id: UserId): Promise<User | null> {
    return this.byId.get(id.toString()) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    return this.byEmail.get(email.toString()) ?? null;
  }

  async findAll(): Promise<User[]> {
    return [...this.byId.values()];
  }

  clear(): void {
    this.byId.clear();
    this.byEmail.clear();
  }
}
