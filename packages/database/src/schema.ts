import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  date,
  doublePrecision,
  index,
  integer,
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
