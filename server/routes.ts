import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { conversations, dbSchema } from "@/shared/schema";
import { and, eq, gte } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db: NodePgDatabase<typeof dbSchema> = drizzle(pool, { schema: dbSchema });

const openrouter = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
});

// Use correct model ID for OpenRouter - Claude 3 Haiku is fast and cheap
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

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const subscription = (req as any).subscription;
      const { text } = req.body;

      console.log("[/api/analyze] User:", user);
      console.log("[/api/analyze] Subscription:", subscription);
      console.log("[/api/analyze] Text length:", text?.length);

      // Validate user exists
      if (!user || !user.id) {
        console.error("[/api/analyze] User not found in request");
        return res.status(401).json({ error: "User not found" });
      }

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      // Check subscription or free tier limit
      if (!subscription?.isSubscribed) {
        // Free tier: 2 replies per day
        const today = new Date().toDateString();
        const todayConversations = await db.query.conversations.findMany({
          where: (fields, operators) =>
            operators.and(
              operators.eq(fields.userId, user.id),
              operators.gte(fields.createdAt, new Date(today))
            ),
        });

        if (todayConversations.length >= 2) {
          return res.status(429).json({
            error: "Daily free limit reached. Upgrade to Pro for unlimited replies.",
            remaining: 0,
          });
        }
      }

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

      // Store conversation in database
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
        // Return AI response even if storage fails
        return res.json(parsed);
      }
    } catch (error: unknown) {
      console.error("AI analysis error:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({ error: msg });
    }
  });

  app.post("/api/regenerate", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const subscription = (req as any).subscription;
      const { text, personality } = req.body;

      if (!text || !personality) {
        return res.status(400).json({ error: "Text and personality are required" });
      }

      // Check subscription
      if (!subscription?.isSubscribed) {
        // Free tier can regenerate but counts toward limit
        const today = new Date().toDateString();
        const todayConversations = await db.query.conversations.findMany({
          where: (fields, operators) =>
            operators.and(
              operators.eq(fields.userId, user.id),
              operators.gte(fields.createdAt, new Date(today))
            ),
        });

        if (todayConversations.length >= 2) {
          return res.status(429).json({ error: "Daily free limit reached" });
        }
      }

      const personalityPrompts: Record<string, string> = {
        confident: "Generate a new confident, self-assured reply. Be bold and direct.",
        flirty: "Generate a new flirty, playful reply. Be charming and suggestive.",
        funny: "Generate a new funny, witty reply. Be clever and make them laugh.",
        savage: "Generate a new savage, sharp reply. Be brutally honest or cutting.",
        smart: "Generate a new thoughtful, intelligent reply. Be insightful and deep.",
      };

      const response = await openrouter.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are a conversation coach. ${personalityPrompts[personality] || "Generate a witty reply."} 
Keep it under 20 words. Return ONLY the reply text, nothing else.`,
          },
          {
            role: "user",
            content: `Conversation:\n${text}`,
          },
        ],
        max_tokens: 200,
        temperature: 1.0,
      });

      const reply = response.choices[0]?.message?.content?.trim() || "";
      return res.json({ reply: reply.replace(/^["']|["']$/g, "") });
    } catch (error: unknown) {
      console.error("Regenerate error:", error);
      return res.status(500).json({ error: "Failed to regenerate" });
    }
  });

  // Get conversation history
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userConversations = await db.query.conversations.findMany({
        where: (fields, operators) => operators.eq(fields.userId, user.id),
        orderBy: (fields, operators) => [operators.desc(fields.createdAt)],
        limit: 100,
      });

      return res.json({ conversations: userConversations });
    } catch (error) {
      console.error("Get conversations error:", error);
      return res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    return res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
