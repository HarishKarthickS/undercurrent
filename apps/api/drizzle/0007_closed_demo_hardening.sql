CREATE TYPE "public"."guardian_role" AS ENUM('owner', 'guardian');--> statement-breakpoint
ALTER TABLE "parent_accounts" ADD COLUMN "role" "guardian_role" DEFAULT 'owner' NOT NULL;--> statement-breakpoint
ALTER TABLE "parent_accounts" ADD CONSTRAINT "parent_accounts_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "parent_sessions" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "parent_sessions" ADD COLUMN "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "parent_sessions" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "parent_sessions" ADD COLUMN "device_label" text;--> statement-breakpoint
ALTER TABLE "parent_sessions" ADD COLUMN "ip_hash" text;--> statement-breakpoint
ALTER TABLE "parent_sessions" ADD CONSTRAINT "parent_sessions_id_unique" UNIQUE("id");--> statement-breakpoint
CREATE TABLE "parent_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "household_id" uuid NOT NULL REFERENCES "households"("id"),
  "email" text NOT NULL,
  "role" "guardian_role" DEFAULT 'guardian' NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_by_parent_id" uuid REFERENCES "parent_accounts"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "idx_parent_invitations_email" ON "parent_invitations" USING btree ("email","created_at");--> statement-breakpoint
CREATE TABLE "household_terms_acceptances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "household_id" uuid NOT NULL REFERENCES "households"("id"),
  "parent_id" uuid NOT NULL REFERENCES "parent_accounts"("id"),
  "terms_version" text NOT NULL,
  "terms_sha256" text NOT NULL,
  "collection_basis" text DEFAULT 'demo_terms_acknowledgement' NOT NULL,
  "accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "revoked_at" timestamp with time zone,
  CONSTRAINT "household_terms_parent_version_unique" UNIQUE("parent_id","terms_version")
);--> statement-breakpoint
CREATE INDEX "idx_household_terms_household" ON "household_terms_acceptances" USING btree ("household_id","accepted_at");--> statement-breakpoint
ALTER TABLE "consent_records" ADD COLUMN "collection_basis" text DEFAULT 'demo_terms_acknowledgement' NOT NULL;--> statement-breakpoint
ALTER TABLE "consent_records" ADD COLUMN "terms_version" text;--> statement-breakpoint
ALTER TABLE "consent_records" ADD COLUMN "terms_sha256" text;--> statement-breakpoint
ALTER TABLE "consent_records" ADD COLUMN "accepted_by_parent_id" uuid;--> statement-breakpoint
CREATE TABLE "student_unlock_sessions" (
  "token_hash" text PRIMARY KEY NOT NULL,
  "device_id" uuid NOT NULL REFERENCES "student_device_sessions"("id"),
  "student_id" uuid NOT NULL REFERENCES "students"("id"),
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "idx_student_unlock_student_expiry" ON "student_unlock_sessions" USING btree ("student_id","expires_at");
