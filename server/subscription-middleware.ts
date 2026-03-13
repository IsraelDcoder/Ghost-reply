/**
 * Updated subscription check middleware
 * Replace the subscriptionCheckMiddleware in server/middleware.ts with this
 */

import type { Request, Response, NextFunction } from "express";
import { getUserSubscriptionStatus } from "./subscription-service";
import { db } from "./subscription-service";
import { userSubscriptions, conversations } from "@/shared/schema";
import { eq, lt, isNotNull, and } from "drizzle-orm";

/**
 * Enhanced subscription validation middleware
 * Uses new subscription service for accurate trial/paid tracking
 */
export async function subscriptionCheckMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = (req as any).user;

    if (!user) {
      (req as any).subscription = {
        isSubscribed: false,
        isPaid: false,
        isTrialActive: false,
        plan: "free",
      };
      return next();
    }

    // Use the new subscription service
    const subscriptionStatus = await getUserSubscriptionStatus(user.id);

    console.log("[SubscriptionCheck]", {
      userId: user.id,
      ...subscriptionStatus,
    });

    // Attach subscription status to request
    (req as any).subscription = subscriptionStatus;

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    // Default to free on error - don't block request
    (req as any).subscription = {
      isSubscribed: false,
      isPaid: false,
      isTrialActive: false,
      plan: "free",
    };
    next();
  }
}

/**
 * Optional: Cron job to check for expired trials and send notifications
 * Run this periodically (e.g., every hour)
 */
export async function checkExpiredTrials() {
  try {
    const now = new Date();

    // Find all users with expired trials who haven't been converted to paid
    const expiredTrials = await db.query.userSubscriptions.findMany({
      where: and(
        isNotNull(userSubscriptions.trialExpiresAt),
        lt(userSubscriptions.trialExpiresAt, now),
        eq(userSubscriptions.isSubscribed, false)
      ),
    });

    console.log(`[Cron] Found ${expiredTrials.length} expired trials`);

    for (const subscription of expiredTrials) {
      console.log(
        `[Cron] Trial expired for user ${subscription.userId}. Triggering conversion flow.`
      );

      // In production:
      // 1. Trigger RevenueCat API to show payment prompt
      // 2. Send push notification to user
      // 3. Mark user as needing conversion in analytics

      await db
        .update(userSubscriptions)
        .set({ updatedAt: now })
        .where(eq(userSubscriptions.userId, subscription.userId as string));
    }
  } catch (error) {
    console.error("Cron job error:", error);
  }
}
