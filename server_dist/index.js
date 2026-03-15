// server/index.ts
import "dotenv/config";
import express from "express";

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
var dbSchema = {
  users,
  conversations,
  userSubscriptions,
  analyticsEvents
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
      console.log("[/api/analyze] User:", user);
      console.log("[/api/analyze] Subscription:", subscription);
      console.log("[/api/analyze] Text length:", text2?.length);
      if (!user || !user.id) {
        console.error("[/api/analyze] User not found in request");
        return res.status(401).json({ error: "User not found" });
      }
      if (!text2 || typeof text2 !== "string") {
        return res.status(400).json({ error: "Text is required" });
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
          return res.status(429).json({
            error: "Daily free limit reached. Upgrade to Pro for unlimited replies.",
            remaining: 0
          });
        }
      }
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
        return res.status(500).json({ error: "No response from AI" });
      }
      let parsed;
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        return res.status(500).json({ error: "Failed to parse AI response" });
      }
      const responseData = {
        ...parsed,
        conversationId: void 0
      };
      db.insert(conversations).values({
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
    } catch (error) {
      console.error("AI analysis error:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
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
import { Pool as Pool2 } from "pg";
import { drizzle as drizzle2 } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
var pool2 = new Pool2({
  connectionString: process.env.DATABASE_URL
});
var db2 = drizzle2(pool2, { schema: dbSchema });
async function getUserSubscriptionStatus(userId) {
  try {
    const subscription = await db2.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId)
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
    const existingSubscription = await db2.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId)
    });
    if (existingSubscription) {
      if (!existingSubscription.trialStartedAt) {
        await db2.update(userSubscriptions).set({
          trialStartedAt: now,
          trialExpiresAt,
          updatedAt: now
        }).where(eq(userSubscriptions.userId, userId));
        console.log(`[Trial] Started new trial for user ${userId}, expires at ${trialExpiresAt}`);
      } else {
        console.log(`[Trial] User ${userId} already has a trial record`);
      }
    } else {
      await db2.insert(userSubscriptions).values({
        userId,
        isSubscribed: false,
        // Trial is not a paid subscription
        trialStartedAt: now,
        trialExpiresAt,
        createdAt: now,
        updatedAt: now
      });
      console.log(`[Trial] Created new trial for user ${userId}, expires at ${trialExpiresAt}`);
    }
    return getUserSubscriptionStatus(userId);
  } catch (error) {
    console.error("Error starting free trial:", error);
    throw new Error("Failed to start free trial");
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

// server/subscription-routes.ts
import { eq as eq2, gte, and } from "drizzle-orm";
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
      console.log(`[/api/subscription/status] User ${user.id}:`, status);
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
      console.log(`[/api/subscription/start-trial] Started trial for user ${user.id}`);
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
      const today = (/* @__PURE__ */ new Date()).toDateString();
      const todayConversations = await db2.query.conversations.findMany({
        where: and(
          eq2(conversations.userId, user.id),
          gte(conversations.createdAt, new Date(today))
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
  app2.post("/api/analyze", async (req, res) => {
    try {
      const user = req.user;
      const { text: text2 } = req.body;
      console.log("[/api/analyze] User:", user?.id);
      if (!user || !user.id) {
        console.error("[/api/analyze] User not found in request");
        return res.status(401).json({ error: "User not found" });
      }
      if (!text2 || typeof text2 !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }
      const shouldEnforce = await shouldEnforceDailyLimits(user.id);
      if (shouldEnforce) {
        const today = (/* @__PURE__ */ new Date()).toDateString();
        const todayConversations = await db2.query.conversations.findMany({
          where: and(
            eq2(conversations.userId, user.id),
            gte(conversations.createdAt, new Date(today))
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
        db2.insert(conversations).values({
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

// server/middleware.ts
import { Pool as Pool4 } from "pg";
import { drizzle as drizzle4 } from "drizzle-orm/node-postgres";
import { eq as eq4 } from "drizzle-orm";

// server/auth.ts
import { v4 as uuidv4 } from "uuid";
import { Pool as Pool3 } from "pg";
import { eq as eq3 } from "drizzle-orm";
import { drizzle as drizzle3 } from "drizzle-orm/node-postgres";
var db3 = null;
function getDb() {
  if (!db3) {
    const pool4 = new Pool3({
      connectionString: process.env.DATABASE_URL
    });
    db3 = drizzle3(pool4, { schema: dbSchema });
  }
  return db3;
}
async function getOrCreateDevice(deviceId) {
  if (!deviceId) {
    throw new Error("Device ID is required");
  }
  const database = getDb();
  try {
    const existingUser = await database.query.users.findFirst({
      where: eq3(users.deviceId, deviceId)
    });
    if (existingUser) {
      await database.update(users).set({ lastActiveAt: /* @__PURE__ */ new Date() }).where(eq3(users.id, existingUser.id));
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
var pool3 = new Pool4({
  connectionString: process.env.DATABASE_URL
});
var db4 = drizzle4(pool3, { schema: dbSchema });
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
    console.log("[DeviceAuth] Path:", req.path);
    console.log("[DeviceAuth] Headers:", req.headers);
    let deviceId = extractDeviceId(req);
    console.log("[DeviceAuth] Extracted device ID:", deviceId);
    if (!deviceId) {
      console.log("[DeviceAuth] No device ID, generating new one");
      deviceId = generateDeviceId();
      res.set("X-Device-Id", deviceId);
    }
    console.log("[DeviceAuth] Getting or creating user for device:", deviceId);
    const user = await getOrCreateDevice(deviceId);
    console.log("[DeviceAuth] User retrieved/created:", user);
    req.user = user;
    req.deviceId = deviceId;
    next();
  } catch (error) {
    console.error("Device auth error:", error);
    return res.status(500).json({ error: "Authentication error: " + (error instanceof Error ? error.message : String(error)) });
  }
}
async function subscriptionCheckMiddleware(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const subscription = await db4.query.userSubscriptions.findFirst({
      where: eq4(userSubscriptions.userId, user.id)
    });
    const now = /* @__PURE__ */ new Date();
    const isSubscribed = subscription && subscription.isSubscribed && (!subscription.subscriptionExpiresAt || subscription.subscriptionExpiresAt > now);
    const isInTrial = subscription && subscription.trialStartedAt && subscription.trialExpiresAt && subscription.trialExpiresAt > now;
    req.subscription = {
      isSubscribed: isSubscribed || isInTrial,
      isPaid: isSubscribed,
      isTrialActive: isInTrial,
      plan: subscription?.plan
    };
    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    req.subscription = { isSubscribed: false, isPaid: false, isTrialActive: false };
    next();
  }
}

// server/index.ts
import * as fs2 from "fs";
import * as path2 from "path";
var app = express();
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
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
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
  app2.use("/assets", express.static(path2.resolve(process.cwd(), "assets")));
  app2.use(express.static(path2.resolve(process.cwd(), "static-build")));
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
  setupErrorHandler(app);
  log("Error handler setup complete");
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    const address = server.address();
    log(`express server serving on port ${port}`);
  });
})();
