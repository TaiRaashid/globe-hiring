import dotenv from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

// pnpm runs this config from packages/database. The local API env file is the
// single source of truth for the app's database connection.
dotenv.config({ path: resolve(process.cwd(), "../../apps/api/.env") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Create apps/api/.env and configure the local database connection.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
});
