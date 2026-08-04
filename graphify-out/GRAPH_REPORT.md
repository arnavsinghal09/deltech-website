# Graph Report - .  (2026-08-04)

## Corpus Check
- 323 files · ~121,546 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1391 nodes · 3664 edges · 79 communities (64 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.81)
- Token cost: 132,946 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Delegate Import & Intake Pipeline|Delegate Import & Intake Pipeline]]
- [[_COMMUNITY_Author Auth & Write Flow|Author Auth & Write Flow]]
- [[_COMMUNITY_Project Docs & Tech Stack|Project Docs & Tech Stack]]
- [[_COMMUNITY_Transactional Email Templates|Transactional Email Templates]]
- [[_COMMUNITY_Delegate Registration Form|Delegate Registration Form]]
- [[_COMMUNITY_Admin Operator Console|Admin Operator Console]]
- [[_COMMUNITY_Auth Actions & Quiz Sessions|Auth Actions & Quiz Sessions]]
- [[_COMMUNITY_Event Config & Delegate Edit UI|Event Config & Delegate Edit UI]]
- [[_COMMUNITY_Public Marketing & Blog Pages|Public Marketing & Blog Pages]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Route Loading Skeletons|Route Loading Skeletons]]
- [[_COMMUNITY_Registration Actions & Resend Email Lib|Registration Actions & Resend Email Lib]]
- [[_COMMUNITY_Authorization, Prisma & Blog Moderation|Authorization, Prisma & Blog Moderation]]
- [[_COMMUNITY_Config & Recruitment Server Actions|Config & Recruitment Server Actions]]
- [[_COMMUNITY_Allotment & Razorpay Payments|Allotment & Razorpay Payments]]
- [[_COMMUNITY_Shared UI Primitives (CardTableAvatar)|Shared UI Primitives (Card/Table/Avatar)]]
- [[_COMMUNITY_Checkin Client & Google Sheets Sync|Checkin Client & Google Sheets Sync]]
- [[_COMMUNITY_Status Badges & Token Pages|Status Badges & Token Pages]]
- [[_COMMUNITY_Quiz Participant Experience|Quiz Participant Experience]]
- [[_COMMUNITY_Quiz Visualization Components|Quiz Visualization Components]]
- [[_COMMUNITY_Moderation & Invite Dialogs|Moderation & Invite Dialogs]]
- [[_COMMUNITY_Audit Log & User Admin Actions|Audit Log & User Admin Actions]]
- [[_COMMUNITY_Quiz Builder Header & Theming|Quiz Builder Header & Theming]]
- [[_COMMUNITY_Admin Layout & Navigation Shell|Admin Layout & Navigation Shell]]
- [[_COMMUNITY_shadcn UI Config|shadcn UI Config]]
- [[_COMMUNITY_Quiz Presenter & Leaderboard Screens|Quiz Presenter & Leaderboard Screens]]
- [[_COMMUNITY_App URL Resolution & Payment Providers|App URL Resolution & Payment Providers]]
- [[_COMMUNITY_Quiz Slide Type Definitions|Quiz Slide Type Definitions]]
- [[_COMMUNITY_Allotment Board & Preference Balance|Allotment Board & Preference Balance]]
- [[_COMMUNITY_Quiz Builder Client & Slide Actions|Quiz Builder Client & Slide Actions]]
- [[_COMMUNITY_Delegate Drawer & Logs Client|Delegate Drawer & Logs Client]]
- [[_COMMUNITY_Content Schema & Settings Storage|Content Schema & Settings Storage]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Marketing Landing & 404 Pages|Marketing Landing & 404 Pages]]
- [[_COMMUNITY_Registrations Table Client|Registrations Table Client]]
- [[_COMMUNITY_Vercel Staging Setup Script|Vercel Staging Setup Script]]
- [[_COMMUNITY_Committee Availability & Matrix Boards|Committee Availability & Matrix Boards]]
- [[_COMMUNITY_CICD Workflows & Deployment Docs|CI/CD Workflows & Deployment Docs]]
- [[_COMMUNITY_Admin Dashboard Charts & Setup Checklist|Admin Dashboard Charts & Setup Checklist]]
- [[_COMMUNITY_Blog Moderation & Tiptap Rendering|Blog Moderation & Tiptap Rendering]]
- [[_COMMUNITY_Recruitment Pipeline Kanban|Recruitment Pipeline Kanban]]
- [[_COMMUNITY_package.json Scripts|package.json Scripts]]
- [[_COMMUNITY_Fees Config Tab|Fees Config Tab]]
- [[_COMMUNITY_Dev Dependencies|Dev Dependencies]]
- [[_COMMUNITY_Committee Settings & Matrix Resync|Committee Settings & Matrix Resync]]
- [[_COMMUNITY_App Root Layout & Providers|App Root Layout & Providers]]
- [[_COMMUNITY_Team Page & Motion Animations|Team Page & Motion Animations]]
- [[_COMMUNITY_i18n String Lint Script|i18n String Lint Script]]
- [[_COMMUNITY_Registration Closed Settings|Registration Closed Settings]]
- [[_COMMUNITY_Prisma Staging Seed Script|Prisma Staging Seed Script]]
- [[_COMMUNITY_Database Isolation Verification|Database Isolation Verification]]
- [[_COMMUNITY_Environment Isolation Check|Environment Isolation Check]]
- [[_COMMUNITY_Role Guard Lint Script|Role Guard Lint Script]]
- [[_COMMUNITY_Dashboard Stat Card|Dashboard Stat Card]]
- [[_COMMUNITY_Prisma Seed Script|Prisma Seed Script]]
- [[_COMMUNITY_Registration Source Pie Chart|Registration Source Pie Chart]]
- [[_COMMUNITY_Registration Status Bar Chart|Registration Status Bar Chart]]
- [[_COMMUNITY_Next.js Security Config|Next.js Security Config]]
- [[_COMMUNITY_package.json Metadata|package.json Metadata]]
- [[_COMMUNITY_Repair Prod Env Script|Repair Prod Env Script]]
- [[_COMMUNITY_Sync Staging Integrations Script|Sync Staging Integrations Script]]
- [[_COMMUNITY_App Icon Route|App Icon Route]]
- [[_COMMUNITY_UN Member Countries List|UN Member Countries List]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Staging Crons Runner Script|Staging Crons Runner Script]]
- [[_COMMUNITY_Vercel Cron Config|Vercel Cron Config]]
- [[_COMMUNITY_NextAuth Route Handler|NextAuth Route Handler]]
- [[_COMMUNITY_Static SVG Asset (file)|Static SVG Asset (file)]]
- [[_COMMUNITY_Static SVG Asset (globe)|Static SVG Asset (globe)]]
- [[_COMMUNITY_Static SVG Asset (next)|Static SVG Asset (next)]]
- [[_COMMUNITY_Static SVG Asset (vercel)|Static SVG Asset (vercel)]]
- [[_COMMUNITY_Static SVG Asset (window)|Static SVG Asset (window)]]
- [[_COMMUNITY_Proxy Module Re-export|Proxy Module Re-export]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 141 edges
2. `t()` - 101 edges
3. `requireStaff()` - 89 edges
4. `getContent` - 64 edges
5. `audit()` - 53 edges
6. `Button()` - 46 edges
7. `buttonVariants` - 30 edges
8. `requireAdmin()` - 30 edges
9. `deriveEventState()` - 30 edges
10. `Input()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `AdminBlogPostPage()` --calls--> `NotFound()`  [INFERRED]
  src/app/(admin)/admin/blog/[id]/page.tsx → src/app/not-found.tsx
- `AdminTeamPage()` --calls--> `requireStaff()`  [INFERRED]
  src/app/(admin)/admin/team/page.tsx → src/lib/authz.ts
- `TeamPage()` --calls--> `t()`  [INFERRED]
  src/app/(marketing)/team/page.tsx → src/content/strings.ts
- `QuizParticipantPage()` --calls--> `NotFound()`  [INFERRED]
  src/app/(public)/quiz/[code]/page.tsx → src/app/not-found.tsx
- `CI and Deployments Doc` --references--> `Deploy Production Workflow`  [EXTRACTED]
  docs/CI.md → .github/workflows/deploy-production.yml

## Import Cycles
- 2-file cycle: `src/lib/payments/index.ts -> src/lib/payments/razorpay.ts -> src/lib/payments/index.ts`
- 2-file cycle: `src/lib/payments/index.ts -> src/lib/payments/static-link.ts -> src/lib/payments/index.ts`
- 2-file cycle: `src/lib/payments/index.ts -> src/lib/payments/upi.ts -> src/lib/payments/index.ts`

## Hyperedges (group relationships)
- **GitHub Actions CI/CD Pipeline** — workflows_check, workflows_deploy_test, workflows_deploy_production, workflows_reset_staging, workflows_setup_staging, workflows_staging_cron [EXTRACTED 1.00]
- **Test/Production Database Isolation Safety Net** — docs_ci_database_isolation, workflows_deploy_test_verify_database_isolation, workflows_deploy_test_check_env_isolation, workflows_deploy_test, workflows_reset_staging [EXTRACTED 1.00]
- **Node 20 Runtime Pinned Across CI** — github_dependabot, workflows_check, workflows_deploy_production, workflows_deploy_test, workflows_reset_staging, workflows_setup_staging, workflows_staging_cron [EXTRACTED 1.00]

## Communities (79 total, 15 thin omitted)

### Community 0 - "Delegate Import & Intake Pipeline"
Cohesion: 0.05
Nodes (69): ImportWizard(), Props, STEPS, WizardStep, PartnerSheetsCard(), Props, QuarantinePanel(), Props (+61 more)

### Community 1 - "Author Auth & Write Flow"
Cohesion: 0.05
Nodes (40): setOwnPassword(), AccountPage(), metadata, AUTHOR_ROLES, AuthorLayout(), BubbleToolbar(), Props, ToolBtn() (+32 more)

### Community 2 - "Project Docs & Tech Stack"
Cohesion: 0.07
Nodes (54): Maintainer Guide, Activity Log (/admin/logs), Admin Role, Allotment Floor (/admin/allotment), Audit Writer (src/lib/audit.ts), Authorization Guards (src/lib/authz.ts), Conference Launch Order, Cross-delegation Imports (/admin/import) (+46 more)

### Community 3 - "Transactional Email Templates"
Cohesion: 0.10
Nodes (38): AllotmentEmail(), Props, BlogApprovedEmail(), Props, BlogChangesRequestedEmail(), Props, BlogRejectedEmail(), Props (+30 more)

### Community 4 - "Delegate Registration Form"
Cohesion: 0.10
Nodes (36): Committee, Props, RegistrationForm(), STEP_FIELDS, STEPS, Props, StepAccommodation(), Props (+28 more)

### Community 5 - "Admin Operator Console"
Cohesion: 0.07
Nodes (29): CheckinPage(), VALID_STATUSES, CheckinClient(), CheckinDelegate, InviteDialog(), PageHeader(), SECTIONS, SettingsNav() (+21 more)

### Community 6 - "Auth Actions & Quiz Sessions"
Cohesion: 0.09
Nodes (24): AuthStage(), SignInForm(), ERROR_MESSAGES, createOrGetQuizSession(), isRetryable(), rateLimit(), RateLimitResult, RateLimitRule (+16 more)

### Community 7 - "Event Config & Delegate Edit UI"
Cohesion: 0.09
Nodes (24): Props, TIMER_OPTIONS, TimerField(), DelegateEditForm(), EditFormValues, editSchema, EventControl(), MODES (+16 more)

### Community 8 - "Public Marketing & Blog Pages"
Cohesion: 0.11
Nodes (22): BlogIndexPage(), metadata, metaLine(), PlaceholderCover(), RegistrationClosedPage(), CheckinQR(), Props, ConfirmCheckinButton() (+14 more)

### Community 9 - "Package Dependencies"
Cohesion: 0.05
Nodes (38): dependencies, @auth/prisma-adapter, @base-ui/react, class-variance-authority, clsx, framer-motion, @hookform/resolvers, lucide-react (+30 more)

### Community 11 - "Registration Actions & Resend Email Lib"
Cohesion: 0.15
Nodes (28): AdminOverviewPage(), allotPortfolio(), AllotmentPage(), deriveEventState(), getResend(), loggedSend(), REDIRECT_TO, RESENDABLE_TEMPLATES (+20 more)

### Community 12 - "Authorization, Prisma & Blog Moderation"
Cohesion: 0.11
Nodes (23): checkInDelegate(), CheckInResult, undoCheckIn(), ConferenceSettingsPage(), generatePortfolios(), EventControlPage(), approvePost(), notifyAuthor() (+15 more)

### Community 13 - "Config & Recruitment Server Actions"
Cohesion: 0.15
Nodes (30): addPortfolio(), bulkAddPortfolios(), createCommittee(), createFee(), deleteCommittee(), deleteFee(), deletePortfolio(), EventControlInput (+22 more)

### Community 14 - "Allotment & Razorpay Payments"
Cohesion: 0.13
Nodes (25): holdPortfolio(), isPrismaP2002(), releaseHold(), revokeAllotment(), resendByLogId(), sendPaymentConfirmed(), SheetCellState, syncSheetCell() (+17 more)

### Community 15 - "Shared UI Primitives (Card/Table/Avatar)"
Cohesion: 0.12
Nodes (26): ConfigPanel(), EditorHeader(), Props, SlidePanel(), cn(), Avatar(), AvatarBadge(), AvatarFallback() (+18 more)

### Community 16 - "Checkin Client & Google Sheets Sync"
Cohesion: 0.10
Nodes (18): Filters, PAY_STATUS_LABEL, Props, STATUS_LABEL, STATUS_OPTIONS, STATUS_VARIANT, Props, Source (+10 more)

### Community 17 - "Status Badges & Token Pages"
Cohesion: 0.15
Nodes (13): STATUS_BADGE, PortfolioCard(), STATUS_LABEL, STATUS_VARIANT, PAY_STATUS_LABEL, STATUS_LABEL, STATUS_VARIANT, PAY_STATUS_LABEL (+5 more)

### Community 18 - "Quiz Participant Experience"
Cohesion: 0.11
Nodes (22): QuizParticipantPage(), ContentConfigPanel(), MCQConfigPanel(), OpenTextConfigPanel(), ScaleConfigPanel(), WordCloudConfigPanel(), AppState, ParticipantApp() (+14 more)

### Community 19 - "Quiz Visualization Components"
Cohesion: 0.15
Nodes (20): Props, Props, CountdownRing(), Props, Props, Props, VizOpenText(), Props (+12 more)

### Community 20 - "Moderation & Invite Dialogs"
Cohesion: 0.16
Nodes (17): Role, PostStatus, Props, STATUS_DISPLAY, FormValues, schema, ROLE_VARIANT, UserRow (+9 more)

### Community 21 - "Audit Log & User Admin Actions"
Cohesion: 0.15
Nodes (20): detailedChangeMeta(), jsonSafe(), PlainRecord, readAuditChange(), readSettingsRollback(), SettingsRollbackSpec, refreshAffectedPages(), Result (+12 more)

### Community 22 - "Quiz Builder Header & Theming"
Cohesion: 0.12
Nodes (16): BuilderHeader(), Props, SLIDE_TYPES, TYPE_COLOUR, PRESET_THEMES, DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent() (+8 more)

### Community 23 - "Admin Layout & Navigation Shell"
Cohesion: 0.18
Nodes (14): AdminLayout(), AccountLink(), AdminBreadcrumb(), LABELS, AdminMobileNav(), isNavActive(), NAV_GROUPS, NavGroup (+6 more)

### Community 24 - "shadcn UI Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 25 - "Quiz Presenter & Leaderboard Screens"
Cohesion: 0.14
Nodes (16): COLORS, ConfettiBurst(), Particle, LeaderboardScreen(), Props, LobbyScreen(), Props, Props (+8 more)

### Community 26 - "App URL Resolution & Payment Providers"
Cohesion: 0.17
Nodes (13): absoluteAppUrl(), APP_URL, appUrl(), isLoopback(), resolveAppUrl(), stripTrailingSlash(), getActiveProvider(), PaymentProvider (+5 more)

### Community 27 - "Quiz Slide Type Definitions"
Cohesion: 0.12
Nodes (17): PALETTE, Props, VizMCQ(), ContentConfig, ContentTally, DEFAULT_CONFIGS, DEFAULT_CONTENT_CONFIG, DEFAULT_MCQ_CONFIG (+9 more)

### Community 28 - "Allotment Board & Preference Balance"
Cohesion: 0.18
Nodes (15): AllotDialog(), Props, RankedDelegate, AllotmentBoard(), Fee, Props, SerializedAllotment, SerializedCommittee (+7 more)

### Community 29 - "Quiz Builder Client & Slide Actions"
Cohesion: 0.19
Nodes (15): BuilderClient(), PresenterApp(), addSlide(), deleteSlide(), duplicateSlide(), reorderSlides(), updatePresentationMeta(), updateSlide() (+7 more)

### Community 30 - "Delegate Drawer & Logs Client"
Cohesion: 0.16
Nodes (12): STATUS_VARIANT, actionLabel(), LogsClient(), SerializedAuditLog, Drawer(), DrawerClose(), DrawerContent(), DrawerDescription() (+4 more)

### Community 31 - "Content Schema & Settings Storage"
Cohesion: 0.14
Nodes (10): Footer(), Props, Content, ContentSchema, DEFAULTS, deserializeSettingValue(), getStrings, conference (+2 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 33 - "Marketing Landing & 404 Pages"
Cohesion: 0.16
Nodes (13): AdminNotFound(), NotFound(), ActiveEvent(), Props, QRBlock(), SocietyHero(), DashboardPage(), LandingPage() (+5 more)

### Community 34 - "Registrations Table Client"
Cohesion: 0.12
Nodes (15): DelegateDrawer(), Props, Props, buildExportUrl(), Committee, Filters, Props, RegistrationsClient() (+7 more)

### Community 35 - "Vercel Staging Setup Script"
Cohesion: 0.17
Nodes (17): api(), changed, ensureDomain(), linkedProject(), main(), manual, protectMain(), removeOldProject() (+9 more)

### Community 36 - "Committee Availability & Matrix Boards"
Cohesion: 0.16
Nodes (14): AvailabilityPage(), MatrixHero(), AvailabilityBoard(), CommitteeAvailability, CountBadge(), Props, TYPE_LABEL, LEGEND (+6 more)

### Community 37 - "CI/CD Workflows & Deployment Docs"
Cohesion: 0.20
Nodes (17): CI and Deployments Doc, Test/Production Database Isolation Guarantees, Pull Request Template, CI Workflow (check.yml), npm run check script, Deploy Production Workflow, Deploy Test Workflow, scripts/check-env-isolation.ts (+9 more)

### Community 38 - "Admin Dashboard Charts & Setup Checklist"
Cohesion: 0.18
Nodes (10): SourcePieChart, StatusBarChart, CommitteeFillTable(), Row, FailedEmailsCard(), FailedLog, MaintainerWelcome(), ChecklistItem (+2 more)

### Community 39 - "Blog Moderation & Tiptap Rendering"
Cohesion: 0.21
Nodes (10): ModerationPanel(), AdminBlogPostPage(), STATUS_BADGE, applyMarks(), Mark, renderNode(), SAFE_SCHEMES, safeSrc() (+2 more)

### Community 40 - "Recruitment Pipeline Kanban"
Cohesion: 0.18
Nodes (8): OutcomeDesk(), PipelineApplicant, RecruitmentPipeline(), Round, StageKey, STAGES, VERDICTS, RecruitmentPage()

### Community 41 - "package.json Scripts"
Cohesion: 0.15
Nodes (13): scripts, build, check, check:strings, db:generate, db:migrate, db:seed, db:seed:staging (+5 more)

### Community 42 - "Fees Config Tab"
Cohesion: 0.21
Nodes (9): Props, FeeRow, NewRow, Props, TabFees(), ClientCommittee, ClientFee, ClientPortfolio (+1 more)

### Community 43 - "Dev Dependencies"
Cohesion: 0.18
Nodes (11): devDependencies, dotenv, prisma, tailwindcss, @tailwindcss/postcss, tsx, @types/node, @types/pg (+3 more)

### Community 44 - "Committee Settings & Matrix Resync"
Cohesion: 0.28
Nodes (6): CommitteesSettingsPage(), MatrixVisibilityCard(), ResyncMatrixCard(), TabCommittees(), TabPortfolios(), resyncMatrix()

### Community 45 - "App Root Layout & Providers"
Cohesion: 0.29
Nodes (5): fraunces, geistMono, geistSans, metadata, Providers()

### Community 46 - "Team Page & Motion Animations"
Cohesion: 0.29
Nodes (5): EASE, FadeUp(), StaggerList(), metadata, TeamPage()

### Community 47 - "i18n String Lint Script"
Cohesion: 0.25
Nodes (5): ALLOWED_FILES, ATTR_RE, FLAGGED_ATTRS, SKIP_DIRS, SRC

### Community 48 - "Registration Closed Settings"
Cohesion: 0.38
Nodes (4): ClosedMessageForm(), Props, TabRegistration(), RegistrationSettingsPage()

### Community 49 - "Prisma Staging Seed Script"
Cohesion: 0.33
Nodes (6): addr(), main(), pool, PORTFOLIOS, prisma, TEST_USERS

### Community 50 - "Database Isolation Verification"
Cohesion: 0.29
Nodes (4): productionDirect, productionRuntime, stagingDirect, stagingRuntime

### Community 51 - "Environment Isolation Check"
Cohesion: 0.53
Nodes (5): main(), origin(), projectRef(), pulledPreviewValue(), VercelEnvVar

### Community 52 - "Role Guard Lint Script"
Cohesion: 0.33
Nodes (3): actionFiles, ADMIN_REQUIRED, all

### Community 53 - "Dashboard Stat Card"
Cohesion: 0.50
Nodes (3): CountUpValue(), Props, StatCard()

### Community 54 - "Prisma Seed Script"
Cohesion: 0.40
Nodes (3): adapter, pool, prisma

### Community 57 - "Next.js Security Config"
Cohesion: 0.50
Nodes (3): CSP_REPORT_ONLY, nextConfig, SECURITY_HEADERS

### Community 58 - "package.json Metadata"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 59 - "Repair Prod Env Script"
Cohesion: 0.50
Nodes (3): H, { projectId, orgId }, WANT

### Community 60 - "Sync Staging Integrations Script"
Cohesion: 0.83
Nodes (3): databaseIdentity(), main(), need()

## Ambiguous Edges - Review These
- `One Simple Admin Role Decision` → `Maintainer Role`  [AMBIGUOUS]
  docs/MAINTAINER_GUIDE.md · relation: conceptually_related_to
- `One Simple Admin Role Decision` → `Admin Role & Permission Hierarchy (SPEC)`  [AMBIGUOUS]
  docs/POA.md · relation: conceptually_related_to

## Knowledge Gaps
- **373 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+368 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `One Simple Admin Role Decision` and `Maintainer Role`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `One Simple Admin Role Decision` and `Admin Role & Permission Hierarchy (SPEC)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `cn()` connect `Shared UI Primitives (Card/Table/Avatar)` to `Delegate Import & Intake Pipeline`, `Author Auth & Write Flow`, `Delegate Registration Form`, `Admin Operator Console`, `Auth Actions & Quiz Sessions`, `Event Config & Delegate Edit UI`, `Public Marketing & Blog Pages`, `Route Loading Skeletons`, `Checkin Client & Google Sheets Sync`, `Status Badges & Token Pages`, `Moderation & Invite Dialogs`, `Quiz Builder Header & Theming`, `Admin Layout & Navigation Shell`, `Allotment Board & Preference Balance`, `Quiz Builder Client & Slide Actions`, `Delegate Drawer & Logs Client`, `Marketing Landing & 404 Pages`, `Registrations Table Client`, `Recruitment Pipeline Kanban`, `Fees Config Tab`, `Team Page & Motion Animations`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `t()` connect `Public Marketing & Blog Pages` to `Author Auth & Write Flow`, `Delegate Registration Form`, `Admin Operator Console`, `Auth Actions & Quiz Sessions`, `Event Config & Delegate Edit UI`, `Registration Actions & Resend Email Lib`, `Shared UI Primitives (Card/Table/Avatar)`, `Checkin Client & Google Sheets Sync`, `Status Badges & Token Pages`, `Quiz Participant Experience`, `Quiz Visualization Components`, `Moderation & Invite Dialogs`, `Quiz Builder Header & Theming`, `Admin Layout & Navigation Shell`, `Quiz Presenter & Leaderboard Screens`, `Content Schema & Settings Storage`, `Marketing Landing & 404 Pages`, `Committee Availability & Matrix Boards`, `Admin Dashboard Charts & Setup Checklist`, `Team Page & Motion Animations`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `requireStaff()` connect `Authorization, Prisma & Blog Moderation` to `Delegate Import & Intake Pipeline`, `Author Auth & Write Flow`, `Admin Operator Console`, `Admin Dashboard Charts & Setup Checklist`, `Recruitment Pipeline Kanban`, `Registration Actions & Resend Email Lib`, `Committee Settings & Matrix Resync`, `Config & Recruitment Server Actions`, `Allotment & Razorpay Payments`, `Registration Closed Settings`, `Admin Layout & Navigation Shell`, `Quiz Presenter & Leaderboard Screens`, `Quiz Builder Client & Slide Actions`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `cn()` (e.g. with `PayPage()` and `StatusPage()`) actually correct?**
  _`cn()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `t()` (e.g. with `BlogIndexPage()` and `PlaceholderCover()`) actually correct?**
  _`t()` has 4 INFERRED edges - model-reasoned connections that need verification._