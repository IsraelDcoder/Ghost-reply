import { users } from "@/shared/schema";
import { randomUUID } from "crypto";

type User = typeof users.$inferSelect;
type InsertUser = typeof users.$inferInsert;

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = Array.isArray(insertUser.deviceId) ? randomUUID() : insertUser.deviceId;
    const now = new Date();
    const user: User = {
      id,
      deviceId: insertUser.deviceId as unknown as string,
      createdAt: now,
      lastActiveAt: now,
    };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
