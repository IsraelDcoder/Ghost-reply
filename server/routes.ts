import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import * as fs from "fs";
import * as path from "path";
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

// Use Claude 3.5 Haiku - fast, reliable, and highly available on OpenRouter
const MODEL = "anthropic/claude-3-5-haiku";

const SYSTEM_PROMPT = `You are a conversation coach. Generate 5 reply styles for this conversation.
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
            content: `Conversation:\n${text}`,
          },
        ],
        max_tokens: 350,
        temperature: 0.8,
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

      // Return response immediately, save to database in background
      const responseData = {
        ...parsed,
        conversationId: undefined,
      };

      // Fire and forget - save to DB without blocking response
      db.insert(conversations)
        .values({
          userId: user.id,
          inputText: text,
          analysis: parsed.analysis || "",
          score: parsed.score || 0,
          scoreLabel: parsed.scoreLabel || "Neutral",
          scoreAdvice: parsed.scoreAdvice || "Keep the conversation going",
          replies: parsed.replies || {},
        })
        .returning()
        .then((result) => {
          if (result[0]) {
            console.log(`[/api/analyze] Conversation saved: ${result[0].id}`);
          }
        })
        .catch((dbError) => {
          console.error("Database save error (non-blocking):", dbError);
        });

      return res.json(responseData);
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

  // Privacy Policy
  app.get("/privacy-policy", (_req: Request, res: Response) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
