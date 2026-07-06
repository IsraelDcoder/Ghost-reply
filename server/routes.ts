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

const OPENROUTER_MODEL =
  process.env.AI_INTEGRATIONS_OPENROUTER_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_FALLBACK_MODEL = "meta-llama/llama-3.1-8b-instruct";

type OpenRouterChatMessage = {
  role: "system" | "user";
  content: string;
};

const SYSTEM_PROMPT = `You are writing text messages for a real person. Write like someone texting on iMessage or WhatsApp.
Requirements:
- Sound natural, casual, emotionally believable, and human.
- Use contractions, conversational rhythm, and occasional light emoji only if it feels natural.
- Keep each reply 18-35 words, concise but complete.
- Reference details from the conversation whenever possible.
- Make each of the five replies feel distinctly different in tone.
- Avoid sounding like AI, a dating coach, corporate copy, motivational advice, or a polished essay.
- Avoid clichés, cheesy romance, and over-explaining.
Generate 5 reply styles for this conversation.
Return ONLY valid JSON, no markdown.
{
  "analysis": "Brief tone insight (1-2 sentences max)",
  "score": <0-100>,
  "scoreLabel": "Label like 'Strong Start'",
  "scoreAdvice": "1 sentence tip",
  "replies": {
    "confident": "<reply 18-35 words, calm, direct, self-assured>",
    "flirty": "<reply 18-35 words, playful, charming, lightly teasing>",
    "funny": "<reply 18-35 words, light humor, clever, playful>",
    "savage": "<reply 18-35 words, bold, witty, slightly sharp>",
    "smart": "<reply 18-35 words, thoughtful, emotionally intelligent, mature>"
  }
}`;

function isModelFallbackError(message: string): boolean {
  return (
    message.includes("404") ||
    message.includes("400") ||
    message.includes("not a valid model") ||
    message.includes("model not found") ||
    message.includes("unsupported model")
  );
}

async function createOpenRouterChatCompletion(options: {
  model: string;
  messages: OpenRouterChatMessage[];
  max_tokens: number;
  temperature: number;
}) {
  try {
    return await openrouter.chat.completions.create(options as any);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("[OpenRouter] Chat completion failed:", message);

    if (isModelFallbackError(message) && options.model !== OPENROUTER_FALLBACK_MODEL) {
      console.warn(
        `[OpenRouter] Model ${options.model} not available, retrying with fallback model ${OPENROUTER_FALLBACK_MODEL}.`,
      );
      return await openrouter.chat.completions.create({
        ...options,
        model: OPENROUTER_FALLBACK_MODEL,
      } as any);
    }

    throw error;
  }
}

async function humanizeReplyPayload(conversationText: string, parsed: any) {
  try {
    const response = await createOpenRouterChatCompletion({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a human-writing editor. Rewrite the reply set to sound more natural, believable, and like a real person texting. Keep the same personality labels and the same overall meaning, but make the wording more casual, specific, and human. Return ONLY valid JSON with the same shape.`,
        },
        {
          role: "user",
          content: `Conversation:\n${conversationText}\n\nReply set:\n${JSON.stringify(parsed, null, 2)}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.8,
    } as any);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return parsed;
    }

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const revised = JSON.parse(cleaned);
    return revised;
  } catch (error) {
    console.warn("[OpenRouter] Humanization pass failed, keeping original replies.", error);
    return parsed;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const subscription = (req as any).subscription;
      const { text } = req.body;

      // 🔥 CRITICAL DEBUG LOGGING
      console.log("[ANALYZE] ════════════════════════════════════════");
      console.log("[ANALYZE] User ID:", user?.id);
      console.log("[ANALYZE] Subscription Data:", {
        isSubscribed: subscription?.isSubscribed,
        isPaid: subscription?.isPaid,
        isTrialActive: subscription?.isTrialActive,
        plan: subscription?.plan,
      });

      // Validate user exists
      if (!user || !user.id) {
        console.error("[ANALYZE] ❌ User not found");
        return res.status(401).json({ error: "User not found" });
      }

      if (!text || typeof text !== "string") {
        console.error("[ANALYZE] ❌ Text is required");
        return res.status(400).json({ error: "Text is required" });
      }

      if (!subscription?.isSubscribed) {
        console.log("[ANALYZE] 🔍 User is NOT subscribed - blocking access");
        return res.status(403).json({
          error: "Subscription required. Please upgrade to Pro to analyze conversations.",
        });
      }
      console.log("[ANALYZE] ✓ User is SUBSCRIBED - allowing unlimited access");

      console.log("[ANALYZE] Calling OpenRouter API...");
      const response = await createOpenRouterChatCompletion({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Conversation:\n${text}`,
          },
        ] as OpenRouterChatMessage[],
        max_tokens: 500,
        temperature: 0.9,
      } as any);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error("[ANALYZE] ❌ No response from AI");
        return res.status(500).json({ error: "No response from AI" });
      }

      let parsed: any;
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        console.error("[ANALYZE] ❌ Failed to parse AI response");
        return res.status(500).json({ error: "Failed to parse AI response" });
      }

      try {
        parsed = await humanizeReplyPayload(text, parsed);
      } catch {
        console.warn("[ANALYZE] Humanization pass skipped");
      }

      // Save to database and wait for it to complete
      try {
        await db.insert(conversations)
          .values({
            userId: user.id,
            inputText: text,
            analysis: parsed.analysis || "",
            score: parsed.score || 0,
            scoreLabel: parsed.scoreLabel || "Neutral",
            scoreAdvice: parsed.scoreAdvice || "Keep the conversation going",
            replies: parsed.replies || {},
          });
        console.log("[ANALYZE] ✓ Conversation saved to database");
      } catch (dbError) {
        console.error("[ANALYZE] ⚠️  DB save failed:", dbError);
        // Log to error tracking, don't fail the request
      }

      // Return response after DB save is complete
      const responseData = {
        ...parsed,
        conversationId: undefined,
      };

      console.log("[ANALYZE] ✓ SUCCESS - Returning response");
      console.log("[ANALYZE] ════════════════════════════════════════");
      return res.json(responseData);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[ANALYZE] ❌ FATAL ERROR:", msg);
      console.log("[ANALYZE] ════════════════════════════════════════");
      return res.status(502).json({
        error: "Our AI service is temporarily unavailable. Please try again in a moment.",
      });
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
        confident: "Generate a new reply that feels calm, direct, self-assured, and naturally attractive.",
        flirty: "Generate a new reply that feels playful, charming, lightly teasing, and effortlessly flirty.",
        funny: "Generate a new reply that feels light, clever, and genuinely funny without sounding forced.",
        savage: "Generate a new reply that feels bold, witty, and slightly sharp without sounding rude.",
        smart: "Generate a new reply that feels thoughtful, emotionally intelligent, mature, and intriguing.",
      };

      const response = await createOpenRouterChatCompletion({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content: `You are writing a real text message. ${personalityPrompts[personality] || "Generate a witty reply."}
Write it like a real person texting on iMessage or WhatsApp.
Requirements:
- 18-35 words
- natural, casual, conversational
- use contractions and rhythm
- sound human, not polished or robotic
- reference the conversation context if relevant
- no explanation, no quotes, only the reply text`,
          },
          {
            role: "user",
            content: `Conversation:\n${text}`,
          },
        ],
        max_tokens: 180,
        temperature: 0.9,
      } as any);

      const reply = response.choices[0]?.message?.content?.trim() || "";
      return res.json({ reply: reply.replace(/^["']|["']$/g, "") });
    } catch (error: unknown) {
      console.error("Regenerate error:", error);
      return res.status(502).json({
        error: "Our AI service is temporarily unavailable. Please try again in a moment.",
      });
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
