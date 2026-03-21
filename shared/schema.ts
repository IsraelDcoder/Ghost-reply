import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Device-based users (anonymous)
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

// Conversations and analysis results
export const conversations = pgTable("conversations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  inputText: text("input_text").notNull(),
  analysis: text("analysis").notNull(),
  score: integer("score").notNull(),
  scoreLabel: varchar("score_label").notNull(),
  scoreAdvice: varchar("score_advice").notNull(),
  replies: jsonb("replies").notNull().$type<{
    confident: string;
    flirty: string;
    funny: string;
    savage: string;
    smart: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User subscriptions and trial status
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isSubscribed: boolean("is_subscribed").default(false),
  subscriptionProvider: varchar("subscription_provider"), // "revenuecat"
  subscriptionId: varchar("subscription_id"), // RevenueCat subscription ID
  plan: varchar("plan"), // "monthly" or "yearly"
  trialStartedAt: timestamp("trial_started_at"),
  trialExpiresAt: timestamp("trial_expires_at"),
  subscriptionStartedAt: timestamp("subscription_started_at"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics events for tracking
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventName: varchar("event_name").notNull(), // app_open, screenshot_uploaded, reply_generated, etc.
  eventData: jsonb("event_data").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Push notification tokens for Expo
export const pushTokens = pgTable("push_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(), // Expo push token (ExponentPushToken[...])
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

// Notification history to prevent duplicate notifications
export const notificationHistory = pgTable("notification_history", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  notificationType: varchar("notification_type").notNull(), // trial_expiring, trial_expired, daily_reset, etc.
  data: jsonb("data").$type<Record<string, unknown>>(),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Schema validation with Zod
export const insertUserSchema = createInsertSchema(users).pick({
  deviceId: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  userId: true,
  inputText: true,
  analysis: true,
  score: true,
  scoreLabel: true,
  scoreAdvice: true,
  replies: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).pick({
  userId: true,
  isSubscribed: true,
  subscriptionProvider: true,
  subscriptionId: true,
  plan: true,
  trialStartedAt: true,
  trialExpiresAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).pick({
  userId: true,
  eventName: true,
  eventData: true,
});

export const insertPushTokenSchema = createInsertSchema(pushTokens).pick({
  userId: true,
  token: true,
});

export const insertNotificationHistorySchema = createInsertSchema(notificationHistory).pick({
  userId: true,
  notificationType: true,
  data: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

// Drizzle schema object for proper typing
export const dbSchema = {
  users,
  conversations,
  userSubscriptions,
  analyticsEvents,
  pushTokens,
  notificationHistory,
};
