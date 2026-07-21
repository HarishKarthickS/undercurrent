ALTER TABLE "student_ritual_settings" ADD COLUMN "experience_band_override" text;
--> statement-breakpoint
ALTER TABLE "household_preferences" ADD COLUMN "product_analytics_consent" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE "product_analytics_events" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "household_id" uuid NOT NULL REFERENCES "households"("id"), "event_name" text NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE INDEX "idx_product_analytics_events_created" ON "product_analytics_events" USING btree ("created_at");
