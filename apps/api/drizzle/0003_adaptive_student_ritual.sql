CREATE TABLE "student_ritual_settings" ("student_id" uuid PRIMARY KEY NOT NULL REFERENCES "students"("id"), "morning_start_hour" integer DEFAULT 5 NOT NULL, "evening_start_hour" integer DEFAULT 16 NOT NULL, "daily_session_limit" integer DEFAULT 2 NOT NULL, "voice_enabled" boolean DEFAULT true NOT NULL, "activity_enabled" boolean DEFAULT true NOT NULL, "preferred_style" text DEFAULT 'adaptive' NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE TABLE "session_recaps" ("session_id" uuid PRIMARY KEY NOT NULL REFERENCES "sessions"("id"), "student_id" uuid NOT NULL REFERENCES "students"("id"), "title" text NOT NULL, "summary" text NOT NULL, "discovery" text NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE INDEX "idx_session_recaps_student_created" ON "session_recaps" USING btree ("student_id","created_at");
