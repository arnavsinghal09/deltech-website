# CI & deployments

## Workflows

| Workflow | Trigger | Does |
|----------|---------|------|
| `check.yml` (CI) | PR + push to `main` | `tsc --noEmit`, `npm run check` (assert scripts), `next build`. The merge gate. |
| `preview.yml` (Preview) | PR | Deploys a Vercel **preview** via the CLI and comments a unique URL on the PR. |
| `deploy.yml` (Deploy) | push to `main` | Deploys **production** via the Vercel CLI. Unchanged. |

`npm run check` globs every `scripts/check-*.ts`, so new assert checks are picked up automatically — no workflow edit needed.

`check:strings` (`check-strings.mjs`) is **not** in the gate yet: it currently fails on 2 pre-existing hardcoded placeholders (`invite-dialog.tsx`, `step-pref2-or-co-delegate.tsx`). Fix those, then append `&& node scripts/check-strings.mjs` to the `check` script to gate it too.

## Why the preview is CLI-based

The Vercel project has an **Ignored Build Step** that cancels Vercel's own git-triggered builds (that's why PRs previously showed "Canceled by Ignored Build Step" and no preview). Production ships via `deploy.yml` instead. CLI `vercel deploy --prebuilt` uploads a runner-built output, so it **bypasses** the Ignored Build Step — the same mechanism `deploy.yml` already relies on. `preview.yml` reuses the existing `VERCEL_TOKEN` secret; no new secrets.

## One-time / occasional setup

- **Deployment Protection must be off** for reviewers to open preview links. Vercel enables **Vercel Authentication** by default, which 302s every preview to `vercel.com/sso-api` — only the account owner can view it. Turn it off at Project → Settings → **Deployment Protection → Vercel Authentication → Disabled** (free on Hobby), or via the API with the project token:

  ```bash
  curl -X PATCH "https://api.vercel.com/v9/projects/<projectId>?teamId=<orgId>" \
    -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
    -d '{"ssoProtection":null}'
  ```

  Deployments made before the change stay protected; redeploy to get an open URL. Note this makes preview URLs **public** — see the risk note below.
- **Preview env vars**: the runtime env vars must be enabled for the **Preview** environment in Vercel, or a preview 500s at runtime. If they were added as "All Environments" (Vercel default) this is already true; otherwise tick **Preview** on each var. Values are the same as Production — **previews share the production database** (accepted; treat preview data as live).
- **`CRON_SECRET`** must be set in the Production env, or the cron routes return 401 (they fail closed).
- **`NEXT_PUBLIC_APP_URL`** on Preview should stay the production URL, so emails a preview sends link to prod, not the ephemeral preview.
- **Branch protection (optional, recommended)**: GitHub → Settings → Branches → protect `main` → require the `check` status + a review before merge.

## Risk note: open previews on the production database

With Vercel Authentication off, a preview URL is reachable by anyone who has it, and this repo is **public** — preview URLs are posted in PR comments. Each preview runs **unreviewed code against the production database**. App auth still gates admin/staff routes, but public flows (e.g. the registration form) will write real rows.

Accepted for now. If it bites, the fix is env-only, no code: point Preview's `DATABASE_URL`/`DIRECT_URL` at a separate database (a second Supabase project) in Vercel's Preview scope.

## Moving to a society-owned Vercel account later

Re-import the repo on the new account, copy the env vars, delete the project on the old account, and update the `VERCEL_TOKEN` secret. These workflow files are account-agnostic and carry over unchanged.
