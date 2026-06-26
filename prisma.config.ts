import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // CLI and migrations use the direct connection (no pgBouncer)
  datasource: { url: env("DIRECT_URL") },
});
