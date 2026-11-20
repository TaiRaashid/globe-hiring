import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const companyWorkModeEnum = pgEnum("company_work_mode", [
  "remote",
  "hybrid",
  "on_site",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "unverified",
  "verified",
  "rejected",
]);

export const jobStatusEnum = pgEnum("job_status", ["draft", "published", "closed"]);
export const ingestionRunStatusEnum = pgEnum("ingestion_run_status", ["running", "succeeded", "failed"]);

const geometryPoint = customType<{ data: string; driverData: string }>({
  dataType: () => "geometry(Point,4326)",
});

export const companies = pgTable(
  "companies",
  {
    // Text IDs preserve the IDs already used by the prototype dataset. New
    // records can use UUID strings without changing the primary-key type.
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    websiteUrl: text("website_url"),
    description: text("description").notNull().default(""),
    foundedYear: integer("founded_year"),
    workMode: companyWorkModeEnum("work_mode"),
    teamSizeLabel: text("team_size_label"),
    fundingStage: text("funding_stage"),
    fundingTotal: bigint("funding_total", { mode: "number" }).notNull().default(0),
    fundingValuation: bigint("funding_valuation", { mode: "number" }),
    careersUrl: text("careers_url"),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("unverified"),
    prototypeUpdatedAt: date("prototype_updated_at", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("companies_slug_uidx").on(table.slug),
    index("companies_name_idx").on(table.name),
    index("companies_work_mode_idx").on(table.workMode),
    index("companies_verification_status_idx").on(table.verificationStatus),
  ],
);

export const companyLocations = pgTable(
  "company_locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    city: text("city").notNull(),
    region: text("region"),
    country: text("country").notNull(),
    countryCode: text("country_code"),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    isHeadquarters: boolean("is_headquarters").notNull().default(false),
    point: geometryPoint("point")
      .notNull()
      .generatedAlwaysAs(
        sql`ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geometry(Point,4326)`,
      ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("company_locations_company_id_idx").on(table.companyId),
    index("company_locations_point_gist_idx").using("gist", table.point),
    uniqueIndex("company_locations_one_headquarters_uidx")
      .on(table.companyId)
      .where(sql`${table.isHeadquarters} = true`),
  ],
);

export const industries = pgTable(
  "industries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (table) => [
    uniqueIndex("industries_name_uidx").on(table.name),
    uniqueIndex("industries_slug_uidx").on(table.slug),
  ],
);

export const companyIndustries = pgTable(
  "company_industries",
  {
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    industryId: uuid("industry_id")
      .notNull()
      .references(() => industries.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.industryId] }),
    index("company_industries_industry_id_idx").on(table.industryId),
  ],
);

export const companyFounders = pgTable(
  "company_founders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    linkedinUrl: text("linkedin_url"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("company_founders_company_id_idx").on(table.companyId)],
);

export const investors = pgTable(
  "investors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (table) => [
    uniqueIndex("investors_name_uidx").on(table.name),
    uniqueIndex("investors_slug_uidx").on(table.slug),
  ],
);

export const companyInvestors = pgTable(
  "company_investors",
  {
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    investorId: uuid("investor_id")
      .notNull()
      .references(() => investors.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.investorId] }),
    index("company_investors_investor_id_idx").on(table.investorId),
  ],
);

export const benefits = pgTable(
  "benefits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (table) => [
    uniqueIndex("benefits_name_uidx").on(table.name),
    uniqueIndex("benefits_slug_uidx").on(table.slug),
  ],
);

export const companyBenefits = pgTable(
  "company_benefits",
  {
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    benefitId: uuid("benefit_id")
      .notNull()
      .references(() => benefits.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.companyId, table.benefitId] }),
    index("company_benefits_benefit_id_idx").on(table.benefitId),
  ],
);


/** Registry of external datasets and manually managed sources. Credentials stay in env vars. */
export const dataSources = pgTable("data_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  websiteUrl: text("website_url"),
  termsUrl: text("terms_url"),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("data_sources_key_uidx").on(table.key), index("data_sources_kind_idx").on(table.kind)]);

export const companySourceRecords = pgTable("company_source_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id").notNull().references(() => dataSources.id, { onDelete: "restrict" }),
  externalId: text("external_id"),
  externalUrl: text("external_url"),
  normalizedDomain: text("normalized_domain"),
  rawData: jsonb("raw_data").$type<Record<string, unknown>>(),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("company_source_records_source_external_uidx").on(table.sourceId, table.externalId),
  index("company_source_records_company_id_idx").on(table.companyId),
  index("company_source_records_source_id_idx").on(table.sourceId),
  index("company_source_records_normalized_domain_idx").on(table.normalizedDomain),
]);

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  locationText: text("location_text"),
  workplaceType: text("workplace_type"),
  employmentType: text("employment_type"),
  salaryMin: bigint("salary_min", { mode: "number" }),
  salaryMax: bigint("salary_max", { mode: "number" }),
  salaryCurrency: text("salary_currency"),
  applyUrl: text("apply_url"),
  sourceUrl: text("source_url"),
  status: jobStatusEnum("status").notNull().default("draft"),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("jobs_company_id_idx").on(table.companyId),
  index("jobs_status_idx").on(table.status),
  index("jobs_posted_at_idx").on(table.postedAt),
]);

export const jobSourceRecords = pgTable("job_source_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id").notNull().references(() => dataSources.id, { onDelete: "restrict" }),
  externalId: text("external_id"),
  externalUrl: text("external_url"),
  rawData: jsonb("raw_data").$type<Record<string, unknown>>(),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("job_source_records_source_external_uidx").on(table.sourceId, table.externalId),
  index("job_source_records_job_id_idx").on(table.jobId),
]);

export const ingestionRuns = pgTable("ingestion_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id").notNull().references(() => dataSources.id, { onDelete: "restrict" }),
  runType: text("run_type").notNull(),
  status: ingestionRunStatusEnum("status").notNull().default("running"),
  recordsFetched: integer("records_fetched").notNull().default(0),
  recordsInserted: integer("records_inserted").notNull().default(0),
  recordsUpdated: integer("records_updated").notNull().default(0),
  recordsSkipped: integer("records_skipped").notNull().default(0),
  creditsUsed: integer("credits_used").notNull().default(0),
  cursorBefore: text("cursor_before"),
  cursorAfter: text("cursor_after"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
}, (table) => [
  index("ingestion_runs_source_id_idx").on(table.sourceId),
  index("ingestion_runs_status_idx").on(table.status),
  index("ingestion_runs_started_at_idx").on(table.startedAt),
]);
