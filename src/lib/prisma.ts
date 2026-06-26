// TODO: configure PrismaClient with Prisma v7 adapter pattern (see prisma.config.ts)
// Run `npx prisma generate` after configuring the adapter to make types available.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClient = any

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Stub — replace with real client once prisma generate has run
export const prisma: PrismaClient = globalThis.prisma ?? null

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma
