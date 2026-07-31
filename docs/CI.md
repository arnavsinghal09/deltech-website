# CI and deployments

## The small-team flow

```text
Pull request → CI → merge to main → automatic Test deploy
                                      ↓
                              inspect Test manually
                                      ↓
                          click Deploy Production
```

There are no pull-request deployments.

| Environment | Vercel scope | Database | URL |
| --- | --- | --- | --- |
| Test | Preview | Neon Test database | `test.deltechmun.in` |
| Production | Production | Supabase Production database | `deltechmun.in` |

Both environments use one Vercel project with separate Preview and Production
variables. `scripts/check-env-isolation.ts` verifies the Vercel scopes.
`scripts/verify-database-isolation.ts` independently verifies the GitHub
database secrets before any Test migration or destructive reset.

## Workflows

| Name | Trigger | Purpose |
| --- | --- | --- |
| **CI** | Pull request or manual | Run the checks and a production build. |
| **Deploy Test** | Push to `main` or manual | Check, migrate Neon, deploy Test, and smoke-test it. |
| **Deploy Production** | Manual | Require current `main` to be live on Test, then build, migrate, deploy, and smoke-test Production. |
| **Reset Test Data** | Manual with confirmation | Recreate Neon and seed complete fake product data. |
| **Set up Test Environment** | Manual | Repair the Vercel Preview variables and stable Test domain. |
| **Run Test Crons** | Daily or manual | Run the protected cron routes against Neon-backed Test. |

Deployments are queued rather than cancelled while a migration may be running.
Vercel uploads use `--archive=tgz`.

## Database isolation

Test application data lives only in Neon. Production application data lives
only in Supabase. A Test deployment or reset fails before touching a database
unless all of these are true:

- both Test URLs point at Neon;
- the Test runtime URL is pooled;
- the Test migration URL is unpooled;
- both Test URLs identify the same Neon database;
- neither Test URL identifies either Production database endpoint.

The Test and Production `AUTH_SECRET` values are also different, so sessions
cannot cross environments.

Integration credentials are deliberately shared as requested: Resend,
Razorpay, Google Forms, public-sheet sync, cron, Supabase Realtime/Storage, and
Groq. Test emails are redirected to `ADMIN_EMAIL` rather than delivered to
fixture recipients.

## Test data

**Reset Test Data** requires the exact confirmation `reset test data`. It
replays migrations and seeds every meaningful product area:

- the requested admin, maintainer, and registerer accounts;
- Event Control and public-site settings;
- committees, fees, available/held/blocked/allotted portfolios;
- delegates covering every application source and status;
- double delegations, allotments, every payment status, check-in, and email history;
- import presets and quarantined rows;
- recruitment applicants covering every pipeline state and interview slots;
- active and archived team members;
- reversible and view-only audit entries;
- posts covering every editorial state;
- a live quiz, slides, responses, and leaderboard data;
- a harmless expired rate-limit fixture.

Authentication accounts, sessions, and verification tokens are not fabricated.
They are runtime security records, not product test data. Sign in to Test as
`arnavsinghal06@gmail.com`; the real authentication flow creates those records.

Production rows are never copied into Test. Only Google Form, public-sheet, and
import mapping configuration is synchronized.

## Daily use

1. Merge a PR.
2. Wait for **Deploy Test** to turn green.
3. Test at <https://test.deltechmun.in>.
4. Run **Deploy Production** from GitHub Actions.

If fixtures become messy, run **Reset Test Data**. Production deployment is
deliberately a separate button, so inspecting Test remains useful without
adding approval environments or release bureaucracy.

## Connection details

- `STAGING_DIRECT_URL`: Neon unpooled endpoint used for migrations.
- `STAGING_DATABASE_URL`: Neon pooled endpoint used by the Test website.
- `PROD_DIRECT_URL`: Supabase session pooler on port 5432 used for migrations.
- `PROD_DATABASE_URL`: Production runtime connection.

`NEXT_PUBLIC_APP_URL` must be `https://test.deltechmun.in` for Preview and
`https://deltechmun.in` for Production.
