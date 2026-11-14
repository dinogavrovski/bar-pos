# Bar POS — Roadmap & Progress

## Current status

- **Phase:** 1 — Domain & data model (Phase 0 done)
- **Last done:** Monorepo scaffold, architecture sketch, CLAUDE.md moved to repo root, ESLint + Prettier + husky/lint-staged pre-commit hook, Postgres 18 in docker-compose + first Drizzle migration (`venues`), `/api/health/live` + `/api/health/ready` and a server-rendered status page, multi-stage Dockerfiles (api 289 MB, web 356 MB) runnable with `pnpm stack:up`, GitHub Actions CI (checks + Postgres-backed tests + image builds), branch protection on `main`
- **Next task:** Paper design, continued: modifiers, then money (check, payment), then shifts. Round 1 (venue, users, items, tabs, tab_items) is drafted.
- **Blockers:** none

---

## Phase 0 — Foundation & CI

_Goal: an empty app that is already tested, containerized and checked by CI on every PR._

- [x] Architecture sketch (add it to `docs/architecture.md`)
- [x] Monorepo: `apps/web`, `apps/api`, `packages/shared`; TypeScript strict everywhere
- [x] ESLint + Prettier + a pre-commit hook
- [x] Postgres in docker-compose for local dev; first Drizzle migration
- [x] `/health` endpoint on the API; web page that shows API status
- [x] Dockerfiles (multi-stage) for web and api
- [x] GitHub Actions CI: install → lint → typecheck → test → build images
- [x] Branch protection on `main`: PR required, CI must pass

**Questions to answer yourself:** Why do multi-stage builds give smaller images? What do CI caching keys depend on? Where do secrets live, and why never in the repo?

**Done when:** a PR can only merge into `main` with green CI, and `pnpm stack:up` runs the production images locally.

## Phase 1 — Domain & data model

_Goal: the hardest design problem, solved on paper first, then in code with tests._

- [ ] Paper design: venue, users, items (menu), tabs, tab_items (ordered items), modifiers, check, payment, shift
- [ ] Drizzle schema + migrations + seed script (a realistic bar menu)
- [ ] Shared Zod schemas in `packages/shared`
- [ ] Pure domain functions: split evenly, by person, by item; move item between tabs; merge tabs
- [ ] Unit tests for every split and rounding edge case

**Questions:** Splitting 1000 den three ways, where does the leftover denar go? Is a check derived from orders or stored separately? What happens to a split check when an item is voided?

**Done when:** you can explain the schema on a whiteboard and the domain tests cover the split edge cases.

## Phase 2 — Order terminal app

_How bars here work: the waiter takes the order at the table, then enters it on a shared terminal at the bar._

- [ ] Tab list: each user sees their open tabs
- [ ] Open a tab (name, number of people), search items by name, assign items to a person, add modifiers and notes
- [ ] Send the order: prints a ticket with only the not-yet-sent items
- [ ] TanStack Query with optimistic updates and rollback on error
- [ ] Touch-first layout for a counter terminal, big touch targets

**Questions:** Which state belongs on the server and which only in the UI? What does an optimistic update do when the server rejects it?

## Phase 3 — Ticket printing & real-time

_No bar or kitchen display screens: the bartender gets a printed ticket as a backup to the spoken order._

- [ ] Print queue: "send order" creates print jobs, one per printer (bar / kitchen, by category); simulated printer screens for the portfolio version
- [ ] WebSocket push of print jobs to the printer station (instead of the printer polling)
- [ ] Several terminals in one venue stay in sync (tabs and items update live)
- [ ] Reconnect logic: resync missed events after a dropped connection
- [ ] Concurrency: two users editing the same tab

**Questions:** Why WebSockets instead of polling here? What's the source of truth, the event or the database? Optimistic locking vs last-write-wins, which fits a POS? What if the printer is offline when an order is sent?

## Phase 4 — Auth & roles

- [ ] Staff PIN login with a session per device
- [ ] Roles: admin (managers/owners) and normal (waiters/bartenders)
- [ ] API-side authorization (e.g. only a manager can void or give discounts)
- [ ] Audit log for voids, discounts and refunds
- [ ] Rate limiting on PIN attempts

**Questions:** Cookies vs tokens for a shared tablet? Why is hiding a button not security?

## Phase 5 — Payments & closing checks

- [ ] Partial payments, mixed cash and card, tips
- [ ] Simulated card flow or Stripe test mode
- [ ] Close a check, reopen it (manager only), receipt view
- [ ] Integration tests for the full payment flow

**Questions:** Why integer cents? How do you make "pay" idempotent so a double tap doesn't charge twice?

## Phase 6 — Manager dashboard

- [ ] Shift open/close with cash count
- [ ] Reports: sales by hour, top items, sales per waiter, tips
- [ ] Charts (Recharts) and data tables (TanStack Table)
- [ ] Efficient SQL aggregations and indexes for the reports

**Questions:** Compute reports on the fly or pre-aggregate? Which indexes do your report queries need? (Use `EXPLAIN ANALYZE`.)

## Phase 7 — Deploy & production hardening

_Goal: the finished app live on a real server, deployed automatically. Do this when getting ready to apply for jobs/internships._

- [ ] Provision the VPS: SSH keys, firewall, Docker, Caddy with HTTPS on a domain
- [ ] CD: on merge to `main`, build, push images to a registry, deploy to the VPS (decide how migrations run)
- [ ] Sentry wired up in web and api
- [ ] Playwright E2E: open tab → order → print ticket → split → pay → report, run in CI
- [ ] Automated nightly DB backups, plus one practiced restore
- [ ] Load-test the WebSocket server (e.g. k6)
- [ ] Structured logs and a basic uptime check
- [ ] Seeded public demo with "Log in as waiter / admin" buttons; demo data resets nightly

**Questions:** How do you roll back a bad deploy? Where do production secrets live?

**Done when:** merging to `main` updates the live site with zero manual steps.

## Phase 8 — Polish & presentation

- [ ] README: screenshots, architecture diagram, how to run locally, decisions section
- [ ] 2-minute demo video
- [ ] CI badge, clean issues/PR history
- [ ] Stretch: offline mode (PWA that queues orders and syncs later)
- [ ] Stretch: Macedonian/English language switch

---

## Decisions

_One line each: date, decision, why._

- 2026-11-05: Separate Fastify API instead of Next.js API routes, to learn backend properly and to host the WebSocket server.
- 2026-11-05: Self-hosted VPS instead of Vercel, to learn real deployment.
- 2026-11-13: Integer identity IDs (not uuid): readable, small; access control belongs on the API, not in unguessable IDs.
- 2026-11-13: All timestamps `timestamptz`: store the exact moment, convert to Europe/Skopje only for display (DST-safe reports).
- 2026-11-13: Drizzle `casing: 'snake_case'`: camelCase in TS, snake_case in SQL.
- 2026-11-13: All API routes under `/api` prefix, so Caddy can route `/api/*` without rewriting paths.
- 2026-11-13: Status page is a server component (no client JS); TanStack Query waits for Phase 2.
- 2026-11-13: API bundled with tsup for production, so the raw-TS `packages/shared` gets compiled in; plain Node can't run .ts.
- 2026-11-13: Web uses Next `output: 'standalone'`: the image ships only server.js + traced deps.
- 2026-11-13: Containers run as the non-root `node` user; Docker healthchecks use liveness, not readiness.
- 2026-11-13: CI runs tests against a real Postgres service container and applies all migrations to a fresh DB, instead of mocking the database.
- 2026-11-13: Vitest; API split into `buildApp()` (testable with `app.inject`) and `index.ts` (starts the server).
- 2026-11-13: Deploy (VPS, CD, Sentry) moved to Phase 7, near job applications, so I don't pay for a server for months. CI building and `pnpm stack:up` running the production images keep the deploy risk low until then.
- 2026-11-14: Tab model instead of physical tables and areas: a tab is one group of guests from open to paid. Areas skipped, since bars here don't split service by area.
- 2026-11-14: One `items` table (the menu) with a `category`, instead of separate kitchen and bar item tables.
- 2026-11-14: Ordered items live in `tab_items`, one row per unit, with a price snapshot so later menu changes never alter old bills.
- 2026-11-14: A person is just a number on `tab_items` (no seat table).
- 2026-11-14: Printed tickets instead of bar/kitchen display screens, matching how bars here work. `sentAt` marks what's been printed, so only new items print.
- 2026-11-14: Food prints on a separate kitchen printer, drinks on the bar printer; an item's category decides which ticket it goes on.
- 2026-11-14: `sentAt` / `voidedAt` are nullable timestamps (empty = not yet), not booleans: they record when, and `voidedBy` records who.
- 2026-11-14: Voids are kept and recorded (`voidedAt`, `voidedBy`), never deleted, so managers can spot void-after-cash theft.
- 2026-11-13: Claude writes tooling/config boilerplate; my hands-on learning goes into core logic (domain, real-time, auth, money).

## Things I faked

_Anything that works but I can't fully explain yet. Clear these weekly._

- (empty)

## Session log

_One line per session: date, machine, what got done._

- 2026-11-05: Roadmap and CLAUDE.md created.
- 2026-11-13: Monorepo scaffold reviewed, CLAUDE.md moved to root, ESLint 9 flat config + Prettier + husky/lint-staged set up. Docker Postgres on :5433, first migration (`venues`) applied. Health endpoints + status page, verified with DB up/down/restarted. Dockerfiles + compose `app` profile, graceful SIGTERM shutdown. Vitest + first API tests, CI workflow (green on GitHub after fixing a transient pnpm download failure with retries), branch protection on. Deploy moved to Phase 7; Phase 0 done.
