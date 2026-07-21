ALTER TABLE "student_ritual_settings" ADD COLUMN "morning_ai_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "student_ritual_settings" ADD COLUMN "morning_paths" text DEFAULT 'energy,ready,calm,curiosity,reflect' NOT NULL;
--> statement-breakpoint
ALTER TABLE "student_ritual_settings" ADD COLUMN "morning_sensitivity" text DEFAULT 'standard' NOT NULL;
--> statement-breakpoint
CREATE TABLE "morning_ripple_entries" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "student_id" uuid NOT NULL REFERENCES "students"("id"), "session_id" uuid NOT NULL REFERENCES "sessions"("id"), "mood" text NOT NULL, "energy" text NOT NULL, "path" text NOT NULL, "activity_id" text NOT NULL, "activity_result" text, "intention" text NOT NULL, "theme" text NOT NULL, "collectible" text NOT NULL, "content_source" text NOT NULL, "prompt" text, "created_at" timestamp with time zone DEFAULT now() NOT NULL, CONSTRAINT "morning_ripple_session_unique" UNIQUE("session_id"));
--> statement-breakpoint
CREATE INDEX "idx_morning_ripple_student_created" ON "morning_ripple_entries" USING btree ("student_id","created_at");
