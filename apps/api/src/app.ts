import cors from "@fastify/cors";
import {
  companies,
  companyIndustries,
  companyLocations,
  industries,
  type Database,
} from "@globe-hiring/database";
import { and, asc, eq, sql } from "drizzle-orm";
import Fastify, { type FastifyInstance } from "fastify";

export interface BuildAppOptions {
  logger?: boolean;
  webOrigin?: string;
  database?: Database;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const database = options.database;

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
  app.get<{ Querystring: { limit?: string; offset?: string } }>(
    "/api/companies",
    async (request, reply) => {
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

      try {
        const rows = await database
          .select({
            id: companies.id,
            slug: companies.slug,
            name: companies.name,
            logoUrl: companies.logoUrl,
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
        };
      } catch (error) {
        app.log.error({ err: error }, "Company list query failed");
        return reply.code(500).send({ error: "internal_server_error" });
      }
    },
  );

  return app;
}
