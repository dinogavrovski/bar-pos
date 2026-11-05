# Bar POS — Roadmap & Progress

## Current status
- **Phase:** 0 — Foundation & pipeline
- **Last done:** Roadmap created
- **Next task:** Draw the architecture (web ↔ API ↔ DB ↔ WebSockets) and decide what CI must check before deploying
- **Blockers:** none

---

## Phase 0 — Foundation & pipeline
*Goal: an empty app that is already live, tested and auto-deployed.*
- [ ] Architecture sketch (add it to `docs/architecture.md`)
- [ ] Monorepo: `apps/web`, `apps/api`, `packages/shared`; TypeScript strict everywhere
- [ ] ESLint + Prettier + a pre-commit hook
- [ ] Postgres in docker-compose for local dev; first Drizzle migration
- [ ] `/health` endpoint on the API; web page that shows API status
- [ ] Dockerfiles (multi-stage) for web and api
- [ ] GitHub Actions CI: install → lint → typecheck → test → build images
- [ ] Provision the VPS: SSH keys, firewall, Docker, Caddy with HTTPS on a domain
- [ ] CD: on merge to `main`, build, push images, deploy to the VPS
- [ ] Sentry wired up in web and api

**Questions to answer yourself:** Why do multi-stage builds give smaller images? What do CI caching keys depend on? Where do secrets live, and why never in the repo? How do you roll back a bad deploy?

**Done when:** pushing to `main` updates the live site with zero manual steps.

## Phase 1 — Domain & data model
*Goal: the hardest design problem, solved on paper first, then in code with tests.*
- [ ] Paper design: venue, area, table, seat, menu category, item, modifier, order, order item, check, payment, staff, shift
- [ ] Drizzle schema + migrations + seed script (a realistic bar menu)
- [ ] Shared Zod schemas in `packages/shared`
- [ ] Pure domain functions: split evenly, by seat, by item; move item between checks; merge tables
- [ ] Unit tests for every split and rounding edge case

**Questions:** Splitting 1000 den three ways, where does the leftover denar go? Is a check derived from orders or stored separately? What happens to a split check when an item is voided?

**Done when:** you can explain the schema on a whiteboard and the domain tests cover the split edge cases.

## Phase 2 — Waiter app
- [ ] Floor plan view with table status (free / open / waiting to pay)
- [ ] Open a table, assign items to seats, add modifiers and notes
- [ ] Send the order to the bar or kitchen (route items by category)
- [ ] TanStack Query with optimistic updates and rollback on error
- [ ] Tablet-first layout, big touch targets

**Questions:** Which state belongs on the server and which only in the UI? What does an optimistic update do when the server rejects it?

## Phase 3 — Real-time
- [ ] WebSocket server in the API; rooms per venue or station
- [ ] Bar and kitchen display: incoming tickets, mark in progress / ready
- [ ] Waiter gets notified when items are ready
- [ ] Reconnect logic: resync missed events after a dropped connection
- [ ] Concurrency: two waiters editing the same check

**Questions:** Why WebSockets instead of polling here? What's the source of truth, the event or the database? Optimistic locking vs last-write-wins, which fits a POS?

## Phase 4 — Auth & roles
- [ ] Staff PIN login with a session per device
- [ ] Roles: waiter, bartender, manager
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

## Phase 7 — Production hardening
- [ ] Playwright E2E: open table → order → split → pay → report, run in CI
- [ ] Automated nightly DB backups, plus one practiced restore
- [ ] Load-test the WebSocket server (e.g. k6)
- [ ] Structured logs and a basic uptime check
- [ ] Seeded public demo with "Log in as waiter / manager" buttons; demo data resets nightly

## Phase 8 — Polish & presentation
- [ ] README: screenshots, architecture diagram, how to run locally, decisions section
- [ ] 2-minute demo video
- [ ] CI badge, clean issues/PR history
- [ ] Stretch: offline mode (PWA that queues orders and syncs later)
- [ ] Stretch: Macedonian/English language switch

---

## Decisions
*One line each: date, decision, why.*
- 2026-11-05: Separate Fastify API instead of Next.js API routes, to learn backend properly and to host the WebSocket server.
- 2026-11-05: Self-hosted VPS instead of Vercel, to learn real deployment.

## Things I faked
*Anything that works but I can't fully explain yet. Clear these weekly.*
- (empty)

## Session log
*One line per session: date, machine, what got done.*
- 2026-11-05: Roadmap and CLAUDE.md created.
