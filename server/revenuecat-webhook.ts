import crypto from "crypto";
import type { Express, Request, Response } from "express";
import express from "express";
import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { dbSchema, userSubscriptions } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { notifySubscriptionSuccess } from "./subscription-service";

/**
 * RevenueCat Webhook Handler
 * Receives and processes purchase events from RevenueCat
 *
 * Handles events:
 * - initial_purchase: New paid subscription
 * - renewal: Subscription renewal (auto-renewal)
 * - transfer: Subscription transfer
 * - cancellation: Subscription cancelled
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db: NodePgDatabase<typeof dbSchema> = drizzle(pool, { schema: dbSchema });

// Webhook signing key - should be in .env
// Get this from RevenueCat dashboard: https://app.revenuecat.com/settings
const REVENUECAT_WEBHOOK_KEY = process.env.REVENUECAT_WEBHOOK_KEY || "";

/**
 * Verify RevenueCat webhook signature
 * RevenueCat signs all webhooks - verify signature to prevent spoofing
 *
 * Signature is SHA256(body + webhook_key)
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!REVENUECAT_WEBHOOK_KEY) {
    console.warn("[RevenueCat] Warning: REVENUECAT_WEBHOOK_KEY not set - signatures not verified");
    return true; // Allow in development
  }

  const expectedSignature = crypto
    .createHmac("sha256", REVENUECAT_WEBHOOK_KEY)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Parse RevenueCat webhook body and get raw string for signature validation
 */
function setupRevenueCatWebhookBody(app: Express) {
  app.post(
    "/api/webhooks/revenuecat",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      try {
        const signature = req.header("X-RevenueCat-Signature");

        if (!signature) {
          console.warn("[RevenueCat] Missing signature header");
          return res.status(401).json({ error: "Missing signature" });
        }

        const rawBody = (req as any).body.toString("utf-8");

        // Verify signature
        if (!verifyWebhookSignature(rawBody, signature)) {
          console.warn("[RevenueCat] Invalid signature");
          return res.status(401).json({ error: "Invalid signature" });
        }

        // Parse body after validation
        const body = JSON.parse(rawBody);

        // Handle the event
        await handleRevenueCatEvent(body);

        // Always return 200 to acknowledge receipt
        res.json({ success: true });
      } catch (error) {
        console.error("[RevenueCat] Error processing webhook:", error);
        // Still return 200 to prevent retries
        res.json({ success: true, error: "Processed with errors" });
      }
    }
  );
}

/**
 * Main event handler for RevenueCat webhooks
 */
async function handleRevenueCatEvent(event: any): Promise<void> {
  try {
    const eventType = event.event?.type;
    const appUserId = event.event?.app_user_id;

    if (!eventType || !appUserId) {
      console.warn("[RevenueCat] Missing event type or app_user_id:", event);
      return;
    }

    console.log(`[RevenueCat] Processing ${eventType} event for user ${appUserId}`);

    switch (eventType) {
      case "initial_purchase":
        await handleInitialPurchase(appUserId, event);
        break;

      case "renewal":
        await handleRenewal(appUserId, event);
        break;

      case "transfer":
        await handleSubscriptionTransfer(appUserId, event);
        break;

      case "cancellation":
        await handleCancellation(appUserId, event);
        break;

      case "subscription_started":
        await handleSubscriptionStarted(appUserId, event);
        break;

      default:
        console.log(`[RevenueCat] Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error("[RevenueCat] Error handling event:", error);
    throw error;
  }
}

/**
 * Handle initial purchase event
 * User just purchased a subscription for the first time
 */
async function handleInitialPurchase(userId: string, event: any): Promise<void> {
  try {
    const plan = extractPlanName(event);
    const expiresAt = event.event?.expiration_at_ms;
    const purchasedAt = event.event?.purchased_at_ms;

    console.log(`[RevenueCat] Initial purchase: ${userId} - ${plan}, expires: ${expiresAt}`);

    // Update database with subscription info
    const subscriptionExpiresAt = expiresAt ? new Date(expiresAt) : null;
    
    // Upsert subscription record
    await db
      .insert(userSubscriptions)
      .values({
        userId,
        isSubscribed: true,
        subscriptionExpiresAt,
        trialStartedAt: null,
        trialExpiresAt: null,
      })
      .onConflictDoUpdate({
        target: userSubscriptions.userId,
        set: {
          isSubscribed: true,
          subscriptionExpiresAt,
        },
      });

    console.log(`[RevenueCat] ✓ Subscription saved to database for user ${userId}`);

    // Send congratulations notification
    await notifySubscriptionSuccess(userId, plan || "Premium");
  } catch (error) {
    console.error("[RevenueCat] Error handling initial purchase:", error);
  }
}

/**
 * Handle renewal event
 * Existing subscription has auto-renewed
 */
async function handleRenewal(userId: string, event: any): Promise<void> {
  try {
    const plan = extractPlanName(event);
    const expiresAt = event.event?.expiration_at_ms;

    console.log(`[RevenueCat] Renewal: ${userId} - ${plan}, expires: ${expiresAt}`);

    // Update subscription expiration in database
    const subscriptionExpiresAt = expiresAt ? new Date(expiresAt) : null;
    
    await db
      .update(userSubscriptions)
      .set({
        subscriptionExpiresAt,
      })
      .where(eq(userSubscriptions.userId, userId));

    console.log(`[RevenueCat] ✓ Subscription renewed and updated for user ${userId}`);

    // Send renewal confirmation notification
    // await notifySubscriptionSuccess(userId, `${plan} (Renewed)`);

    // Note: RevenueCat handles all subscription state updates
    // This is mainly for logging and analytics
  } catch (error) {
    console.error("[RevenueCat] Error handling renewal:", error);
  }
}

/**
 * Handle subscription transfer
 * User transferred subscription (e.g., app store refund and repurchase)
 */
async function handleSubscriptionTransfer(userId: string, event: any): Promise<void> {
  try {
    console.log(`[RevenueCat] Subscription transfer: ${userId}`);

    // Transfer is typically from a refund + repurchase
    // Treat similar to initial purchase
    const plan = extractPlanName(event);
    await notifySubscriptionSuccess(userId, plan || "Premium");
  } catch (error) {
    console.error("[RevenueCat] Error handling transfer:", error);
  }
}

/**
 * Handle subscription started
 * New subscription has started (different from initial_purchase timing)
 */
async function handleSubscriptionStarted(userId: string, event: any): Promise<void> {
  try {
    const plan = extractPlanName(event);
    const expiresAt = event.event?.expiration_at_ms;

    console.log(`[RevenueCat] Subscription started: ${userId} - ${plan}, expires: ${expiresAt}`);

    // Update database with subscription info
    const subscriptionExpiresAt = expiresAt ? new Date(expiresAt) : null;
    
    // Upsert subscription record
    await db
      .insert(userSubscriptions)
      .values({
        userId,
        isSubscribed: true,
        subscriptionExpiresAt,
        trialStartedAt: null,
        trialExpiresAt: null,
      })
      .onConflictDoUpdate({
        target: userSubscriptions.userId,
        set: {
          isSubscribed: true,
          subscriptionExpiresAt,
        },
      });

    console.log(`[RevenueCat] ✓ Subscription started and saved for user ${userId}`);

    // Send welcome notification
    await notifySubscriptionSuccess(userId, plan || "Premium");
  } catch (error) {
    console.error("[RevenueCat] Error handling subscription started:", error);
  }
}

/**
 * Handle cancellation
 * User cancelled their subscription
 */
async function handleCancellation(userId: string, event: any): Promise<void> {
  try {
    const reason = event.event?.cancellation_reason;

    console.log(`[RevenueCat] Cancellation: ${userId} - Reason: ${reason}`);

    // Update subscription status in database
    await db
      .update(userSubscriptions)
      .set({
        isSubscribed: false,
        subscriptionExpiresAt: null,
      })
      .where(eq(userSubscriptions.userId, userId));

    console.log(`[RevenueCat] ✓ Subscription cancelled for user ${userId}`);

    // Optionally: Send win-back notification after a few days
    // OR: Log to analytics for churn analysis

    // Note: User should revert to free tier in app automatically via RevenueCat SDK
  } catch (error) {
    console.error("[RevenueCat] Error handling cancellation:", error);
  }
}

/**
 * Extract plan name from RevenueCat webhook event
 */
function extractPlanName(event: any): string {
  // RevenueCat sends product_id which we can map to our plan names
  const productId = event.event?.product_id;

  if (!productId) {
    return "Premium";
  }

  // Map RevenueCat product IDs to friendly names
  // These should match your Google Play Console product IDs
  const planMap: Record<string, string> = {
    "ghostreply_weekly": "Premium Weekly",
    "ghostreply_monthly": "Premium Monthly",
    "ghostreply_yearly": "Premium Yearly",
  };

  return planMap[productId] || "Premium";
}

/**
 * Register RevenueCat webhook endpoint
 */
export function registerRevenueCatWebhook(app: Express) {
  // Use raw body parser for revenueCat webhook signature verification
  // This must be BEFORE the JSON body parser for this specific route
  setupRevenueCatWebhookBody(app);

  console.log("[RevenueCat] Webhook endpoint registered at POST /api/webhooks/revenuecat");
}

/**
 * Type definitions for RevenueCat webhook events
 */
export interface RevenueCatWebhookEvent {
  event: {
    type:
      | "initial_purchase"
      | "renewal"
      | "transfer"
      | "subscription_started"
      | "cancellation"
      | string;
    app_user_id: string;
    product_id?: string;
    purchased_at?: string;
    cancellation_reason?: string;
  };
}
