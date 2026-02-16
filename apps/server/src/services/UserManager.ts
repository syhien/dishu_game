import { User } from '../types';

export class UserManager {
  private users: Map<string, User> = new Map();

  createUser(id: string, name: string, avatar: string): User {
    const user: User = {
      id,
      name,
      avatar,
      isOnline: true,
      joinedAt: Date.now()
    };
    this.users.set(id, user);
    return user;
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  removeUser(id: string): void {
    this.users.delete(id);
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (user) {
      Object.assign(user, updates);
      return user;
    }
    return undefined;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}
