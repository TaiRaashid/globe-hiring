CREATE TYPE "public"."company_work_mode" AS ENUM('remote', 'hybrid', 'on_site');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('unverified', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"description" text DEFAULT '' NOT NULL,
	"founded_year" integer,
	"work_mode" "company_work_mode",
	"team_size_label" text,
	"funding_stage" text,
	"funding_total" bigint DEFAULT 0 NOT NULL,
	"funding_valuation" bigint,
	"careers_url" text,
	"verification_status" "verification_status" DEFAULT 'unverified' NOT NULL,
	"prototype_updated_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_benefits" (
	"company_id" text NOT NULL,
	"benefit_id" uuid NOT NULL,
	CONSTRAINT "company_benefits_company_id_benefit_id_pk" PRIMARY KEY("company_id","benefit_id")
);
--> statement-breakpoint
CREATE TABLE "company_founders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"linkedin_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_industries" (
	"company_id" text NOT NULL,
	"industry_id" uuid NOT NULL,
	CONSTRAINT "company_industries_company_id_industry_id_pk" PRIMARY KEY("company_id","industry_id")
);
--> statement-breakpoint
CREATE TABLE "company_investors" (
	"company_id" text NOT NULL,
	"investor_id" uuid NOT NULL,
	CONSTRAINT "company_investors_company_id_investor_id_pk" PRIMARY KEY("company_id","investor_id")
);
--> statement-breakpoint
CREATE TABLE "company_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"city" text NOT NULL,
	"region" text,
	"country" text NOT NULL,
	"country_code" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"is_headquarters" boolean DEFAULT false NOT NULL,
	"point" geometry(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geometry(Point,4326)) STORED NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_benefits" ADD CONSTRAINT "company_benefits_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_benefits" ADD CONSTRAINT "company_benefits_benefit_id_benefits_id_fk" FOREIGN KEY ("benefit_id") REFERENCES "public"."benefits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_founders" ADD CONSTRAINT "company_founders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_industries" ADD CONSTRAINT "company_industries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_industries" ADD CONSTRAINT "company_industries_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_investors" ADD CONSTRAINT "company_investors_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_investors" ADD CONSTRAINT "company_investors_investor_id_investors_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_locations" ADD CONSTRAINT "company_locations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "benefits_name_uidx" ON "benefits" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "benefits_slug_uidx" ON "benefits" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_slug_uidx" ON "companies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "companies_name_idx" ON "companies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "companies_work_mode_idx" ON "companies" USING btree ("work_mode");--> statement-breakpoint
CREATE INDEX "companies_verification_status_idx" ON "companies" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "company_benefits_benefit_id_idx" ON "company_benefits" USING btree ("benefit_id");--> statement-breakpoint
CREATE INDEX "company_founders_company_id_idx" ON "company_founders" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_industries_industry_id_idx" ON "company_industries" USING btree ("industry_id");--> statement-breakpoint
CREATE INDEX "company_investors_investor_id_idx" ON "company_investors" USING btree ("investor_id");--> statement-breakpoint
CREATE INDEX "company_locations_company_id_idx" ON "company_locations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_locations_point_gist_idx" ON "company_locations" USING gist ("point");--> statement-breakpoint
CREATE UNIQUE INDEX "company_locations_one_headquarters_uidx" ON "company_locations" USING btree ("company_id") WHERE "company_locations"."is_headquarters" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "industries_name_uidx" ON "industries" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "industries_slug_uidx" ON "industries" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "investors_name_uidx" ON "investors" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "investors_slug_uidx" ON "investors" USING btree ("slug");