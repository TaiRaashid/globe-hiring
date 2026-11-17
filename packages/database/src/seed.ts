import dotenv from "dotenv";
import { inArray, sql } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./client.js";
import {
  benefits,
  companies,
  companyBenefits,
  companyFounders,
  companyIndustries,
  companyInvestors,
  companyLocations,
  industries,
  investors,
} from "./schema.js";

type PrototypeStartup = {
  id: string;
  name: string;
  logo: string | null;
  about: string;
  industries: string[];
  founded: number;
  work_mode: "Remote" | "Hybrid" | "On-site";
  founders: { name: string; title: string; linkedin: string | null }[];
  funding: { stage: string; total: number; valuation: number | null };
  investors: string[];
  benefits: string[];
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  team_size: string;
  jobs: { url: string | null };
  updated_at: string;
};

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toWorkMode(value: PrototypeStartup["work_mode"]) {
  if (value === "Remote") return "remote" as const;
  if (value === "Hybrid") return "hybrid" as const;
  return "on_site" as const;
}

async function main() {
  const currentDirectory = dirname(fileURLToPath(import.meta.url));
  const apiEnvPath = resolve(currentDirectory, "../../../apps/api/.env");
  dotenv.config({ path: apiEnvPath });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      `DATABASE_URL is missing. Configure it in ${apiEnvPath.replaceAll("\\", "/")}.`,
    );
  }

  const datasetPath = resolve(
    currentDirectory,
    "../../../apps/web/src/data/startups.json",
  );
  const startups = JSON.parse(
    readFileSync(datasetPath, "utf8"),
  ) as PrototypeStartup[];

  const slugCounts = new Map<string, number>();
  for (const startup of startups) {
    const slug = slugify(startup.name);
    slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
  }

  const companyRows = startups.map((startup) => {
    const baseSlug = slugify(startup.name);
    const slug =
      (slugCounts.get(baseSlug) ?? 0) > 1
        ? `${baseSlug}-${startup.id}`
        : baseSlug;

    return {
      id: startup.id,
      slug,
      name: startup.name,
      logoUrl: startup.logo,
      description: startup.about,
      foundedYear: startup.founded,
      workMode: toWorkMode(startup.work_mode),
      teamSizeLabel: startup.team_size,
      fundingStage: startup.funding.stage,
      fundingTotal: startup.funding.total,
      fundingValuation: startup.funding.valuation,
      careersUrl: startup.jobs.url,
      prototypeUpdatedAt: startup.updated_at,
      updatedAt: new Date(),
    };
  });

  const allIndustryNames = [...new Set(startups.flatMap((item) => item.industries))];
  const allInvestorNames = [...new Set(startups.flatMap((item) => item.investors))];
  const allBenefitNames = [...new Set(startups.flatMap((item) => item.benefits))];

  const { db, client } = createDatabase(databaseUrl);

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(companies)
        .values(companyRows)
        .onConflictDoUpdate({
          target: companies.id,
          set: {
            slug: sql`excluded.slug`,
            name: sql`excluded.name`,
            logoUrl: sql`excluded.logo_url`,
            description: sql`excluded.description`,
            foundedYear: sql`excluded.founded_year`,
            workMode: sql`excluded.work_mode`,
            teamSizeLabel: sql`excluded.team_size_label`,
            fundingStage: sql`excluded.funding_stage`,
            fundingTotal: sql`excluded.funding_total`,
            fundingValuation: sql`excluded.funding_valuation`,
            careersUrl: sql`excluded.careers_url`,
            prototypeUpdatedAt: sql`excluded.prototype_updated_at`,
            updatedAt: new Date(),
          },
        });

      await tx
        .insert(industries)
        .values(allIndustryNames.map((name) => ({ name, slug: slugify(name) })))
        .onConflictDoUpdate({
          target: industries.slug,
          set: { name: sql`excluded.name` },
        });

      await tx
        .insert(investors)
        .values(allInvestorNames.map((name) => ({ name, slug: slugify(name) })))
        .onConflictDoUpdate({
          target: investors.slug,
          set: { name: sql`excluded.name` },
        });

      await tx
        .insert(benefits)
        .values(allBenefitNames.map((name) => ({ name, slug: slugify(name) })))
        .onConflictDoUpdate({
          target: benefits.slug,
          set: { name: sql`excluded.name` },
        });

      const companyIds = startups.map((startup) => startup.id);
      const industryRows = await tx.select().from(industries);
      const investorRows = await tx.select().from(investors);
      const benefitRows = await tx.select().from(benefits);

      const industryIdByName = new Map(industryRows.map((item) => [item.name, item.id]));
      const investorIdByName = new Map(investorRows.map((item) => [item.name, item.id]));
      const benefitIdByName = new Map(benefitRows.map((item) => [item.name, item.id]));

      await tx.delete(companyIndustries).where(inArray(companyIndustries.companyId, companyIds));
      await tx.delete(companyFounders).where(inArray(companyFounders.companyId, companyIds));
      await tx.delete(companyInvestors).where(inArray(companyInvestors.companyId, companyIds));
      await tx.delete(companyBenefits).where(inArray(companyBenefits.companyId, companyIds));
      await tx.delete(companyLocations).where(inArray(companyLocations.companyId, companyIds));

      const industryLinks = startups.flatMap((startup) =>
        startup.industries.map((name) => {
          const industryId = industryIdByName.get(name);
          if (!industryId) throw new Error(`Missing seeded industry: ${name}`);
          return { companyId: startup.id, industryId };
        }),
      );

      const founderRows = startups.flatMap((startup) =>
        startup.founders.map((founder, sortOrder) => ({
          companyId: startup.id,
          name: founder.name,
          title: founder.title || null,
          linkedinUrl: founder.linkedin,
          sortOrder,
        })),
      );

      const investorLinks = startups.flatMap((startup) =>
        startup.investors.map((name) => {
          const investorId = investorIdByName.get(name);
          if (!investorId) throw new Error(`Missing seeded investor: ${name}`);
          return { companyId: startup.id, investorId };
        }),
      );

      const benefitLinks = startups.flatMap((startup) =>
        startup.benefits.map((name) => {
          const benefitId = benefitIdByName.get(name);
          if (!benefitId) throw new Error(`Missing seeded benefit: ${name}`);
          return { companyId: startup.id, benefitId };
        }),
      );

      const locationRows = startups.map((startup) => ({
        companyId: startup.id,
        city: startup.location.city,
        country: startup.location.country,
        latitude: startup.location.lat,
        longitude: startup.location.lng,
        isHeadquarters: true,
      }));

      if (industryLinks.length) await tx.insert(companyIndustries).values(industryLinks);
      if (founderRows.length) await tx.insert(companyFounders).values(founderRows);
      if (investorLinks.length) await tx.insert(companyInvestors).values(investorLinks);
      if (benefitLinks.length) await tx.insert(companyBenefits).values(benefitLinks);
      if (locationRows.length) await tx.insert(companyLocations).values(locationRows);
    });

    console.info(
      `Seed complete: ${startups.length} companies imported. Prototype job positions/counts were intentionally not imported.`,
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error("Database seed failed:", error);
  process.exitCode = 1;
});
