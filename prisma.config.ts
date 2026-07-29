import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // CLI and migrations use the direct connection (no pgBouncer). For staging
  // and production in CI this must be the Supabase SESSION pooler (port 5432
  // on pooler.supabase.com): db.<ref>.supabase.co is IPv6-only and GitHub
  // runners have no IPv6, while port 6543 is the transaction pooler and
  // cannot run DDL.
  //
  // Read through process.env rather than prisma/config's env(), which throws
  // when the variable is absent. `prisma generate` never opens a connection,
  // but it does load this file, so env() made `npm install` fail outright in
  // any environment without a database URL: CI jobs that only build, and a
  // fresh clone before .env exists. Commands that actually need the URL
  // (migrate, db seed) fail clearly on their own if it is empty.
  datasource: { url: process.env.DIRECT_URL ?? "" },
});
