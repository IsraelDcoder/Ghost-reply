import { v4 as uuidv4 } from "uuid";
import { Pool } from "pg";
import { users, dbSchema } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

let db: NodePgDatabase<typeof dbSchema> | null = null;

function getDb(): NodePgDatabase<typeof dbSchema> {
  if (!db) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    db = drizzle(pool, { schema: dbSchema });
  }
  return db;
}

/**
 * Get or create a user by device ID
 */
export async function getOrCreateDevice(deviceId: string) {
  if (!deviceId) {
    throw new Error("Device ID is required");
  }

  const database = getDb();

  try {
    // Try to find existing user
    const existingUser = await database.query.users.findFirst({
      where: eq(users.deviceId, deviceId),
    });

    if (existingUser) {
      // Update last active time
      await database
        .update(users)
        .set({ lastActiveAt: new Date() })
        .where(eq(users.id, existingUser.id));

      return existingUser;
    }

    // Create new user
    const result = await database
      .insert(users)
      .values({
        deviceId,
        createdAt: new Date(),
        lastActiveAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Get or create device error:", error);
    throw error;
  }
}

/**
 * Validate device ID from request
 */
export function extractDeviceId(req: any): string | null {
  // Try multiple sources: header, query, body
  const deviceId =
    req.headers["x-device-id"] ||
    req.headers["device-id"] ||
    req.query?.deviceId ||
    req.body?.deviceId;

  if (!deviceId || typeof deviceId !== "string") {
    return null;
  }

  return deviceId.trim();
}

/**
 * Generate a new device ID if needed
 */
export function generateDeviceId(): string {
  return `device_${uuidv4()}`;
}
