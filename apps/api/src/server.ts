import "dotenv/config";
import { createDatabase } from "@globe-hiring/database";
import { buildApp } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "4000", 10);
const host = process.env.HOST ?? "0.0.0.0";
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
const databaseUrl = process.env.DATABASE_URL;

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be a valid TCP port between 1 and 65535.");
}

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Create apps/api/.env from apps/api/.env.example and configure it.",
  );
}

const { db, client } = createDatabase(databaseUrl);
const adminApiToken = process.env.ADMIN_API_TOKEN;

const app = await buildApp({
  webOrigin,
  database: db,
  ...(adminApiToken ? { adminApiToken } : {}),
});

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  await client.end({ timeout: 5 });
  process.exitCode = 1;
}

let isShuttingDown = false;

const shutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  app.log.info({ signal }, "Shutting down API server");

  try {
    await app.close();
  } finally {
    await client.end({ timeout: 5 });
  }
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
