import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { userSubscriptions, dbSchema } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { getOrCreateDevice, extractDeviceId, generateDeviceId } from "./auth";
import { getUserSubscriptionStatus } from "./subscription-service";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db: NodePgDatabase<typeof dbSchema> = drizzle(pool, { schema: dbSchema });

// Simple in-memory rate limiter (use Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMITS = {
  "/api/analyze": { requests: 20, windowMs: 60000 }, // 20 req/min
  "/api/regenerate": { requests: 50, windowMs: 60000 }, // 50 req/min
};

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = `${req.ip}:${req.path}`;
  const limit = RATE_LIMITS[req.path as keyof typeof RATE_LIMITS];

  if (!limit) {
    return next();
  }

  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (record && now < record.resetTime) {
    if (record.count >= limit.requests) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    record.count++;
  } else {
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.windowMs });
  }

  next();
}

/**
 * Device authentication middleware
 * Ensures every request has a valid device ID and gets/creates a user
 */
export async function deviceAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract device ID from request
    let deviceId = extractDeviceId(req);

    // If no device ID provided, generate one and send back to client
    if (!deviceId) {
      deviceId = generateDeviceId();
      res.set("X-Device-Id", deviceId);
    }

    // Get or create user for this device
    const user = await getOrCreateDevice(deviceId);

    // Attach user and device ID to request
    (req as any).user = user;
    (req as any).deviceId = deviceId;

    next();
  } catch (error) {
    return res.status(500).json({ error: "Authentication error: " + (error instanceof Error ? error.message : String(error)) });
  }
}

/**
 * Subscription validation middleware - UPDATED
 * Uses the subscription service for accurate trial/paid tracking
 */
export async function subscriptionCheckMiddleware(req: Request, res: Response, next: NextFunction) {
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

    // Use the subscription service for accurate status
    const subscriptionStatus = await getUserSubscriptionStatus(user.id);

    console.log("[SubscriptionCheck] 🔍 SUBSCRIPTION STATUS FROM DATABASE:", {
      userId: user.id,
      isSubscribed: subscriptionStatus.isSubscribed,
      isPaid: subscriptionStatus.isPaid,
      isTrialActive: subscriptionStatus.isTrialActive,
      plan: subscriptionStatus.plan,
      subscriptionExpiresAt: subscriptionStatus.subscriptionExpiresAt,
      trialExpiresAt: subscriptionStatus.trialExpiresAt,
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
 * Check if user can generate a reply (subscription or daily limit)
 */
export async function canGenerateReplyMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const subscription = (req as any).subscription;

    // If subscribed or in trial, no limit
    if (subscription?.isSubscribed) {
      return next();
    }

    // Free tier: track daily usage
    // This would be checked in the route handler using conversation count
    next();
  } catch (error) {
    console.error("Can generate reply check error:", error);
    next();
  }
}
