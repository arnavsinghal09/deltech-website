# MUN Platform — Docs

This folder is the canonical source of project documentation. **Read this folder before starting any session.**

## Contents

| File | Purpose |
|------|---------|
| `README.md` | This file — orientation and doc index |
| `DESIGN_TOKENS.md` | How design tokens are used |
| `SPEC.md` | _(coming next)_ Full product specification |
| `POA.md` | _(coming next)_ Plan of action / sprint roadmap |

## Quick orientation

- All UI text lives in `src/content/strings.ts` — never hardcode literals in components.
- All design values (colors, spacing, typography, radius, shadows, motion) live in `src/styles/tokens.ts` and are consumed by `tailwind.config.ts`. No hardcoded values elsewhere.
- Auth is NextAuth v5 (beta) with the Prisma adapter and Resend email provider.
- Payments use Razorpay (card/netbanking/UPI) with a webhook handler at `/api/webhooks/razorpay`.
- Storage is Supabase (files) + Postgres via Prisma (relational data).
