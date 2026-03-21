import axios from "axios";
import type { Express, Request, Response } from "express";
import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { pushTokens, notificationHistory, dbSchema } from "@/shared/schema";
import { eq, and, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Expo Push Notifications Service
 * Sends push notifications to users via Expo Push API
 *
 * Notifications sent for:
 * - Trial expiration (24h and 0h warnings)
 * - Daily limit reset (for free users)
 * - Upsell prompts when upgrading
 * - General engagement/retention messages
 */

const EXPO_NOTIFICATIONS_API_URL = "https://exp.host/--/api/v2/push/send";

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db: NodePgDatabase<typeof dbSchema> = drizzle(pool, { schema: dbSchema });

export interface NotificationToken {
  userId: string;
  token: string; // Expo push token (ExponentPushToken[...])
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface PushNotificationPayload {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: "default" | "custom" | null;
  ttl?: number; // Time to live in seconds
}

/**
 * Send a push notification via Expo
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  options?: {
    badge?: number;
    sound?: "default" | "custom" | null;
    ttl?: number;
  }
): Promise<boolean> {
  try {
    const payload: PushNotificationPayload = {
      to: token,
      title,
      body,
      data,
      badge: options?.badge || 1,
      sound: options?.sound ?? "default",
      ttl: options?.ttl || 3600, // Default 1 hour
    };

    const response = await axios.post(EXPO_NOTIFICATIONS_API_URL, payload);

    if (response.data?.data?.id) {
      return true;
    }

    console.error("Push notification failed:", response.data);
    return false;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}

/**
 * Get user's push token from database
 */
export async function getUserPushToken(userId: string): Promise<string | null> {
  try {
    const token = await db.query.pushTokens.findFirst({
      where: eq(pushTokens.userId, userId),
    });

    return token?.token || null;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

/**
 * Send trial expiration warning (24 hours before)
 */
export async function sendTrialExpiringWarning(
  userId: string,
  daysRemaining: number
) {
  const token = await getUserPushToken(userId);
  if (!token) return false;

  const title = "Your Trial Expires Soon";
  const body =
    daysRemaining === 1
      ? "Your AI reply trial expires tomorrow. Subscribe to keep using GhostReply."
      : `Your AI reply trial expires in ${daysRemaining} days.`;

  const success = await sendPushNotification(token, title, body, {
    action: "trial_expiring",
    daysRemaining: String(daysRemaining),
  });

  if (success) {
    // Track notification in history
    try {
      await db.insert(notificationHistory).values({
        userId,
        notificationType: "trial_expiring",
        data: { daysRemaining },
      });
    } catch (error) {
      console.error("Error logging notification history:", error);
    }
  }

  return success;
}

/**
 * Send trial expired notification (conversion upsell)
 */
export async function sendTrialExpiredUpsell(userId: string) {
  const token = await getUserPushToken(userId);
  if (!token) return false;

  const title = "Your Trial Has Ended";
  const body = "Subscribe now to get unlimited AI-powered replies and keep the conversation flowing.";

  const success = await sendPushNotification(token, title, body, {
    action: "trial_expired_upsell",
  });

  if (success) {
    try {
      await db.insert(notificationHistory).values({
        userId,
        notificationType: "trial_expired",
        data: {},
      });
    } catch (error) {
      console.error("Error logging notification history:", error);
    }
  }

  return success;
}

/**
 * Send daily limit reset notification (for free users)
 * This is sent at the start of each new day
 */
export async function sendDailyLimitReset(userId: string) {
  const token = await getUserPushToken(userId);
  if (!token) return false;

  const title = "Your Daily Replies Are Ready";
  const body = "You have 2 new replies to use today. Get unlimited with a subscription.";

  const success = await sendPushNotification(token, title, body, {
    action: "daily_limit_reset",
  });

  if (success) {
    try {
      await db.insert(notificationHistory).values({
        userId,
        notificationType: "daily_limit_reset",
        data: {},
      });
    } catch (error) {
      console.error("Error logging notification history:", error);
    }
  }

  return success;
}

/**
 * Send subscription upgrade successful notification
 */
export async function sendSubscriptionUpgradeSuccess(
  userId: string,
  planName: string
) {
  const token = await getUserPushToken(userId);
  if (!token) return false;

  const title = "Welcome to " + planName;
  const body = "You're all set with unlimited AI-powered replies.";

  const success = await sendPushNotification(token, title, body, {
    action: "subscription_success",
    plan: planName,
  });

  if (success) {
    try {
      await db.insert(notificationHistory).values({
        userId,
        notificationType: "subscription_success",
        data: { plan: planName },
      });
    } catch (error) {
      console.error("Error logging notification history:", error);
    }
  }

  return success;
}

/**
 * Send engagement/retention notification
 */
export async function sendEngagementNotification(userId: string) {
  const token = await getUserPushToken(userId);
  if (!token) return false;

  const messages = [
    {
      title: "Someone Replied",
      body: "See how GhostReply would respond. Open the app to check.",
    },
    {
      title: "Boost Your Conversations",
      body: "Get AI-powered suggestions for your next message.",
    },
    {
      title: "Quick Win",
      body: "Craft the perfect response in seconds.",
    },
  ];

  const message = messages[Math.floor(Math.random() * messages.length)];
  const success = await sendPushNotification(token, message.title, message.body, {
    action: "engagement",
  });

  if (success) {
    try {
      await db.insert(notificationHistory).values({
        userId,
        notificationType: "engagement",
        data: message,
      });
    } catch (error) {
      console.error("Error logging notification history:", error);
    }
  }

  return success;
}

/**
 * Register push notification endpoints
 */
export function registerPushNotificationRoutes(app: Express) {
  /**
   * POST /api/notifications/token
   * Store Expo push token for device
   */
  app.post("/api/notifications/token", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { token } = req.body;

      if (!user || !token) {
        return res.status(400).json({ error: "Missing user or token" });
      }

      // ExponentPushToken format validation
      if (!token.startsWith("ExponentPushToken[")) {
        return res.status(400).json({ error: "Invalid Expo push token format" });
      }

      // Try to insert or update token
      try {
        // Check if token already exists
        const existingToken = await db.query.pushTokens.findFirst({
          where: eq(pushTokens.token, token),
        });

        if (existingToken) {
          // Update lastUsedAt
          await db
            .update(pushTokens)
            .set({ lastUsedAt: new Date() })
            .where(eq(pushTokens.token, token));
        } else {
          // Insert new token
          await db.insert(pushTokens).values({
            userId: user.id,
            token,
          });
        }

        res.json({
          success: true,
          message: "Push token registered",
        });
      } catch (dbError: any) {
        // Handle duplicate key - update existing instead
        if (dbError.code === "23505") {
          // Unique violation - token already registered for another user
          console.warn(`Token already registered for different user`);
        }
        res.json({
          success: true,
          message: "Push token registered",
        });
      }
    } catch (error) {
      console.error("Error registering push token:", error);
      res.status(500).json({ error: "Failed to register push token" });
    }
  });

  /**
   * POST /api/notifications/test
   * Send test notification (for development)
   */
  app.post("/api/notifications/test", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Missing token" });
      }

      const success = await sendPushNotification(
        token,
        "GhostReply Test",
        "This is a test notification from GhostReply."
      );

      if (success) {
        res.json({ success: true, message: "Test notification sent" });
      } else {
        res.status(500).json({ error: "Failed to send test notification" });
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });
}
