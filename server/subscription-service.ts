import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { userSubscriptions, dbSchema } from "@/shared/schema";
import { eq } from "drizzle-orm";
import {
  sendTrialExpiringWarning,
  sendTrialExpiredUpsell,
  sendDailyLimitReset,
  sendSubscriptionUpgradeSuccess,
} from "./push-notifications";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db: NodePgDatabase<typeof dbSchema> = drizzle(pool, { schema: dbSchema });

/**
 * Subscription status type definition
 */
export interface SubscriptionStatus {
  isSubscribed: boolean; // true if user has active subscription or trial
  isPaid: boolean; // true if user has paid subscription (not trial)
  isTrialActive: boolean; // true if user is within trial period
  plan: "free-trial" | "premium" | "free"; // Current plan
  trialExpiresAt?: Date; // When trial expires
  subscriptionExpiresAt?: Date; // When subscription expires
  daysRemaining?: number; // Days left in trial
}

/**
 * Get user subscription status
 * Handles all edge cases including expired trials and subscriptions
 */
export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  try {
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
    });

    const now = new Date();

    // Default: free user
    if (!subscription) {
      return {
        isSubscribed: false,
        isPaid: false,
        isTrialActive: false,
        plan: "free",
      };
    }

    // Check if trial is still active
    const isTrialActive =
      subscription.trialStartedAt &&
      subscription.trialExpiresAt &&
      subscription.trialExpiresAt > now;

    // Check if paid subscription is still active
    const isPaidActive =
      subscription.isSubscribed &&
      subscription.subscriptionExpiresAt &&
      subscription.subscriptionExpiresAt > now;

    // If trial is active, user has full access
    if (isTrialActive) {
      const daysRemaining = Math.ceil(
        (subscription.trialExpiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        isSubscribed: true,
        isPaid: false,
        isTrialActive: true,
        plan: "free-trial",
        trialExpiresAt: subscription.trialExpiresAt || undefined,
        daysRemaining: Math.max(0, daysRemaining),
      };
    }

    // If paid subscription is active
    if (isPaidActive) {
      return {
        isSubscribed: true,
        isPaid: true,
        isTrialActive: false,
        plan: "premium",
        subscriptionExpiresAt: subscription.subscriptionExpiresAt || undefined,
      };
    }

    // Trial or subscription expired - user is now free
    return {
      isSubscribed: false,
      isPaid: false,
      isTrialActive: false,
      plan: "free",
      trialExpiresAt: subscription.trialExpiresAt || undefined,
      subscriptionExpiresAt: subscription.subscriptionExpiresAt || undefined,
    };
  } catch (error) {
    console.error("Error getting subscription status:", error);
    // Default to free on error
    return {
      isSubscribed: false,
      isPaid: false,
      isTrialActive: false,
      plan: "free",
    };
  }
}

/**
 * Start a free trial for a user
 * - Creates subscription record if it doesn't exist
 * - Sets trial start date to now
 * - Sets trial expiration to 3 days from now
 * - After 3 days: User must be charged via RevenueCat payment system
 * - Returns the new subscription status
 * 
 * IMPORTANT: After trial expires:
 * 1. Frontend checks getUserSubscriptionStatus()
 * 2. If trial expired (trialExpiresAt < now) and not yet paid
 * 3. Show paywall to user to complete payment via RevenueCat
 * 4. Once payment succeeds: isSubscribed = true, subscriptionExpiresAt set to 1 year later
 */
export async function startFreeTrial(userId: string): Promise<SubscriptionStatus> {
  try {
    const now = new Date();
    const trialExpiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

    // Check if subscription record exists
    const existingSubscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
    });

    if (existingSubscription) {
      // User already has a subscription record
      // Only start trial if they haven't started one yet
      if (!existingSubscription.trialStartedAt) {
        // Update: start new trial
        await db
          .update(userSubscriptions)
          .set({
            trialStartedAt: now,
            trialExpiresAt: trialExpiresAt,
            updatedAt: now,
          })
          .where(eq(userSubscriptions.userId, userId));
      } else {
      }
    } else {
      // Create new subscription record with trial
      await db.insert(userSubscriptions).values({
        userId,
        isSubscribed: false, // Trial is not a paid subscription
        trialStartedAt: now,
        trialExpiresAt: trialExpiresAt,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Return updated status
    return getUserSubscriptionStatus(userId);
  } catch (error) {
    throw new Error("Failed to start free trial");
  }
}

/**
 * Handle trial expiration - called by a cron job or when user opens app after trial ends
 * - Automatically triggers in-app purchase flow (via RevenueCat)
 * - OR shows subscription prompt to user
 * - Sends push notifications for engagement
 */
export async function handleTrialExpiration(userId: string): Promise<void> {
  try {
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
    });

    if (!subscription) return;

    const now = new Date();
    const isTrialExpired =
      subscription.trialExpiresAt && subscription.trialExpiresAt < now && !subscription.isSubscribed;

    if (isTrialExpired) {
      console.log(`[Trial] Trial expired for user ${userId}. Ready for conversion to paid plan.`);

      // Send trial expired upsell notification to user
      try {
        await sendTrialExpiredUpsell(userId);
      } catch (notificationError) {
        console.error("Error sending trial expiration notification:", notificationError);
        // Don't fail the whole operation if notification fails
      }

      // In a production app:
      // 1. Trigger RevenueCat to show payment prompt
      // 2. Update analytics with trial-to-paid conversion data
    } else if (
      subscription.trialExpiresAt &&
      subscription.trialExpiresAt > now &&
      !subscription.isSubscribed
    ) {
      // Trial is still active - check if we should send warning
      const daysRemaining = Math.ceil(
        (subscription.trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send reminder at 1 day and 3 days remaining
      if (daysRemaining === 1 || daysRemaining === 3) {
        console.log(`[Trial] Sending expiration warning for user ${userId}: ${daysRemaining} days left`);
        try {
          await sendTrialExpiringWarning(userId, daysRemaining);
        } catch (notificationError) {
          console.error("Error sending trial warning notification:", notificationError);
        }
      }
    }
  } catch (error) {
    console.error("Error handling trial expiration:", error);
  }
}

/**
 * Check if user should see daily limits
 * - Trial users: NO limits
 * - Paid users: NO limits
 * - Free users: 2 replies per day
 */
export async function shouldEnforceDailyLimits(userId: string): Promise<boolean> {
  const status = await getUserSubscriptionStatus(userId);
  // Only enforce limits for free users (not trial, not paid)
  return status.plan === "free";
}

/**
 * Get daily limit for a user
 */
export async function getDailyLimitForUser(userId: string): Promise<number> {
  const shouldEnforce = await shouldEnforceDailyLimits(userId);
  return shouldEnforce ? 2 : Infinity; // 2 per day for free, unlimited otherwise
}

/**
 * Send daily limit reset notification to a free user
 * Called at midnight or when user's daily limit resets
 */
export async function notifyDailyLimitReset(userId: string): Promise<void> {
  try {
    const shouldEnforce = await shouldEnforceDailyLimits(userId);

    // Only send to free users
    if (!shouldEnforce) {
      return;
    }

    console.log(`[Notifications] Sending daily limit reset notification to user ${userId}`);

    try {
      await sendDailyLimitReset(userId);
    } catch (notificationError) {
      console.error("Error sending daily limit reset notification:", notificationError);
      // Don't fail - user can still use the app
    }
  } catch (error) {
    console.error("Error notifying daily limit reset:", error);
  }
}

/**
 * Notify user of successful subscription upgrade
 */
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
