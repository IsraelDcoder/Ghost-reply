import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { userSubscriptions, dbSchema } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { sendSubscriptionUpgradeSuccess } from "./push-notifications";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db: NodePgDatabase<typeof dbSchema> = drizzle(pool, { schema: dbSchema });

/**
 * Subscription status type definition
 */
export interface SubscriptionStatus {
  isSubscribed: boolean; // true if user has active paid subscription
  isPaid: boolean; // true if user has paid subscription
  isTrialActive: boolean; // always false in hard paywall mode
  plan: "premium" | "free"; // Current plan
  subscriptionExpiresAt?: Date; // When paid subscription expires
}

/**
 * Get user subscription status
 * In hard paywall mode, only active paid subscriptions count.
 */
export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  try {
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
    });

    const now = new Date();

    if (!subscription) {
      return {
        isSubscribed: false,
        isPaid: false,
        isTrialActive: false,
        plan: "free",
      };
    }

    const expiresAt = subscription.subscriptionExpiresAt;
    const isPaidActive =
      subscription.isSubscribed &&
      expiresAt !== null &&
      expiresAt > now;

    if (isPaidActive) {
      return {
        isSubscribed: true,
        isPaid: true,
        isTrialActive: false,
        plan: "premium",
        subscriptionExpiresAt: expiresAt,
      };
    }

    return {
      isSubscribed: false,
      isPaid: false,
      isTrialActive: false,
      plan: "free",
    };
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return {
      isSubscribed: false,
      isPaid: false,
      isTrialActive: false,
      plan: "free",
    };
  }
}

export async function notifySubscriptionSuccess(
  userId: string,
  planName: string = "Premium"
): Promise<void> {
  try {
    console.log(`[Notifications] Sending subscription success notification to user ${userId}`);

    try {
      await sendSubscriptionUpgradeSuccess(userId, planName);
    } catch (notificationError) {
      console.error("Error sending subscription success notification:", notificationError);
    }
  } catch (error) {
    console.error("Error notifying subscription success:", error);
  }
}
