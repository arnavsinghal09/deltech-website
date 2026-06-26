# MUN Platform

Conference management platform for Model United Nations events — registrations, delegate management, committee workflows, article publishing, and payments.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | NextAuth v5 (beta) + Resend magic-link |
| ORM | Prisma + PostgreSQL (Supabase) |
| Storage | Supabase Storage |
| Payments | Razorpay (card / UPI) |
| Email | Resend + React Email |
| Rich text | Tiptap |
| Animations | Framer Motion |

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
cp .env.example .env.local
# Fill in all values in .env.local

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. Seed the database
npx prisma db seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## UI text

All user-visible strings live in `src/content/strings.ts`. Never hardcode text literals in components. A `check:strings` script (to be wired up) will enforce this at CI time.

## Design tokens

All design values live in `src/styles/tokens.ts` and are consumed by `tailwind.config.ts`. See `docs/DESIGN_TOKENS.md`.

## Docs

Read `docs/README.md` at the start of every session.
