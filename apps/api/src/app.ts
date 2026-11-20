import cors from "@fastify/cors";
import { timingSafeEqual } from "node:crypto";
import {
  companies,
  dataSources,
  jobSourceRecords,
  jobs,
  companyIndustries,
  companyLocations,
  industries,
  type Database,
} from "@globe-hiring/database";
import { and, asc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import Fastify, { type FastifyInstance } from "fastify";

export interface BuildAppOptions {
  logger?: boolean;
  webOrigin?: string;
  database?: Database;
  adminApiToken?: string;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const database = options.database;
  const adminApiToken = options.adminApiToken;

  const app = Fastify({
    logger: options.logger ?? true,
    trustProxy: false,
  });

  await app.register(cors, {
    origin: options.webOrigin ?? "http://localhost:5173",
    credentials: false,
  });

  // Liveness: confirms that the HTTP process is running.
  app.get("/health", async () => ({
    status: "ok",
    service: "globe-hiring-api",
    timestamp: new Date().toISOString(),
  }));

  // Readiness: confirms that the API can reach its database.
  app.get("/health/ready", async (_request, reply) => {
    if (!database) {
      return reply.code(503).send({
        status: "not_ready",
        database: "not_configured",
      });
    }

    try {
      await database.execute(sql`select 1`);
      return {
        status: "ok",
        database: "connected",
      };
    } catch (error) {
      app.log.error({ err: error }, "Database readiness check failed");
      return reply.code(503).send({
        status: "not_ready",
        database: "unavailable",
      });
    }
  });

  // Public company discovery only. Job records/details are intentionally not
  // returned by this endpoint.
  app.get<{
    Querystring: {
      limit?: string;
      offset?: string;
      q?: string;
      industry?: string;
      workMode?: string;
      country?: string;
      city?: string;
    };
  }>("/api/companies", async (request, reply) => {
    if (!database) {
      return reply.code(503).send({ error: "database_unavailable" });
    }

    const requestedLimit = Number(request.query.limit ?? 50);
    const requestedOffset = Number(request.query.offset ?? 0);

    if (
      !Number.isInteger(requestedLimit) ||
      requestedLimit < 1 ||
      requestedLimit > 100 ||
      !Number.isInteger(requestedOffset) ||
      requestedOffset < 0
    ) {
      return reply.code(400).send({
        error: "invalid_pagination",
        message: "limit must be 1–100 and offset must be a non-negative integer.",
      });
    }

    const parseCsv = (value: string | undefined): string[] =>
      value
        ? [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))]
        : [];
    const escapeLike = (value: string): string =>
      value.replace(/[\\%_]/g, "\\$&");

    const search = request.query.q?.trim();
    const selectedIndustries = parseCsv(request.query.industry);
    const selectedWorkModes = parseCsv(request.query.workMode);
    const country = request.query.country?.trim();
    const city = request.query.city?.trim();
    const validWorkModes = ["remote", "hybrid", "on_site"] as const;

    if (search && search.length > 120) {
      return reply.code(400).send({ error: "search_query_too_long" });
    }
    if (selectedIndustries.length > 10 || selectedWorkModes.length > 3) {
      return reply.code(400).send({ error: "too_many_filters" });
    }
    if (selectedWorkModes.some((mode) => !validWorkModes.includes(mode as (typeof validWorkModes)[number]))) {
      return reply.code(400).send({ error: "invalid_work_mode" });
    }
    if ((country && country.length > 100) || (city && city.length > 100)) {
      return reply.code(400).send({ error: "invalid_location_filter" });
    }

    const conditions = [];

    if (search) {
      const pattern = `%${escapeLike(search)}%`;
      const industryMatches = database
        .select({ companyId: companyIndustries.companyId })
        .from(companyIndustries)
        .innerJoin(industries, eq(industries.id, companyIndustries.industryId))
        .where(ilike(industries.name, pattern));
      const locationMatches = database
        .select({ companyId: companyLocations.companyId })
        .from(companyLocations)
        .where(
          or(
            ilike(companyLocations.city, pattern),
            ilike(companyLocations.region, pattern),
            ilike(companyLocations.country, pattern),
          ),
        );

      conditions.push(
        or(
          ilike(companies.name, pattern),
          ilike(companies.description, pattern),
          inArray(companies.id, industryMatches),
          inArray(companies.id, locationMatches),
        ),
      );
    }

    if (selectedIndustries.length > 0) {
      const industryMatches = database
        .select({ companyId: companyIndustries.companyId })
        .from(companyIndustries)
        .innerJoin(industries, eq(industries.id, companyIndustries.industryId))
        .where(inArray(industries.name, selectedIndustries));
      conditions.push(inArray(companies.id, industryMatches));
    }

    if (selectedWorkModes.length > 0) {
      conditions.push(
        inArray(
          companies.workMode,
          selectedWorkModes as (typeof validWorkModes)[number][],
        ),
      );
    }

    if (country || city) {
      const locationConditions = [eq(companyLocations.isHeadquarters, true)];
      if (country) locationConditions.push(ilike(companyLocations.country, `%${escapeLike(country)}%`));
      if (city) locationConditions.push(ilike(companyLocations.city, `%${escapeLike(city)}%`));
      const locationMatches = database
        .select({ companyId: companyLocations.companyId })
        .from(companyLocations)
        .where(and(...locationConditions));
      conditions.push(inArray(companies.id, locationMatches));
    }

    try {
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await database
        .select({
          id: companies.id,
          slug: companies.slug,
          name: companies.name,
          logoUrl: companies.logoUrl,
          websiteUrl: companies.websiteUrl,
          description: companies.description,
          foundedYear: companies.foundedYear,
          workMode: companies.workMode,
          teamSizeLabel: companies.teamSizeLabel,
          fundingStage: companies.fundingStage,
          fundingTotal: companies.fundingTotal,
          verificationStatus: companies.verificationStatus,
          location: sql<{
            city: string;
            region: string | null;
            country: string;
            latitude: number;
            longitude: number;
          } | null>`
            CASE
              WHEN ${companyLocations.id} IS NULL THEN NULL
              ELSE jsonb_build_object(
                'city', ${companyLocations.city},
                'region', ${companyLocations.region},
                'country', ${companyLocations.country},
                'latitude', ${companyLocations.latitude},
                'longitude', ${companyLocations.longitude}
              )
            END
          `,
          industries: sql<string[]>`
            COALESCE(
              array_agg(DISTINCT ${industries.name})
                FILTER (WHERE ${industries.id} IS NOT NULL),
              ARRAY[]::text[]
            )
          `,
        })
        .from(companies)
        .leftJoin(
          companyLocations,
          and(
            eq(companyLocations.companyId, companies.id),
            eq(companyLocations.isHeadquarters, true),
          ),
        )
        .leftJoin(companyIndustries, eq(companyIndustries.companyId, companies.id))
        .leftJoin(industries, eq(industries.id, companyIndustries.industryId))
        .where(whereClause)
        .groupBy(companies.id, companyLocations.id)
        .orderBy(asc(companies.name))
        .limit(requestedLimit + 1)
        .offset(requestedOffset);

      const hasMore = rows.length > requestedLimit;

      return {
        data: rows.slice(0, requestedLimit),
        pagination: {
          limit: requestedLimit,
          offset: requestedOffset,
          hasMore,
        },
        filters: {
          q: search ?? null,
          industries: selectedIndustries,
          workModes: selectedWorkModes,
          country: country ?? null,
          city: city ?? null,
        },
      };
    } catch (error) {
      app.log.error({ err: error }, "Company list query failed");
      return reply.code(500).send({ error: "internal_server_error" });
    }
  });


  // Manual job-management endpoints are deliberately separate from public
  // discovery. They remain disabled until a strong ADMIN_API_TOKEN is set.
  const isAdminTokenValid = (supplied: unknown): boolean => {
    if (!adminApiToken || typeof supplied !== "string") return false;
    const expectedBuffer = Buffer.from(adminApiToken);
    const suppliedBuffer = Buffer.from(supplied);
    return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
  };

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
  const validOptionalUrl = (value: unknown): value is string | null | undefined => {
    if (value === undefined || value === null || value === "") return true;
    if (typeof value !== "string") return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch { return false; }
  };

  app.get<{ Querystring: { limit?: string; offset?: string } }>("/api/admin/jobs", async (request, reply) => {
    if (!adminApiToken) return reply.code(503).send({ error: "admin_api_not_configured" });
    if (!isAdminTokenValid(request.headers["x-admin-token"])) return reply.code(401).send({ error: "unauthorized" });
    if (!database) return reply.code(503).send({ error: "database_unavailable" });
    const limit = Number(request.query.limit ?? 50);
    const offset = Number(request.query.offset ?? 0);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
      return reply.code(400).send({ error: "invalid_pagination" });
    }
    const rows = await database.select().from(jobs).orderBy(asc(jobs.createdAt)).limit(limit).offset(offset);
    return { data: rows, pagination: { limit, offset } };
  });

  app.post("/api/admin/jobs", async (request, reply) => {
    if (!adminApiToken) return reply.code(503).send({ error: "admin_api_not_configured" });
    if (!isAdminTokenValid(request.headers["x-admin-token"])) return reply.code(401).send({ error: "unauthorized" });
    if (!database) return reply.code(503).send({ error: "database_unavailable" });
    const body = request.body;
    if (!isRecord(body) || typeof body.companyId !== "string" || !body.companyId.trim() ||
      typeof body.title !== "string" || !body.title.trim() || body.title.length > 250 ||
      (body.description !== undefined && typeof body.description !== "string") ||
      !validOptionalUrl(body.applyUrl) || !validOptionalUrl(body.sourceUrl)) {
      return reply.code(400).send({ error: "invalid_job_payload" });
    }
    if (body.status !== undefined && !["draft", "published", "closed"].includes(String(body.status))) {
      return reply.code(400).send({ error: "invalid_job_status" });
    }
    for (const key of ["salaryMin", "salaryMax"] as const) {
      const value = body[key];
      if (value !== undefined && value !== null && (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)) {
        return reply.code(400).send({ error: "invalid_salary" });
      }
    }
    const [company] = await database.select({ id: companies.id }).from(companies).where(eq(companies.id, body.companyId)).limit(1);
    if (!company) return reply.code(404).send({ error: "company_not_found" });
    const now = new Date();
    const postedAt = body.postedAt ? new Date(String(body.postedAt)) : null;
    if (postedAt && Number.isNaN(postedAt.getTime())) return reply.code(400).send({ error: "invalid_posted_at" });
    if (typeof body.salaryMin === "number" && typeof body.salaryMax === "number" && body.salaryMin > body.salaryMax) {
      return reply.code(400).send({ error: "salary_min_exceeds_max" });
    }
    const created = await database.transaction(async (tx) => {
      const [job] = await tx.insert(jobs).values({
        companyId: body.companyId as string,
        title: (body.title as string).trim(),
        description: typeof body.description === "string" ? body.description : "",
        locationText: typeof body.locationText === "string" ? body.locationText : null,
        workplaceType: typeof body.workplaceType === "string" ? body.workplaceType : null,
        employmentType: typeof body.employmentType === "string" ? body.employmentType : null,
        salaryMin: typeof body.salaryMin === "number" ? body.salaryMin : null,
        salaryMax: typeof body.salaryMax === "number" ? body.salaryMax : null,
        salaryCurrency: typeof body.salaryCurrency === "string" ? body.salaryCurrency.toUpperCase() : null,
        applyUrl: typeof body.applyUrl === "string" && body.applyUrl ? body.applyUrl : null,
        sourceUrl: typeof body.sourceUrl === "string" && body.sourceUrl ? body.sourceUrl : null,
        status: body.status === "published" || body.status === "closed" ? body.status : "draft",
        postedAt,
        lastVerifiedAt: body.status === "published" ? now : null,
        updatedAt: now,
      }).returning();
      const [manualSource] = await tx.select({ id: dataSources.id }).from(dataSources).where(eq(dataSources.key, "manual")).limit(1);
      if (!manualSource) {
        throw new Error("Manual data source is not configured");
      }

      if (!job) {
        throw new Error("Job creation failed");
      }

      await tx.insert(jobSourceRecords).values({
        jobId: job.id,
        sourceId: manualSource.id,
        externalUrl:
          typeof body.sourceUrl === "string" && body.sourceUrl
            ? body.sourceUrl
            : null,
      });
      return job;
    });
    return reply.code(201).send({ data: created });
  });

  app.patch<{ Params: { id: string } }>("/api/admin/jobs/:id", async (request, reply) => {
    if (!adminApiToken) return reply.code(503).send({ error: "admin_api_not_configured" });
    if (!isAdminTokenValid(request.headers["x-admin-token"])) return reply.code(401).send({ error: "unauthorized" });
    if (!database) return reply.code(503).send({ error: "database_unavailable" });
    const body = request.body;
    if (!isRecord(body) || Object.keys(body).length === 0) return reply.code(400).send({ error: "invalid_job_payload" });
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 250) return reply.code(400).send({ error: "invalid_title" });
      updates.title = body.title.trim();
    }
    for (const key of ["description", "locationText", "workplaceType", "employmentType", "salaryCurrency"] as const) {
      if (body[key] !== undefined) {
        if (body[key] !== null && typeof body[key] !== "string") return reply.code(400).send({ error: `invalid_${key}` });
        updates[key] = typeof body[key] === "string" ? body[key] : null;
      }
    }
    for (const key of ["salaryMin", "salaryMax"] as const) {
      if (body[key] !== undefined) {
        if (body[key] !== null && (typeof body[key] !== "number" || !Number.isSafeInteger(body[key]) || body[key] < 0)) return reply.code(400).send({ error: "invalid_salary" });
        updates[key] = typeof body[key] === "number" ? body[key] : null;
      }
    }
    const [existingJob] = await database
      .select({
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
      })
      .from(jobs)
      .where(eq(jobs.id, request.params.id))
      .limit(1);

    if (!existingJob) {
      return reply.code(404).send({ error: "job_not_found" });
    }

    const finalSalaryMin =
      updates.salaryMin !== undefined
        ? (updates.salaryMin as number | null)
        : existingJob.salaryMin;

    const finalSalaryMax =
      updates.salaryMax !== undefined
        ? (updates.salaryMax as number | null)
        : existingJob.salaryMax;

    if (
      finalSalaryMin !== null &&
      finalSalaryMax !== null &&
      finalSalaryMin > finalSalaryMax
    ) {
      return reply.code(400).send({ error: "salary_min_exceeds_max" });
    }
    for (const key of ["applyUrl", "sourceUrl"] as const) {
      if (body[key] !== undefined) {
        if (!validOptionalUrl(body[key])) return reply.code(400).send({ error: `invalid_${key}` });
        updates[key] = typeof body[key] === "string" && body[key] ? body[key] : null;
      }
    }
    if (body.status !== undefined) {
      if (!["draft", "published", "closed"].includes(String(body.status))) return reply.code(400).send({ error: "invalid_job_status" });
      updates.status = body.status as "draft" | "published" | "closed";
      if (body.status === "published") updates.lastVerifiedAt = new Date();
    }
    if (body.postedAt !== undefined) {
      const parsed = body.postedAt === null ? null : new Date(String(body.postedAt));
      if (parsed && Number.isNaN(parsed.getTime())) return reply.code(400).send({ error: "invalid_posted_at" });
      updates.postedAt = parsed;
    }
    const [updated] = await database.update(jobs).set(updates as Partial<typeof jobs.$inferInsert>).where(eq(jobs.id, request.params.id)).returning();
    if (!updated) return reply.code(404).send({ error: "job_not_found" });
    return { data: updated };
  });

  return app;
}
