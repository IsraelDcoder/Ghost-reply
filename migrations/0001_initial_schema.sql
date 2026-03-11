CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "device_id" varchar UNIQUE NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "last_active_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "input_text" text NOT NULL,
  "analysis" text NOT NULL,
  "score" integer NOT NULL,
  "score_label" varchar NOT NULL,
  "score_advice" varchar NOT NULL,
  "replies" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_subscriptions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "is_subscribed" boolean DEFAULT false,
  "subscription_provider" varchar,
  "subscription_id" varchar,
  "plan" varchar,
  "trial_started_at" timestamp,
  "trial_expires_at" timestamp,
  "subscription_started_at" timestamp,
  "subscription_expires_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "event_name" varchar NOT NULL,
  "event_data" jsonb,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "conversations_user_id_idx" ON "conversations"("user_id");
CREATE INDEX IF NOT EXISTS "user_subscriptions_user_id_idx" ON "user_subscriptions"("user_id");
CREATE INDEX IF NOT EXISTS "analytics_events_user_id_idx" ON "analytics_events"("user_id");
CREATE INDEX IF NOT EXISTS "analytics_events_event_name_idx" ON "analytics_events"("event_name");
