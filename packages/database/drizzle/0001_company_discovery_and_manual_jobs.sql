ALTER TABLE "companies" ADD COLUMN "website_url" text;--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'published', 'closed');--> statement-breakpoint
CREATE TYPE "public"."ingestion_run_status" AS ENUM('running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "data_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL,
  "name" text NOT NULL,
  "kind" text NOT NULL,
  "website_url" text,
  "terms_url" text,
  "enabled" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "company_source_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" text NOT NULL,
  "source_id" uuid NOT NULL,
  "external_id" text,
  "external_url" text,
  "normalized_domain" text,
  "raw_data" jsonb,
  "first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" text NOT NULL,
  "title" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "location_text" text,
  "workplace_type" text,
  "employment_type" text,
  "salary_min" bigint,
  "salary_max" bigint,
  "salary_currency" text,
  "apply_url" text,
  "source_url" text,
  "status" "job_status" DEFAULT 'draft' NOT NULL,
  "posted_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "last_verified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "job_source_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "job_id" uuid NOT NULL,
  "source_id" uuid NOT NULL,
  "external_id" text,
  "external_url" text,
  "raw_data" jsonb,
  "first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_id" uuid NOT NULL,
  "run_type" text NOT NULL,
  "status" "ingestion_run_status" DEFAULT 'running' NOT NULL,
  "records_fetched" integer DEFAULT 0 NOT NULL,
  "records_inserted" integer DEFAULT 0 NOT NULL,
  "records_updated" integer DEFAULT 0 NOT NULL,
  "records_skipped" integer DEFAULT 0 NOT NULL,
  "credits_used" integer DEFAULT 0 NOT NULL,
  "cursor_before" text,
  "cursor_after" text,
  "error_message" text,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "finished_at" timestamp with time zone
);--> statement-breakpoint
ALTER TABLE "company_source_records" ADD CONSTRAINT "company_source_records_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_source_records" ADD CONSTRAINT "company_source_records_source_id_data_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."data_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_source_records" ADD CONSTRAINT "job_source_records_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_source_records" ADD CONSTRAINT "job_source_records_source_id_data_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."data_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_source_id_data_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."data_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "data_sources_key_uidx" ON "data_sources" USING btree ("key");--> statement-breakpoint
CREATE INDEX "data_sources_kind_idx" ON "data_sources" USING btree ("kind");--> statement-breakpoint
CREATE UNIQUE INDEX "company_source_records_source_external_uidx" ON "company_source_records" USING btree ("source_id", "external_id");--> statement-breakpoint
CREATE INDEX "company_source_records_company_id_idx" ON "company_source_records" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_source_records_source_id_idx" ON "company_source_records" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "company_source_records_normalized_domain_idx" ON "company_source_records" USING btree ("normalized_domain");--> statement-breakpoint
CREATE INDEX "jobs_company_id_idx" ON "jobs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jobs_posted_at_idx" ON "jobs" USING btree ("posted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "job_source_records_source_external_uidx" ON "job_source_records" USING btree ("source_id", "external_id");--> statement-breakpoint
CREATE INDEX "job_source_records_job_id_idx" ON "job_source_records" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "ingestion_runs_source_id_idx" ON "ingestion_runs" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "ingestion_runs_status_idx" ON "ingestion_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ingestion_runs_started_at_idx" ON "ingestion_runs" USING btree ("started_at");--> statement-breakpoint
INSERT INTO "data_sources" ("key", "name", "kind", "website_url", "terms_url", "enabled") VALUES
  ('manual', 'Manual curation', 'manual', NULL, NULL, true),
  ('wikidata', 'Wikidata', 'company_discovery', 'https://www.wikidata.org/', 'https://www.wikidata.org/wiki/Wikidata:Licensing', false),
  ('theirstack', 'TheirStack', 'company_and_job_discovery', 'https://theirstack.com/', 'https://theirstack.com/en/terms', false),
  ('crunchbase', 'Crunchbase', 'company_discovery', 'https://www.crunchbase.com/', 'https://about.crunchbase.com/terms-of-service/', false)
ON CONFLICT ("key") DO NOTHING;
