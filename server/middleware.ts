import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { userSubscriptions, dbSchema } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { getOrCreateDevice, extractDeviceId, generateDeviceId } from "./auth";

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
    // Log request details
    console.log("[DeviceAuth] Path:", req.path);
    console.log("[DeviceAuth] Headers:", req.headers);
    
    let deviceId = extractDeviceId(req);
    console.log("[DeviceAuth] Extracted device ID:", deviceId);

    // If no device ID provided, generate one and send back to client
    if (!deviceId) {
      console.log("[DeviceAuth] No device ID, generating new one");
      deviceId = generateDeviceId();
      res.set("X-Device-Id", deviceId);
    }

    console.log("[DeviceAuth] Getting or creating user for device:", deviceId);
    
    // Get or create user for this device
    const user = await getOrCreateDevice(deviceId);
    console.log("[DeviceAuth] User retrieved/created:", user);

    // Attach user and device ID to request
    (req as any).user = user;
    (req as any).deviceId = deviceId;

    next();
  } catch (error) {
    console.error("Device auth error:", error);
    return res.status(500).json({ error: "Authentication error: " + (error instanceof Error ? error.message : String(error)) });
  }
}

/**
 * Subscription validation middleware
 * Checks if user has an active subscription or is within free tier limits
 */
export async function subscriptionCheckMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check subscription status
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, user.id),
    });

    const now = new Date();
    const isSubscribed =
      subscription &&
      subscription.isSubscribed &&
      (!subscription.subscriptionExpiresAt || subscription.subscriptionExpiresAt > now);

    const isInTrial =
      subscription &&
      subscription.trialStartedAt &&
      subscription.trialExpiresAt &&
      subscription.trialExpiresAt > now;

    // Attach subscription status to request
    (req as any).subscription = {
      isSubscribed: isSubscribed || isInTrial,
      isPaid: isSubscribed,
      isTrialActive: isInTrial,
      plan: subscription?.plan,
    };

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    // Don't block on error - let it proceed
    (req as any).subscription = { isSubscribed: false, isPaid: false, isTrialActive: false };
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
