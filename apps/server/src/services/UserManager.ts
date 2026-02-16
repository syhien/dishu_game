import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class UserManager {
  private usersById: Map<string, User> = new Map();
  private socketToUserId: Map<string, string> = new Map();
  private sessionToUserId: Map<string, string> = new Map();

  createOrReconnectUser(socketId: string, name: string, avatar: string, sessionId?: string): User {
    const restoredUserId = sessionId ? this.sessionToUserId.get(sessionId) : undefined;
    if (restoredUserId) {
      const restoredUser = this.usersById.get(restoredUserId);
      if (restoredUser) {
        restoredUser.name = name;
        restoredUser.avatar = avatar;
        restoredUser.isOnline = true;
        this.socketToUserId.set(socketId, restoredUser.id);
        return restoredUser;
      }
      if (sessionId) {
        this.sessionToUserId.delete(sessionId);
      }
    }

    const user: User = {
      id: uuidv4(),
      name,
      avatar,
      isOnline: true,
      joinedAt: Date.now()
    };

    this.usersById.set(user.id, user);
    this.socketToUserId.set(socketId, user.id);
    if (sessionId) {
      this.sessionToUserId.set(sessionId, user.id);
    }
    return user;
  }

  getUser(socketId: string): User | undefined {
    const userId = this.socketToUserId.get(socketId);
    if (!userId) {
      return undefined;
    }
    return this.usersById.get(userId);
  }

  getUserById(userId: string): User | undefined {
    return this.usersById.get(userId);
  }

  markOffline(socketId: string): User | undefined {
    const user = this.getUser(socketId);
    this.socketToUserId.delete(socketId);
    if (user) {
      user.isOnline = false;
    }
    return user;
  }

  removeUser(userId: string): void {
    this.usersById.delete(userId);
    for (const [socketId, mappedUserId] of this.socketToUserId.entries()) {
      if (mappedUserId === userId) {
        this.socketToUserId.delete(socketId);
      }
    }
    for (const [sessionId, mappedUserId] of this.sessionToUserId.entries()) {
      if (mappedUserId === userId) {
        this.sessionToUserId.delete(sessionId);
      }
    }
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.usersById.get(id);
    if (user) {
      Object.assign(user, updates);
      return user;
    }
    return undefined;
  }

  getAllUsers(): User[] {
    return Array.from(this.usersById.values());
  }
}
