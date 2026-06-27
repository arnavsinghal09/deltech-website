# Graph Report - .  (2026-06-27)

## Corpus Check
- Corpus is ~33,447 words - fits in a single context window. You may not need a graph.

## Summary
- 548 nodes · 1155 edges · 33 communities (22 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin Config Tabs|Admin Config Tabs]]
- [[_COMMUNITY_Admin Layout & Navigation|Admin Layout & Navigation]]
- [[_COMMUNITY_Delegate Drawer UI|Delegate Drawer UI]]
- [[_COMMUNITY_Registration & Delegate Forms|Registration & Delegate Forms]]
- [[_COMMUNITY_UI Component Library|UI Component Library]]
- [[_COMMUNITY_Allotment Server Actions|Allotment Server Actions]]
- [[_COMMUNITY_NPM Dependencies|NPM Dependencies]]
- [[_COMMUNITY_Allotment & Availability Board|Allotment & Availability Board]]
- [[_COMMUNITY_Project Config & Aliases|Project Config & Aliases]]
- [[_COMMUNITY_Design Docs & Data Models|Design Docs & Data Models]]
- [[_COMMUNITY_TypeScript Compiler Config|TypeScript Compiler Config]]
- [[_COMMUNITY_Admin Dashboard Views|Admin Dashboard Views]]
- [[_COMMUNITY_Dev Toolchain|Dev Toolchain]]
- [[_COMMUNITY_Build & DB Scripts|Build & DB Scripts]]
- [[_COMMUNITY_App Root & Providers|App Root & Providers]]
- [[_COMMUNITY_String Audit Script|String Audit Script]]
- [[_COMMUNITY_Database Seed|Database Seed]]
- [[_COMMUNITY_Package Metadata|Package Metadata]]
- [[_COMMUNITY_AI Agent Config|AI Agent Config]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_Auth Route|Auth Route]]
- [[_COMMUNITY_File Icon|File Icon]]
- [[_COMMUNITY_Globe Icon|Globe Icon]]
- [[_COMMUNITY_Vercel Icon|Vercel Icon]]
- [[_COMMUNITY_Window Icon|Window Icon]]
- [[_COMMUNITY_Dev Proxy|Dev Proxy]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 103 edges
2. `t()` - 43 edges
3. `Button()` - 18 edges
4. `DelTech MUN Platform Step-by-Step Build POA (Phase 0–10)` - 17 edges
5. `compilerOptions` - 16 edges
6. `DelTech MUN Platform Build Spec (full living product specification)` - 15 edges
7. `Input()` - 14 edges
8. `RegisterFormValues` - 13 edges
9. `getContent` - 13 edges
10. `requireAdmin()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Wordmark/Logo SVG (black on transparent, 394x80)` --conceptually_related_to--> `Next.js 16 (App Router, TypeScript, Turbopack default, async params, proxy.ts not middleware.ts)`  [INFERRED]
  public/next.svg → README.md
- `DelTech MUN Platform Step-by-Step Build POA (Phase 0–10)` --references--> `NextAuth v5 / Auth.js (magic-link via Resend, Prisma adapter, JWT sessions)`  [EXTRACTED]
  docs/POA.md → README.md
- `DelTech MUN Platform Step-by-Step Build POA (Phase 0–10)` --references--> `Prisma 7 ORM (driver adapter mandatory, ESM-only, prisma.config.ts datasource, prisma-client generator)`  [EXTRACTED]
  docs/POA.md → README.md
- `DelTech MUN Platform Build Spec (full living product specification)` --references--> `Framer Motion (spring-physics animations; quiz bar reveals, count-ups, word-cloud, leaderboard)`  [EXTRACTED]
  docs/SPEC.md → README.md
- `DelTech MUN Platform Build Spec (full living product specification)` --references--> `shadcn/ui Component Library (owned, themeable; mandatory — no raw HTML form controls)`  [EXTRACTED]
  docs/SPEC.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Core Allot-then-Pay Data Flow Models** — docs_poa_delegate_model, docs_poa_allotment_model, docs_poa_portfolio_model, docs_poa_payment_model, docs_poa_committee_model [EXTRACTED 1.00]
- **Three Main Product Modules (Registration, Blog, Quiz)** — docs_spec_registration_portal, docs_spec_blog_module, docs_spec_quiz_module [EXTRACTED 1.00]
- **Supabase Realtime Live Update Features** — docs_spec_availability_board, docs_spec_quiz_module, readme_supabase [INFERRED 0.85]

## Communities (33 total, 11 thin omitted)

### Community 0 - "Admin Config Tabs"
Cohesion: 0.07
Nodes (49): ClientCommittee, ClientFee, ClientPortfolio, Props, Props, TabCommittees(), FormValues, Props (+41 more)

### Community 1 - "Admin Layout & Navigation"
Cohesion: 0.08
Nodes (33): AdminLayout(), RegistrationClosedPage(), AdminSidebar(), NAV, ConfigTabs(), Footer(), Props, Header() (+25 more)

### Community 2 - "Delegate Drawer UI"
Cohesion: 0.06
Nodes (38): DelegateDrawer(), Props, STATUS_VARIANT, DelegateEditForm(), Props, buildExportUrl(), Committee, Filters (+30 more)

### Community 3 - "Registration & Delegate Forms"
Cohesion: 0.10
Nodes (38): EditFormValues, editSchema, Committee, Props, STEP_FIELDS, STEPS, Props, StepAccommodation() (+30 more)

### Community 4 - "UI Component Library"
Cohesion: 0.08
Nodes (34): cn(), CheckEmailPage(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+26 more)

### Community 5 - "Allotment Server Actions"
Cohesion: 0.10
Nodes (29): allotPortfolio(), holdPortfolio(), isPrismaP2002(), releaseHold(), requireAdmin(), revokeAllotment(), AllotDialog(), Props (+21 more)

### Community 6 - "NPM Dependencies"
Cohesion: 0.05
Nodes (38): dependencies, @auth/prisma-adapter, @base-ui/react, class-variance-authority, clsx, framer-motion, @hookform/resolvers, lucide-react (+30 more)

### Community 7 - "Allotment & Availability Board"
Cohesion: 0.07
Nodes (18): AvailabilityPage(), AllotmentBoard(), AvailabilityBoard(), CommitteeAvailability, Props, TYPE_LABEL, { handlers, auth, signIn, signOut }, JWT (+10 more)

### Community 8 - "Project Config & Aliases"
Cohesion: 0.07
Nodes (28): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+20 more)

### Community 9 - "Design Docs & Data Models"
Cohesion: 0.12
Nodes (31): DelTech MUN Platform Step-by-Step Build POA (Phase 0–10), Allot-then-Pay Architecture Decision (registration free; admin allots then payment link generated), Allotment Prisma Model (delegateId unique, committeeId, portfolioId unique, allottedBy, emailSentAt), Committee Prisma Model (name, slug, type, doubleDelegation, portfolios, isActive), Delegate Prisma Model (email, WhatsApp, institution, isDtu, pref1/2, status, allotment, payment), Delegates Are Email-Keyed Design Decision (delegate record identified by email, magic-link optional), Nothing Hardcoded Principle (all copy, fees, committees, dates live in DB via Setting table), Payment Prisma Model (delegateId unique, provider, amountInr, status PayStatus, razorpayOrderId) (+23 more)

### Community 10 - "TypeScript Compiler Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 11 - "Admin Dashboard Views"
Cohesion: 0.15
Nodes (12): AdminOverviewPage(), CommitteeFillTable(), Row, COLORS, DataPoint, SourcePieChart(), Props, StatCard() (+4 more)

### Community 12 - "Dev Toolchain"
Cohesion: 0.15
Nodes (13): devDependencies, dotenv, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss, tsx (+5 more)

### Community 13 - "Build & DB Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, check:strings, db:generate, db:migrate, db:seed, dev, lint (+1 more)

### Community 14 - "App Root & Providers"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 15 - "String Audit Script"
Cohesion: 0.29
Nodes (5): ALLOWED_FILES, ATTR_RE, FLAGGED_ATTRS, SKIP_DIRS, SRC

### Community 16 - "Database Seed"
Cohesion: 0.40
Nodes (3): adapter, pool, prisma

### Community 17 - "Package Metadata"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **186 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+181 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Component Library` to `Admin Config Tabs`, `Admin Layout & Navigation`, `Delegate Drawer UI`, `Registration & Delegate Forms`, `Allotment Server Actions`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Why does `t()` connect `Admin Layout & Navigation` to `Delegate Drawer UI`, `Registration & Delegate Forms`, `UI Component Library`, `Allotment & Availability Board`, `Admin Dashboard Views`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `Button()` connect `Allotment Server Actions` to `Admin Config Tabs`, `Admin Layout & Navigation`, `Delegate Drawer UI`, `Registration & Delegate Forms`, `UI Component Library`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _187 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Config Tabs` be split into smaller, more focused modules?**
  _Cohesion score 0.0672316384180791 - nodes in this community are weakly interconnected._
- **Should `Admin Layout & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.08106473079249849 - nodes in this community are weakly interconnected._
- **Should `Delegate Drawer UI` be split into smaller, more focused modules?**
  _Cohesion score 0.059506531204644414 - nodes in this community are weakly interconnected._