CREATE TABLE "parent_advisor_turns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "parent_id" uuid NOT NULL REFERENCES "parent_accounts"("id"),
  "student_id" uuid NOT NULL REFERENCES "students"("id"),
  "role" text NOT NULL,
  "ciphertext" text NOT NULL,
  "iv" text NOT NULL,
  "auth_tag" text NOT NULL,
  "key_version" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_parent_advisor_turns_parent_student_created" ON "parent_advisor_turns" USING btree ("parent_id","student_id","created_at");
--> statement-breakpoint
CREATE TABLE "parent_advisor_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "parent_id" uuid NOT NULL REFERENCES "parent_accounts"("id"),
  "student_id" uuid NOT NULL REFERENCES "students"("id"),
  "idempotency_key" text NOT NULL,
  "request_hash" text NOT NULL,
  "response_body" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  CONSTRAINT "parent_advisor_requests_parent_student_key_unique" UNIQUE("parent_id","student_id","idempotency_key")
);
