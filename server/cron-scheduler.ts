import cron from "node-cron";
import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { dbSchema, users } from "@/shared/schema";

/**
 * Cron Job Scheduler
 * Runs automated tasks for trial expiration checks and daily limit resets
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db: NodePgDatabase<typeof dbSchema> = drizzle(pool, { schema: dbSchema });

/**
 * Get all user IDs from database
 */
async function getAllUsers(): Promise<string[]> {
  try {
    const allUsers = await db.select({ id: users.id }).from(users);
    return allUsers.map((u) => u.id);
  } catch (error) {
    console.error("Error fetching users for cron job:", error);
    return [];
  }
}

/**
 * Initialize all scheduled cron jobs
 * Call this once on server startup
 */
export function initializeCronJobs(): void {
  console.log("[Cron] Initializing scheduled jobs...");

  console.log("[Cron] No trial or daily-limit cron jobs are registered in hard paywall mode.");
  console.log("[Cron] Jobs initialized successfully");
}

/**
 * Stop all cron jobs (for graceful shutdown)
 */
export function stopCronJobs(): void {
  console.log("[Cron] Stopping all scheduled jobs...");
  cron.getTasks().forEach((task) => task.stop());
  console.log("[Cron] All jobs stopped");
}
