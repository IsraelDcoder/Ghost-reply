/**
 * Add these routes to your server/routes.ts file
 * Inside the registerRoutes() function
 */

import type { Express, Request, Response } from "express";
import { db } from "./subscription-service";
import {
  getUserSubscriptionStatus,
  startFreeTrial,
  shouldEnforceDailyLimits,
  getDailyLimitForUser,
} from "./subscription-service";
import { userSubscriptions, conversations } from "@/shared/schema";
import { eq, gte, and } from "drizzle-orm";
import OpenAI from "openai";

export async function registerSubscriptionRoutes(app: Express): Promise<void> {
  const openrouter = new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
  });
  const MODEL = "anthropic/claude-3-haiku";
  const SYSTEM_PROMPT = `You are an expert conversation coach and reply generator.
Analyze the conversation/message provided and generate 5 different reply styles.
Return ONLY valid JSON, no markdown, no explanation.

Return this exact structure:
{
  "analysis": "Brief insight about the conversation tone and dynamics (1-2 sentences)",
  "score": <number 0-100 representing conversation engagement/strength>,
  "scoreLabel": "<short label like 'Strong Start', 'Playing It Cool', 'Hot Connection', etc.>",
  "scoreAdvice": "<one sentence tip to improve>",
  "replies": {
    "confident": "<confident reply>",
    "flirty": "<flirty reply>",
    "funny": "<funny reply>",
    "savage": "<savage reply>",
    "smart": "<thoughtful/smart reply>"
  }
}

Keep replies concise (under 20 words each). Make them feel natural, witty, and authentic.`;

  /**
   * GET /api/subscription/status
   * Get current subscription status for the user
   * Returns: { isSubscribed, isPaid, isTrialActive, plan, daysRemaining?, ... }
   */
  app.get("/api/subscription/status", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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

  /**
   * POST /api/subscription/start-trial
   * Start a 30-day free trial for the user
   * Returns: { isSubscribed, isPaid, isTrialActive, plan, daysRemaining }
   */
  app.post("/api/subscription/start-trial", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user already has an active subscription or trial
    const currentStatus = await getUserSubscriptionStatus(user.id);
    if (currentStatus.isSubscribed) {
      return res.status(400).json({
        error: "User already has an active subscription or trial",
        currentPlan: currentStatus.plan,
      });
    }

    // Start the trial
    const newStatus = await startFreeTrial(user.id);

    console.log(`[/api/subscription/start-trial] Started trial for user ${user.id}`);

    return res.json({
      success: true,
      message: "Free trial started successfully",
      ...newStatus,
    });
  } catch (error) {
    console.error("Start trial error:", error);
    return res.status(500).json({ error: "Failed to start free trial" });
  }
  });

  /**
   * GET /api/subscription/daily-limit
   * Get the daily limit for the current user
   * Free users get 2, everyone else gets unlimited
   */
  app.get("/api/subscription/daily-limit", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const dailyLimit = await getDailyLimitForUser(user.id);
    const status = await getUserSubscriptionStatus(user.id);

    // Count today's conversations
    const today = new Date().toDateString();
    const todayConversations = await db.query.conversations.findMany({
      where: and(
        eq(conversations.userId, user.id),
        gte(conversations.createdAt, new Date(today))
      ),
    });

    return res.json({
      dailyLimit,
      used: todayConversations.length,
      remaining: Math.max(0, dailyLimit - todayConversations.length),
      isUnlimited: dailyLimit === Infinity,
      plan: status.plan,
    });
  } catch (error) {
    console.error("Daily limit error:", error);
    return res.status(500).json({ error: "Failed to get daily limit" });
  }
  });

  /**
   * Modified /api/analyze endpoint to use new subscription service
   * Already in routes.ts but here's the updated logic
   */
  app.post("/api/analyze", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { text } = req.body;

    console.log("[/api/analyze] User:", user?.id);

    if (!user || !user.id) {
      console.error("[/api/analyze] User not found in request");
      return res.status(401).json({ error: "User not found" });
    }

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    // CHECK DAILY LIMITS USING NEW SERVICE
    const shouldEnforce = await shouldEnforceDailyLimits(user.id);

    if (shouldEnforce) {
      // This is a free user - check daily limit
      const today = new Date().toDateString();
      const todayConversations = await db.query.conversations.findMany({
        where: and(
          eq(conversations.userId, user.id),
          gte(conversations.createdAt, new Date(today))
        ),
      });

      if (todayConversations.length >= 2) {
        return res.status(429).json({
          error: "Daily free limit reached. Upgrade to Pro for unlimited replies.",
          remaining: 0,
          limit: 2,
        });
      }
    }

    // ... rest of the analysis logic
    const response = await openrouter.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this conversation and generate replies:\n\n${text}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.9,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: "No response from AI" });
    }

    let parsed: any;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    try {
      const result = await db
        .insert(conversations)
        .values({
          userId: user.id,
          inputText: text,
          analysis: parsed.analysis || "",
          score: parsed.score || 0,
          scoreLabel: parsed.scoreLabel || "Neutral",
          scoreAdvice: parsed.scoreAdvice || "Keep the conversation going",
          replies: parsed.replies || {},
        })
        .returning();

      return res.json({
        ...parsed,
        conversationId: result[0]?.id,
      });
    } catch (dbError) {
      console.error("Database save error:", dbError);
      return res.json(parsed);
    }
  } catch (error: unknown) {
    console.error("AI analysis error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
  });
}
