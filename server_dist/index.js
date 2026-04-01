// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "node:http";
import * as fs from "fs";
import * as path from "path";
import OpenAI from "openai";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow()
});
var conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  inputText: text("input_text").notNull(),
  analysis: text("analysis").notNull(),
  score: integer("score").notNull(),
  scoreLabel: varchar("score_label").notNull(),
  scoreAdvice: varchar("score_advice").notNull(),
  replies: jsonb("replies").notNull().$type(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isSubscribed: boolean("is_subscribed").default(false),
  subscriptionProvider: varchar("subscription_provider"),
  // "revenuecat"
  subscriptionId: varchar("subscription_id"),
  // RevenueCat subscription ID
  plan: varchar("plan"),
  // "monthly" or "yearly"
  trialStartedAt: timestamp("trial_started_at"),
  trialExpiresAt: timestamp("trial_expires_at"),
  subscriptionStartedAt: timestamp("subscription_started_at"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventName: varchar("event_name").notNull(),
  // app_open, screenshot_uploaded, reply_generated, etc.
  eventData: jsonb("event_data").$type(),
  createdAt: timestamp("created_at").defaultNow()
});
var pushTokens = pgTable("push_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  // Expo push token (ExponentPushToken[...])
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at")
});
var notificationHistory = pgTable("notification_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  notificationType: varchar("notification_type").notNull(),
  // trial_expiring, trial_expired, daily_reset, etc.
  data: jsonb("data").$type(),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at")
});
var insertUserSchema = createInsertSchema(users).pick({
  deviceId: true
});
var insertConversationSchema = createInsertSchema(conversations).pick({
  userId: true,
  inputText: true,
  analysis: true,
  score: true,
  scoreLabel: true,
  scoreAdvice: true,
  replies: true
});
var insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).pick({
  userId: true,
  isSubscribed: true,
  subscriptionProvider: true,
  subscriptionId: true,
  plan: true,
  trialStartedAt: true,
  trialExpiresAt: true
});
var insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).pick({
  userId: true,
  eventName: true,
  eventData: true
});
var insertPushTokenSchema = createInsertSchema(pushTokens).pick({
  userId: true,
  token: true
});
var insertNotificationHistorySchema = createInsertSchema(notificationHistory).pick({
  userId: true,
  notificationType: true,
  data: true
});
var dbSchema = {
  users,
  conversations,
  userSubscriptions,
  analyticsEvents,
  pushTokens,
  notificationHistory
};

// server/routes.ts
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
var db = drizzle(pool, { schema: dbSchema });
var openrouter = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY
});
var MODEL = "anthropic/claude-3-5-haiku";
var SYSTEM_PROMPT = `You are a conversation coach. Generate 5 reply styles for this conversation.
Return ONLY valid JSON, no markdown.
{
  "analysis": "Brief tone insight (1-2 sentences max)",
  "score": <0-100>,
  "scoreLabel": "Label like 'Strong Start'",
  "scoreAdvice": "1 sentence tip",
  "replies": {
    "confident": "<reply under 20 words>",
    "flirty": "<reply under 20 words>",
    "funny": "<reply under 20 words>",
    "savage": "<reply under 20 words>",
    "smart": "<reply under 20 words>"
  }
}`;
async function registerRoutes(app2) {
  app2.post("/api/analyze", async (req, res) => {
    try {
      const user = req.user;
      const subscription = req.subscription;
      const { text: text2 } = req.body;
      console.log("[ANALYZE] \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
      console.log("[ANALYZE] User ID:", user?.id);
      console.log("[ANALYZE] Subscription Data:", {
        isSubscribed: subscription?.isSubscribed,
        isPaid: subscription?.isPaid,
        isTrialActive: subscription?.isTrialActive,
        plan: subscription?.plan
      });
      if (!user || !user.id) {
        console.error("[ANALYZE] \u274C User not found");
        return res.status(401).json({ error: "User not found" });
      }
      if (!text2 || typeof text2 !== "string") {
        console.error("[ANALYZE] \u274C Text is required");
        return res.status(400).json({ error: "Text is required" });
      }
      if (!subscription?.isSubscribed) {
        console.log("[ANALYZE] \u{1F50D} User is NOT subscribed - checking free tier limit");
        const now = /* @__PURE__ */ new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        const todayConversations = await db.query.conversations.findMany({
          where: (fields, operators) => operators.and(
            operators.eq(fields.userId, user.id),
            operators.gte(fields.createdAt, today)
          )
        });
        console.log("[ANALYZE] Today's conversations count:", todayConversations.length);
        if (todayConversations.length >= 2) {
          console.log("[ANALYZE] \u274C BLOCKED - Daily free limit reached");
          return res.status(429).json({
            error: "Daily free limit reached. Upgrade to Pro for unlimited replies.",
            remaining: 0
          });
        }
        console.log("[ANALYZE] \u2713 Free user under limit - allowing request");
      } else {
        console.log("[ANALYZE] \u2713 User is SUBSCRIBED - allowing unlimited access");
      }
      console.log("[ANALYZE] Calling OpenRouter API...");
      const response = await openrouter.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Conversation:
${text2}`
          }
        ],
        max_tokens: 350,
        temperature: 0.8
      });
      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error("[ANALYZE] \u274C No response from AI");
        return res.status(500).json({ error: "No response from AI" });
      }
      let parsed;
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        console.error("[ANALYZE] \u274C Failed to parse AI response");
        return res.status(500).json({ error: "Failed to parse AI response" });
      }
      try {
        await db.insert(conversations).values({
          userId: user.id,
          inputText: text2,
          analysis: parsed.analysis || "",
          score: parsed.score || 0,
          scoreLabel: parsed.scoreLabel || "Neutral",
          scoreAdvice: parsed.scoreAdvice || "Keep the conversation going",
          replies: parsed.replies || {}
        });
        console.log("[ANALYZE] \u2713 Conversation saved to database");
      } catch (dbError) {
        console.error("[ANALYZE] \u26A0\uFE0F  DB save failed:", dbError);
      }
      const responseData = {
        ...parsed,
        conversationId: void 0
      };
      console.log("[ANALYZE] \u2713 SUCCESS - Returning response");
      console.log("[ANALYZE] \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
      return res.json(responseData);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[ANALYZE] \u274C FATAL ERROR:", msg);
      console.log("[ANALYZE] \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
      return res.status(500).json({ error: msg });
    }
  });
  app2.post("/api/regenerate", async (req, res) => {
    try {
      const user = req.user;
      const subscription = req.subscription;
      const { text: text2, personality } = req.body;
      if (!text2 || !personality) {
        return res.status(400).json({ error: "Text and personality are required" });
      }
      if (!subscription?.isSubscribed) {
        const today = (/* @__PURE__ */ new Date()).toDateString();
        const todayConversations = await db.query.conversations.findMany({
          where: (fields, operators) => operators.and(
            operators.eq(fields.userId, user.id),
            operators.gte(fields.createdAt, new Date(today))
          )
        });
        if (todayConversations.length >= 2) {
          return res.status(429).json({ error: "Daily free limit reached" });
        }
      }
      const personalityPrompts = {
        confident: "Generate a new confident, self-assured reply. Be bold and direct.",
        flirty: "Generate a new flirty, playful reply. Be charming and suggestive.",
        funny: "Generate a new funny, witty reply. Be clever and make them laugh.",
        savage: "Generate a new savage, sharp reply. Be brutally honest or cutting.",
        smart: "Generate a new thoughtful, intelligent reply. Be insightful and deep."
      };
      const response = await openrouter.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are a conversation coach. ${personalityPrompts[personality] || "Generate a witty reply."} 
Keep it under 20 words. Return ONLY the reply text, nothing else.`
          },
          {
            role: "user",
            content: `Conversation:
${text2}`
          }
        ],
        max_tokens: 200,
        temperature: 1
      });
      const reply = response.choices[0]?.message?.content?.trim() || "";
      return res.json({ reply: reply.replace(/^["']|["']$/g, "") });
    } catch (error) {
      console.error("Regenerate error:", error);
      return res.status(500).json({ error: "Failed to regenerate" });
    }
  });
  app2.get("/api/conversations", async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userConversations = await db.query.conversations.findMany({
        where: (fields, operators) => operators.eq(fields.userId, user.id),
        orderBy: (fields, operators) => [operators.desc(fields.createdAt)],
        limit: 100
      });
      return res.json({ conversations: userConversations });
    } catch (error) {
      console.error("Get conversations error:", error);
      return res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  app2.get("/api/health", (_req, res) => {
    return res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.get("/privacy-policy", (_req, res) => {
    try {
      const privacyPath = path.resolve(process.cwd(), "server", "templates", "privacy-policy.html");
      const privacyContent = fs.readFileSync(privacyPath, "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(privacyContent);
    } catch (error) {
      console.error("Privacy policy error:", error);
      return res.status(500).json({ error: "Failed to load privacy policy" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/subscription-service.ts
import { Pool as Pool3 } from "pg";
import { drizzle as drizzle3 } from "drizzle-orm/node-postgres";
import { eq as eq2 } from "drizzle-orm";

// server/push-notifications.ts
import axios from "axios";
import { Pool as Pool2 } from "pg";
import { drizzle as drizzle2 } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
var EXPO_NOTIFICATIONS_API_URL = "https://exp.host/--/api/v2/push/send";
var pool2 = new Pool2({
  connectionString: process.env.DATABASE_URL
});
var db2 = drizzle2(pool2, { schema: dbSchema });
async function sendPushNotification(token, title, body, data, options) {
  try {
    const payload = {
      to: token,
      title,
      body,
      data,
      badge: options?.badge || 1,
      sound: options?.sound ?? "default",
      ttl: options?.ttl || 3600
      // Default 1 hour
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
async function getUserPushToken(userId) {
  try {
    const token = await db2.query.pushTokens.findFirst({
      where: eq(pushTokens.userId, userId)
    });
    return token?.token || null;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}
async function sendTrialExpiringWarning(userId, daysRemaining) {
  const token = await getUserPushToken(userId);
  if (!token) return false;
  const title = "Your Trial Expires Soon";
  const body = daysRemaining === 1 ? "Your AI reply trial expires tomorrow. Subscribe to keep using GhostReply." : `Your AI reply trial expires in ${daysRemaining} days.`;
  const success = await sendPushNotification(token, title, body, {
    action: "trial_expiring",
    daysRemaining: String(daysRemaining)
  });
  if (success) {
    try {
      await db2.insert(notificationHistory).values({
        userId,
        notificationType: "trial_expiring",
        data: { daysRemaining }
      });
    } catch (error) {
      console.error("Error logging notification history:", error);
    }
  }
  return success;
}
async function sendTrialExpiredUpsell(userId) {
  const token = await getUserPushToken(userId);
  if (!token) return false;
  const title = "Your Trial Has Ended";
  const body = "Subscribe now to get unlimited AI-powered replies and keep the conversation flowing.";
  const success = await sendPushNotification(token, title, body, {
    action: "trial_expired_upsell"
  });
  if (success) {
    try {
      await db2.insert(notificationHistory).values({
        userId,
        notificationType: "trial_expired",
        data: {}
      });
    } catch (error) {
      console.error("Error logging notification history:", error);
    }
  }
  return success;
}
async function sendDailyLimitReset(userId) {
  const token = await getUserPushToken(userId);
  if (!token) return false;
  const title = "Your Daily Replies Are Ready";
  const body = "You have 2 new replies to use today. Get unlimited with a subscription.";
  const success = await sendPushNotification(token, title, body, {
    action: "daily_limit_reset"
  });
  if (success) {
    try {
      await db2.insert(notificationHistory).values({
        userId,
        notificationType: "daily_limit_reset",
        data: {}
      });
    } catch (error) {
      console.error("Error logging notification history:", error);
    }
  }
  return success;
}
async function sendSubscriptionUpgradeSuccess(userId, planName) {
  const token = await getUserPushToken(userId);
  if (!token) return false;
  const title = "Welcome to " + planName;
  const body = "You're all set with unlimited AI-powered replies.";
  const success = await sendPushNotification(token, title, body, {
    action: "subscription_success",
    plan: planName
  });
  if (success) {
    try {
      await db2.insert(notificationHistory).values({
        userId,
        notificationType: "subscription_success",
        data: { plan: planName }
      });
    } catch (error) {
      console.error("Error logging notification history:", error);
    }
  }
  return success;
}
function registerPushNotificationRoutes(app2) {
  app2.post("/api/notifications/token", async (req, res) => {
    try {
      const user = req.user;
      const { token } = req.body;
      if (!user || !token) {
        return res.status(400).json({ error: "Missing user or token" });
      }
      if (!token.startsWith("ExponentPushToken[")) {
        return res.status(400).json({ error: "Invalid Expo push token format" });
      }
      try {
        const existingToken = await db2.query.pushTokens.findFirst({
          where: eq(pushTokens.token, token)
        });
        if (existingToken) {
          await db2.update(pushTokens).set({ lastUsedAt: /* @__PURE__ */ new Date() }).where(eq(pushTokens.token, token));
        } else {
          await db2.insert(pushTokens).values({
            userId: user.id,
            token
          });
        }
        res.json({
          success: true,
          message: "Push token registered"
        });
      } catch (dbError) {
        if (dbError.code === "23505") {
          console.warn(`Token already registered for different user`);
        }
        res.json({
          success: true,
          message: "Push token registered"
        });
      }
    } catch (error) {
      console.error("Error registering push token:", error);
      res.status(500).json({ error: "Failed to register push token" });
    }
  });
  app2.post("/api/notifications/test", async (req, res) => {
    try {
      const user = req.user;
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

// server/subscription-service.ts
var pool3 = new Pool3({
  connectionString: process.env.DATABASE_URL
});
var db3 = drizzle3(pool3, { schema: dbSchema });
async function getUserSubscriptionStatus(userId) {
  try {
    const subscription = await db3.query.userSubscriptions.findFirst({
      where: eq2(userSubscriptions.userId, userId)
    });
    const now = /* @__PURE__ */ new Date();
    if (!subscription) {
      return {
        isSubscribed: false,
        isPaid: false,
        isTrialActive: false,
        plan: "free"
      };
    }
    const isTrialActive = subscription.trialStartedAt && subscription.trialExpiresAt && subscription.trialExpiresAt > now;
    const isPaidActive = subscription.isSubscribed && subscription.subscriptionExpiresAt && subscription.subscriptionExpiresAt > now;
    if (isTrialActive) {
      const daysRemaining = Math.ceil(
        (subscription.trialExpiresAt.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24)
      );
      return {
        isSubscribed: true,
        isPaid: false,
        isTrialActive: true,
        plan: "free-trial",
        trialExpiresAt: subscription.trialExpiresAt || void 0,
        daysRemaining: Math.max(0, daysRemaining)
      };
    }
    if (isPaidActive) {
      return {
        isSubscribed: true,
        isPaid: true,
        isTrialActive: false,
        plan: "premium",
        subscriptionExpiresAt: subscription.subscriptionExpiresAt || void 0
      };
    }
    return {
      isSubscribed: false,
      isPaid: false,
      isTrialActive: false,
      plan: "free",
      trialExpiresAt: subscription.trialExpiresAt || void 0,
      subscriptionExpiresAt: subscription.subscriptionExpiresAt || void 0
    };
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return {
      isSubscribed: false,
      isPaid: false,
      isTrialActive: false,
      plan: "free"
    };
  }
}
async function startFreeTrial(userId) {
  try {
    const now = /* @__PURE__ */ new Date();
    const trialExpiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1e3);
    const existingSubscription = await db3.query.userSubscriptions.findFirst({
      where: eq2(userSubscriptions.userId, userId)
    });
    if (existingSubscription) {
      if (!existingSubscription.trialStartedAt) {
        await db3.update(userSubscriptions).set({
          trialStartedAt: now,
          trialExpiresAt,
          updatedAt: now
        }).where(eq2(userSubscriptions.userId, userId));
      } else {
      }
    } else {
      await db3.insert(userSubscriptions).values({
        userId,
        isSubscribed: false,
        // Trial is not a paid subscription
        trialStartedAt: now,
        trialExpiresAt,
        createdAt: now,
        updatedAt: now
      });
    }
    return getUserSubscriptionStatus(userId);
  } catch (error) {
    throw new Error("Failed to start free trial");
  }
}
async function handleTrialExpiration(userId) {
  try {
    const subscription = await db3.query.userSubscriptions.findFirst({
      where: eq2(userSubscriptions.userId, userId)
    });
    if (!subscription) return;
    const now = /* @__PURE__ */ new Date();
    const isTrialExpired = subscription.trialExpiresAt && subscription.trialExpiresAt < now && !subscription.isSubscribed;
    if (isTrialExpired) {
      console.log(`[Trial] Trial expired for user ${userId}. Ready for conversion to paid plan.`);
      try {
        await sendTrialExpiredUpsell(userId);
      } catch (notificationError) {
        console.error("Error sending trial expiration notification:", notificationError);
      }
    } else if (subscription.trialExpiresAt && subscription.trialExpiresAt > now && !subscription.isSubscribed) {
      const daysRemaining = Math.ceil(
        (subscription.trialExpiresAt.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24)
      );
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
async function shouldEnforceDailyLimits(userId) {
  const status = await getUserSubscriptionStatus(userId);
  return status.plan === "free";
}
async function getDailyLimitForUser(userId) {
  const shouldEnforce = await shouldEnforceDailyLimits(userId);
  return shouldEnforce ? 2 : Infinity;
}
async function notifyDailyLimitReset(userId) {
  try {
    const shouldEnforce = await shouldEnforceDailyLimits(userId);
    if (!shouldEnforce) {
      return;
    }
    console.log(`[Notifications] Sending daily limit reset notification to user ${userId}`);
    try {
      await sendDailyLimitReset(userId);
    } catch (notificationError) {
      console.error("Error sending daily limit reset notification:", notificationError);
    }
  } catch (error) {
    console.error("Error notifying daily limit reset:", error);
  }
}
async function notifySubscriptionSuccess(userId, planName = "Premium") {
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

// server/subscription-routes.ts
import { eq as eq3, gte as gte2, and as and2 } from "drizzle-orm";
import OpenAI2 from "openai";
async function registerSubscriptionRoutes(app2) {
  const openrouter2 = new OpenAI2({
    baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY
  });
  const MODEL2 = "anthropic/claude-3-5-haiku";
  const SYSTEM_PROMPT2 = `You are a conversation coach. Generate 5 reply styles for this conversation.
Return ONLY valid JSON, no markdown.
{
  "analysis": "Brief tone insight (1-2 sentences max)",
  "score": <0-100>,
  "scoreLabel": "Label like 'Strong Start'",
  "scoreAdvice": "1 sentence tip",
  "replies": {
    "confident": "<reply under 20 words>",
    "flirty": "<reply under 20 words>",
    "funny": "<reply under 20 words>",
    "savage": "<reply under 20 words>",
    "smart": "<reply under 20 words>"
  }
}`;
  app2.get("/api/subscription/status", async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const status = await getUserSubscriptionStatus(user.id);
      return res.json(status);
    } catch (error) {
      console.error("Subscription status error:", error);
      return res.status(500).json({ error: "Failed to get subscription status" });
    }
  });
  app2.post("/api/subscription/start-trial", async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const currentStatus = await getUserSubscriptionStatus(user.id);
      if (currentStatus.isSubscribed) {
        return res.status(400).json({
          error: "User already has an active subscription or trial",
          currentPlan: currentStatus.plan
        });
      }
      const newStatus = await startFreeTrial(user.id);
      return res.json({
        success: true,
        message: "Free trial started successfully",
        ...newStatus
      });
    } catch (error) {
      console.error("Start trial error:", error);
      return res.status(500).json({ error: "Failed to start free trial" });
    }
  });
  app2.get("/api/subscription/daily-limit", async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const dailyLimit = await getDailyLimitForUser(user.id);
      const status = await getUserSubscriptionStatus(user.id);
      const now = /* @__PURE__ */ new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
      const todayConversations = await db3.query.conversations.findMany({
        where: and2(
          eq3(conversations.userId, user.id),
          gte2(conversations.createdAt, today)
        )
      });
      return res.json({
        dailyLimit,
        used: todayConversations.length,
        remaining: Math.max(0, dailyLimit - todayConversations.length),
        isUnlimited: dailyLimit === Infinity,
        plan: status.plan
      });
    } catch (error) {
      console.error("Daily limit error:", error);
      return res.status(500).json({ error: "Failed to get daily limit" });
    }
  });
  app2.post("/api/subscription/confirm-purchase", async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { expiresAt } = req.body;
      console.log(`[Subscription] \u{1F525} MANUAL PURCHASE CONFIRMATION: User ${user.id} confirmed purchase via client`);
      const subscriptionExpiresAt = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3);
      console.log(`[Subscription] Marking user ${user.id} as paid until ${subscriptionExpiresAt}`);
      const updateResult = await db3.update(userSubscriptions).set({
        isSubscribed: true,
        subscriptionExpiresAt
      }).where(eq3(userSubscriptions.userId, user.id));
      if (updateResult === void 0 || updateResult.rowCount === 0) {
        console.log(`[Subscription] User has no subscription record, creating new one`);
        await db3.insert(userSubscriptions).values({
          userId: user.id,
          isSubscribed: true,
          subscriptionExpiresAt,
          trialStartedAt: null,
          trialExpiresAt: null
        });
      }
      console.log(`[Subscription] \u2713 User ${user.id} marked as paid successfully`);
      const verifyRecord = await db3.query.userSubscriptions.findFirst({
        where: eq3(userSubscriptions.userId, user.id)
      });
      console.log(`[Subscription] \u2713 VERIFICATION - Record in database:`, {
        userId: verifyRecord?.userId,
        isSubscribed: verifyRecord?.isSubscribed,
        subscriptionExpiresAt: verifyRecord?.subscriptionExpiresAt
      });
      const status = await getUserSubscriptionStatus(user.id);
      return res.json({
        success: true,
        message: "\u2713 Purchase confirmed - you now have unlimited access!",
        status
      });
    } catch (error) {
      console.error("[Subscription] \u274C Confirm purchase error:", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return res.status(500).json({ error: "Failed to confirm purchase" });
    }
  });
  app2.post("/api/analyze", async (req, res) => {
    try {
      const user = req.user;
      const { text: text2 } = req.body;
      if (!user || !user.id) {
        return res.status(401).json({ error: "User not found" });
      }
      if (!text2 || typeof text2 !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }
      const shouldEnforce = await shouldEnforceDailyLimits(user.id);
      if (shouldEnforce) {
        const today = (/* @__PURE__ */ new Date()).toDateString();
        const todayConversations = await db3.query.conversations.findMany({
          where: and2(
            eq3(conversations.userId, user.id),
            gte2(conversations.createdAt, new Date(today))
          )
        });
        if (todayConversations.length >= 2) {
          return res.status(429).json({
            error: "Daily free limit reached. Upgrade to Pro for unlimited replies.",
            remaining: 0,
            limit: 2
          });
        }
      }
      const response = await openrouter2.chat.completions.create({
        model: MODEL2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT2 },
          {
            role: "user",
            content: `Conversation:
${text2}`
          }
        ],
        max_tokens: 350,
        temperature: 0.8
      });
      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ error: "No response from AI" });
      }
      let parsed;
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        return res.status(500).json({ error: "Failed to parse AI response" });
      }
      try {
        const responseData = {
          ...parsed,
          conversationId: void 0
        };
        db3.insert(conversations).values({
          userId: user.id,
          inputText: text2,
          analysis: parsed.analysis || "",
          score: parsed.score || 0,
          scoreLabel: parsed.scoreLabel || "Neutral",
          scoreAdvice: parsed.scoreAdvice || "Keep the conversation going",
          replies: parsed.replies || {}
        }).returning().then((result) => {
          if (result[0]) {
            console.log(`[/api/analyze] Conversation saved: ${result[0].id}`);
          }
        }).catch((dbError) => {
          console.error("Database save error (non-blocking):", dbError);
        });
        return res.json(responseData);
      } catch (dbError) {
        console.error("Database save error (non-blocking):", dbError);
        return res.json(parsed);
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({ error: msg });
    }
  });
}

// server/revenuecat-webhook.ts
import crypto from "crypto";
import express from "express";
import { Pool as Pool4 } from "pg";
import { drizzle as drizzle4 } from "drizzle-orm/node-postgres";
import { eq as eq4 } from "drizzle-orm";
var pool4 = new Pool4({
  connectionString: process.env.DATABASE_URL
});
var db4 = drizzle4(pool4, { schema: dbSchema });
var REVENUECAT_WEBHOOK_KEY = process.env.REVENUECAT_WEBHOOK_KEY || "";
function verifyWebhookSignature(body, signature) {
  if (!REVENUECAT_WEBHOOK_KEY) {
    console.warn("[RevenueCat] Warning: REVENUECAT_WEBHOOK_KEY not set - signatures not verified");
    return true;
  }
  const expectedSignature = crypto.createHmac("sha256", REVENUECAT_WEBHOOK_KEY).update(body).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
function setupRevenueCatWebhookBody(app2) {
  app2.post(
    "/api/webhooks/revenuecat",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      try {
        console.log("[RevenueCat] \u{1F514} WEBHOOK RECEIVED");
        const signature = req.header("X-RevenueCat-Signature");
        let rawBody;
        if (Buffer.isBuffer(req.body)) {
          rawBody = req.body.toString("utf-8");
        } else if (typeof req.body === "string") {
          rawBody = req.body;
        } else {
          console.error("[RevenueCat] \u274C Body is neither Buffer nor string:", typeof req.body);
          console.error("[RevenueCat] Body value:", req.body);
          return res.status(400).json({ error: "Invalid body format" });
        }
        console.log("[RevenueCat] Webhook raw body (first 200 chars):", rawBody.substring(0, 200));
        if (REVENUECAT_WEBHOOK_KEY && signature) {
          console.log("[RevenueCat] Verifying webhook signature...");
          if (!verifyWebhookSignature(rawBody, signature)) {
            console.warn("[RevenueCat] Invalid signature");
            return res.status(401).json({ error: "Invalid signature" });
          }
        } else if (!REVENUECAT_WEBHOOK_KEY) {
          console.warn("[RevenueCat] \u26A0\uFE0F  REVENUECAT_WEBHOOK_KEY not set - accepting webhook without signature verification");
        } else {
          console.warn("[RevenueCat] Missing signature header - accepting webhook anyway since key not configured");
        }
        let body;
        try {
          body = JSON.parse(rawBody);
        } catch (parseErr) {
          console.error("[RevenueCat] \u274C Failed to parse webhook JSON:", parseErr);
          console.error("[RevenueCat] Raw body was:", rawBody);
          return res.status(400).json({ error: "Invalid JSON in webhook body" });
        }
        console.log("[RevenueCat] \u2713 Webhook parsed successfully, event type:", body.event?.type);
        console.log("[RevenueCat] Calling handleRevenueCatEvent...");
        await handleRevenueCatEvent(body);
        console.log("[RevenueCat] \u2713 Webhook processed successfully");
        res.json({ success: true });
      } catch (error) {
        console.error("[RevenueCat] \u274C Error processing webhook:", error);
        res.json({ success: true, error: "Processed with errors" });
      }
    }
  );
}
async function handleRevenueCatEvent(event) {
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
async function handleInitialPurchase(userId, event) {
  try {
    const plan = extractPlanName(event);
    const expiresAt = event.event?.expiration_at_ms;
    const purchasedAt = event.event?.purchased_at_ms;
    console.log(`[RevenueCat] \u{1F525} INITIAL PURCHASE EVENT RECEIVED:`, {
      userId,
      plan,
      expiresAt,
      purchasedAt,
      fullEvent: JSON.stringify(event, null, 2)
    });
    const subscriptionExpiresAt = expiresAt ? new Date(expiresAt) : null;
    console.log(`[RevenueCat] Attempting database insert/update for userId: ${userId}`);
    const result = await db4.insert(userSubscriptions).values({
      userId,
      isSubscribed: true,
      subscriptionExpiresAt,
      trialStartedAt: null,
      trialExpiresAt: null
    }).onConflictDoUpdate({
      target: userSubscriptions.userId,
      set: {
        isSubscribed: true,
        subscriptionExpiresAt
      }
    });
    console.log(`[RevenueCat] \u2713 Database updated successfully for user ${userId}`, {
      isSubscribed: true,
      subscriptionExpiresAt
    });
    const verifyRecord = await db4.query.userSubscriptions.findFirst({
      where: eq4(userSubscriptions.userId, userId)
    });
    console.log(`[RevenueCat] \u2713 VERIFICATION - Record in database:`, verifyRecord);
    await notifySubscriptionSuccess(userId, plan || "Premium");
  } catch (error) {
    console.error("[RevenueCat] \u274C ERROR in handleInitialPurchase:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : void 0
    });
  }
}
async function handleRenewal(userId, event) {
  try {
    const plan = extractPlanName(event);
    const expiresAt = event.event?.expiration_at_ms;
    console.log(`[RevenueCat] Renewal: ${userId} - ${plan}, expires: ${expiresAt}`);
    const subscriptionExpiresAt = expiresAt ? new Date(expiresAt) : null;
    await db4.update(userSubscriptions).set({
      subscriptionExpiresAt
    }).where(eq4(userSubscriptions.userId, userId));
    console.log(`[RevenueCat] \u2713 Subscription renewed and updated for user ${userId}`);
  } catch (error) {
    console.error("[RevenueCat] Error handling renewal:", error);
  }
}
async function handleSubscriptionTransfer(userId, event) {
  try {
    console.log(`[RevenueCat] Subscription transfer: ${userId}`);
    const plan = extractPlanName(event);
    await notifySubscriptionSuccess(userId, plan || "Premium");
  } catch (error) {
    console.error("[RevenueCat] Error handling transfer:", error);
  }
}
async function handleSubscriptionStarted(userId, event) {
  try {
    const plan = extractPlanName(event);
    const expiresAt = event.event?.expiration_at_ms;
    console.log(`[RevenueCat] Subscription started: ${userId} - ${plan}, expires: ${expiresAt}`);
    const subscriptionExpiresAt = expiresAt ? new Date(expiresAt) : null;
    await db4.insert(userSubscriptions).values({
      userId,
      isSubscribed: true,
      subscriptionExpiresAt,
      trialStartedAt: null,
      trialExpiresAt: null
    }).onConflictDoUpdate({
      target: userSubscriptions.userId,
      set: {
        isSubscribed: true,
        subscriptionExpiresAt
      }
    });
    console.log(`[RevenueCat] \u2713 Subscription started and saved for user ${userId}`);
    await notifySubscriptionSuccess(userId, plan || "Premium");
  } catch (error) {
    console.error("[RevenueCat] Error handling subscription started:", error);
  }
}
async function handleCancellation(userId, event) {
  try {
    const reason = event.event?.cancellation_reason;
    console.log(`[RevenueCat] Cancellation: ${userId} - Reason: ${reason}`);
    await db4.update(userSubscriptions).set({
      isSubscribed: false,
      subscriptionExpiresAt: null
    }).where(eq4(userSubscriptions.userId, userId));
    console.log(`[RevenueCat] \u2713 Subscription cancelled for user ${userId}`);
  } catch (error) {
    console.error("[RevenueCat] Error handling cancellation:", error);
  }
}
function extractPlanName(event) {
  const productId = event.event?.product_id;
  if (!productId) {
    return "Premium";
  }
  const planMap = {
    "ghostreply_weekly": "Premium Weekly",
    "ghostreply_monthly": "Premium Monthly",
    "ghostreply_yearly": "Premium Yearly"
  };
  return planMap[productId] || "Premium";
}
function registerRevenueCatWebhook(app2) {
  setupRevenueCatWebhookBody(app2);
  console.log("[RevenueCat] Webhook endpoint registered at POST /api/webhooks/revenuecat");
}

// server/cron-scheduler.ts
import cron from "node-cron";
import { Pool as Pool5 } from "pg";
import { drizzle as drizzle5 } from "drizzle-orm/node-postgres";
var pool5 = new Pool5({
  connectionString: process.env.DATABASE_URL
});
var db5 = drizzle5(pool5, { schema: dbSchema });
async function getAllUsers() {
  try {
    const allUsers = await db5.select({ id: users.id }).from(users);
    return allUsers.map((u) => u.id);
  } catch (error) {
    console.error("Error fetching users for cron job:", error);
    return [];
  }
}
function initializeCronJobs() {
  console.log("[Cron] Initializing scheduled jobs...");
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
  console.log("[Cron] \u2713 Trial expiration check scheduled for 9:00 AM daily");
  console.log("[Cron] \u2713 Daily limit reset scheduled for 12:00 AM (midnight) daily");
  console.log("[Cron] Jobs initialized successfully");
}
function stopCronJobs() {
  console.log("[Cron] Stopping all scheduled jobs...");
  cron.getTasks().forEach((task) => task.stop());
  console.log("[Cron] All jobs stopped");
}

// server/middleware.ts
import { Pool as Pool7 } from "pg";
import { drizzle as drizzle7 } from "drizzle-orm/node-postgres";

// server/auth.ts
import { v4 as uuidv4 } from "uuid";
import { Pool as Pool6 } from "pg";
import { eq as eq5 } from "drizzle-orm";
import { drizzle as drizzle6 } from "drizzle-orm/node-postgres";
var db6 = null;
function getDb() {
  if (!db6) {
    const pool7 = new Pool6({
      connectionString: process.env.DATABASE_URL
    });
    db6 = drizzle6(pool7, { schema: dbSchema });
  }
  return db6;
}
async function getOrCreateDevice(deviceId) {
  if (!deviceId) {
    throw new Error("Device ID is required");
  }
  const database = getDb();
  try {
    const existingUser = await database.query.users.findFirst({
      where: eq5(users.deviceId, deviceId)
    });
    if (existingUser) {
      await database.update(users).set({ lastActiveAt: /* @__PURE__ */ new Date() }).where(eq5(users.id, existingUser.id));
      return existingUser;
    }
    const result = await database.insert(users).values({
      deviceId,
      createdAt: /* @__PURE__ */ new Date(),
      lastActiveAt: /* @__PURE__ */ new Date()
    }).returning();
    return result[0];
  } catch (error) {
    console.error("Get or create device error:", error);
    throw error;
  }
}
function extractDeviceId(req) {
  const deviceId = req.headers["x-device-id"] || req.headers["device-id"] || req.query?.deviceId || req.body?.deviceId;
  if (!deviceId || typeof deviceId !== "string") {
    return null;
  }
  return deviceId.trim();
}
function generateDeviceId() {
  return `device_${uuidv4()}`;
}

// server/middleware.ts
var pool6 = new Pool7({
  connectionString: process.env.DATABASE_URL
});
var db7 = drizzle7(pool6, { schema: dbSchema });
var rateLimitStore = /* @__PURE__ */ new Map();
var RATE_LIMITS = {
  "/api/analyze": { requests: 20, windowMs: 6e4 },
  // 20 req/min
  "/api/regenerate": { requests: 50, windowMs: 6e4 }
  // 50 req/min
};
function rateLimitMiddleware(req, res, next) {
  const key = `${req.ip}:${req.path}`;
  const limit = RATE_LIMITS[req.path];
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
async function deviceAuthMiddleware(req, res, next) {
  try {
    let deviceId = extractDeviceId(req);
    if (!deviceId) {
      deviceId = generateDeviceId();
      res.set("X-Device-Id", deviceId);
    }
    const user = await getOrCreateDevice(deviceId);
    req.user = user;
    req.deviceId = deviceId;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Authentication error: " + (error instanceof Error ? error.message : String(error)) });
  }
}
async function subscriptionCheckMiddleware(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      req.subscription = {
        isSubscribed: false,
        isPaid: false,
        isTrialActive: false,
        plan: "free"
      };
      return next();
    }
    const subscriptionStatus = await getUserSubscriptionStatus(user.id);
    console.log("[SubscriptionCheck] \u{1F50D} SUBSCRIPTION STATUS FROM DATABASE:", {
      userId: user.id,
      isSubscribed: subscriptionStatus.isSubscribed,
      isPaid: subscriptionStatus.isPaid,
      isTrialActive: subscriptionStatus.isTrialActive,
      plan: subscriptionStatus.plan,
      subscriptionExpiresAt: subscriptionStatus.subscriptionExpiresAt,
      trialExpiresAt: subscriptionStatus.trialExpiresAt
    });
    req.subscription = subscriptionStatus;
    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    req.subscription = {
      isSubscribed: false,
      isPaid: false,
      isTrialActive: false,
      plan: "free"
    };
    next();
  }
}

// server/index.ts
import * as fs2 from "fs";
import * as path2 from "path";
var app = express2();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const allowedOrigins = [
      "http://localhost:8081",
      "http://localhost:3000",
      "http://127.0.0.1:8081",
      ...process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []
    ];
    const origin = req.header("origin");
    if (origin && allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, X-Device-Id");
      res.header("Access-Control-Expose-Headers", "X-Device-Id");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express2.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express2.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path3 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path3.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path2.resolve(process.cwd(), "app.json");
    const appJsonContent = fs2.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path2.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs2.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs2.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path2.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs2.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express2.static(path2.resolve(process.cwd(), "assets")));
  app2.use(express2.static(path2.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  log("Starting server setup...");
  setupCors(app);
  log("CORS setup complete");
  setupBodyParsing(app);
  log("Body parsing setup complete");
  app.use(rateLimitMiddleware);
  log("Rate limiting middleware added");
  app.use(deviceAuthMiddleware);
  log("Device authentication middleware added");
  app.use(subscriptionCheckMiddleware);
  log("Subscription check middleware added");
  setupRequestLogging(app);
  log("Request logging setup complete");
  configureExpoAndLanding(app);
  log("Expo routing setup complete");
  log("Registering routes...");
  const server = await registerRoutes(app);
  log("Routes registered");
  log("Registering subscription routes...");
  await registerSubscriptionRoutes(app);
  log("Subscription routes registered");
  log("Registering push notification routes...");
  registerPushNotificationRoutes(app);
  log("Push notification routes registered");
  log("Registering RevenueCat webhook...");
  registerRevenueCatWebhook(app);
  log("RevenueCat webhook registered");
  log("Initializing cron jobs...");
  initializeCronJobs();
  log("Cron jobs initialized");
  setupErrorHandler(app);
  log("Error handler setup complete");
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    const address = server.address();
    log(`express server serving on port ${port}`);
  });
  process.on("SIGTERM", () => {
    log("SIGTERM received, shutting down gracefully...");
    stopCronJobs();
    server.close(() => {
      log("Server closed");
      process.exit(0);
    });
  });
  process.on("SIGINT", () => {
    log("SIGINT received, shutting down gracefully...");
    stopCronJobs();
    server.close(() => {
      log("Server closed");
      process.exit(0);
    });
  });
})();
