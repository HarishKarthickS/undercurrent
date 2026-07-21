CREATE TABLE "session_turns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "sessions"("id"),
  "role" text NOT NULL,
  "ciphertext" text NOT NULL,
  "iv" text NOT NULL,
  "auth_tag" text NOT NULL,
  "key_version" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_session_turns_session_created" ON "session_turns" USING btree ("session_id","created_at");
--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "assessor_agreement" integer;
--> statement-breakpoint
ALTER TABLE "safety_events" ADD COLUMN "email_status" text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE "parent_accounts" ADD COLUMN "password_hash" text;
--> statement-breakpoint
ALTER TABLE "parent_accounts" ADD COLUMN "email_verified_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "parent_accounts" ADD COLUMN "verification_token_hash" text;
--> statement-breakpoint
ALTER TABLE "parent_accounts" ADD COLUMN "magic_token_hash" text;
--> statement-breakpoint
ALTER TABLE "parent_accounts" ADD COLUMN "magic_token_expires_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX "idx_parent_accounts_email" ON "parent_accounts" USING btree ("email");
