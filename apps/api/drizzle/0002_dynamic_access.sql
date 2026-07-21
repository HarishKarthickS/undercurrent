ALTER TABLE "parent_accounts" ADD COLUMN "verification_token_expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "parent_accounts" ADD COLUMN "password_reset_token_hash" text;
--> statement-breakpoint
ALTER TABLE "parent_accounts" ADD COLUMN "password_reset_token_expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "pin_hash" text;
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "pin_updated_at" timestamp with time zone;
--> statement-breakpoint
CREATE TABLE "student_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "household_id" uuid NOT NULL REFERENCES "households"("id"),
  "student_id" uuid NOT NULL REFERENCES "students"("id"),
  "destination_email" text NOT NULL,
  "destination_type" text NOT NULL,
  "parent_confirmed_student_email" boolean DEFAULT false NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_student_invitations_token" ON "student_invitations" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX "idx_student_invitations_student" ON "student_invitations" USING btree ("student_id","created_at");
--> statement-breakpoint
CREATE TABLE "student_device_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "household_id" uuid NOT NULL REFERENCES "households"("id"),
  "student_id" uuid NOT NULL REFERENCES "students"("id"),
  "token_hash" text NOT NULL,
  "device_label" text DEFAULT 'This device' NOT NULL,
  "last_access_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "student_device_token_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE INDEX "idx_student_devices_student" ON "student_device_sessions" USING btree ("student_id","last_access_at");
--> statement-breakpoint
CREATE TABLE "access_audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "household_id" uuid NOT NULL REFERENCES "households"("id"),
  "student_id" uuid REFERENCES "students"("id"),
  "actor_type" text NOT NULL,
  "event_type" text NOT NULL,
  "metadata" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_access_audit_household_created" ON "access_audit_events" USING btree ("household_id","created_at");
