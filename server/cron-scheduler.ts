import cron from "node-cron";
import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { dbSchema, users } from "@/shared/schema";
import { handleTrialExpiration, notifyDailyLimitReset } from "./subscription-service";

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

  /**
   * Cron Job 1: Trial Expiration Check
   * Runs daily at 9:00 AM
   * Checks all users for trial expiration and sends warnings/upsells
   *
   * Cron format: second minute hour dayOfMonth month dayOfWeek
   * "0 9 * * *" = 9:00 AM every day
   */
  const trialExpirationJob = cron.schedule("0 9 * * *", async () => {
    console.log("[Cron] Starting trial expiration check...");
    try {
      const userIds = await getAllUsers();
      console.log(`[Cron] Checking ${userIds.length} users for trial expiration...`);

      let checked = 0;
      let withTrials = 0;

      for (const userId of userIds) {
        try {
          await handleTrialExpiration(userId);
          checked++;
        } catch (error) {
          console.error(`[Cron] Error checking trial for user ${userId}:`, error);
        }
      }

      console.log(`[Cron] Trial expiration check completed. Checked: ${checked} users`);
    } catch (error) {
      console.error("[Cron] Error in trial expiration job:", error);
    }
  });

  /**
   * Cron Job 2: Daily Limit Reset Check
   * Runs daily at 12:00 AM (midnight)
   * Sends daily limit reset notifications to free tier users
   *
   * "0 0 * * *" = 12:00 AM (midnight) every day
   */
  const dailyLimitResetJob = cron.schedule("0 0 * * *", async () => {
    console.log("[Cron] Starting daily limit reset notifications...");
    try {
      const userIds = await getAllUsers();
      console.log(`[Cron] Sending daily reset notifications to ${userIds.length} users...`);

      let sent = 0;

      for (const userId of userIds) {
        try {
          await notifyDailyLimitReset(userId);
          sent++;
        } catch (error) {
          console.error(
            `[Cron] Error sending daily reset notification to user ${userId}:`,
            error
          );
        }
      }

      console.log(`[Cron] Daily limit reset completed. Sent: ${sent} notifications`);
    } catch (error) {
      console.error("[Cron] Error in daily limit reset job:", error);
    }
  });

  /**
   * Optional: Cron Job 3: Re-engagement Notifications
   * Runs daily at 6:00 PM
   * Sends random engagement messages to users who haven't opened app recently
   *
   * "0 18 * * *" = 6:00 PM every day
   * Disabled by default - uncomment to enable
   */
  // const engagementJob = cron.schedule("0 18 * * *", async () => {
  //   console.log("[Cron] Starting re-engagement notifications...");
  //   try {
  //     // TODO: Implement logic to:
  //     // 1. Find users who haven't opened app in 7+ days
  //     // 2. Randomly send engagement notification to 10% of them
  //     // 3. Track engagement metrics
  //   } catch (error) {
  //     console.error("[Cron] Error in engagement job:", error);
  //   }
  // });

  console.log("[Cron] ✓ Trial expiration check scheduled for 9:00 AM daily");
  console.log("[Cron] ✓ Daily limit reset scheduled for 12:00 AM (midnight) daily");
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
