# CLAUDE.md — Bar POS (portfolio project)

@docs/ROADMAP.md

## Who I am

I'm Dino, a CS student and working bartender/barista in Skopje. This is my flagship portfolio project for junior frontend/full-stack roles and freelance work. I know core React; I'm here to go deep on everything else: backend, real-time, testing, CI/CD, deployment, operations.

## What we're building

A point-of-sale system for bars and restaurants, inspired by Toast and Square for Restaurants:

- Order terminal at the bar: open tabs, add items per person, send orders (built for how bars in Macedonia work: the waiter takes the order at the table and enters it on a shared terminal)
- Sending an order prints a ticket for the bartender with only the newly added items; no bar or kitchen display screens
- Split the bill by person, by item or evenly; partial payments; tips
- Staff PIN login with roles (admin: managers/owners; normal: waiters/bartenders); voids are recorded, never deleted
- Manager dashboard: shift reports, top sellers, sales by hour
- Deployed live with a seeded demo and one-click demo logins

## Stack

- Monorepo: pnpm workspaces (`apps/web`, `apps/api`, `packages/shared`)
- Web: Next.js (App Router), TypeScript strict, Tailwind + shadcn/ui, TanStack Query
- API: Node + Fastify, WebSockets, Zod validation (schemas shared with the frontend)
- DB: PostgreSQL + Drizzle ORM with migrations
- Tests: Vitest (unit/integration), Playwright (E2E)
- DevOps: Docker + docker-compose, GitHub Actions, VPS (Hetzner) behind Caddy
- Ops: Sentry, structured logging (pino), automated DB backups

Update this section when a stack decision changes, and log the reason in ROADMAP.md → Decisions.

## How to work with me (important)

I'm using this project to learn, not just to ship. Follow these rules:

1. **Hints before code.** For core logic (data model, split-check math, real-time sync, auth/permissions, money handling), don't write the solution first. Ask what I think, give hints, point me to the concept or docs, and let me try.
2. **Boilerplate is yours.** Write tooling config (lint, format, hooks, tsconfig, Docker, CI YAML), scaffolding and repetitive UI for me. Give a short explanation of what each piece does and why, but don't make me write it myself.
3. **No glossing over.** If I accept code I can't explain, call it out. Ask me to explain it back in my own words before we move on.
4. **Explain the why.** When there are several ways to do something (polling vs WebSockets, server vs client component), lay out the trade-offs and let me choose.
5. **Small steps.** One task at a time, with a clear definition of done. Each phase is merged to `main` with green CI before starting the next. Deploying to production happens in Phase 7 (see ROADMAP Decisions).
6. **Review like a senior.** When I write code, review it as a tech lead would: correctness, edge cases, naming, tests.
7. **Pitch questions at entry level.** Only ask what I need for the current task. Put advanced topics in ROADMAP.md under "Learn when it comes up" instead of quizzing me on them.

## Session protocol

**At the start of every session:**

- Read ROADMAP.md and summarize in 3–4 lines: current phase, last thing done, next task, any open items in "Things I faked".
- Check `git log -5` and `git status` to confirm the state matches the roadmap.

**During the session:**

- Keep `docs/ROADMAP.md` (and this file, when a stack or workflow decision changes) up to date as tasks finish. Don't wait for the wrap-up.

**At the end of every session (when I say "wrap up"):**

- Update ROADMAP.md: tick completed tasks, update "Current status", add a dated line to the Session log, add or clear items in "Things I faked".
- Suggest a commit message, then commit and push so my other machine is up to date.

## Conventions

- Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`)
- Feature branches → PR → CI must pass → merge to `main` (branch protection enforces this; auto-deploy comes in Phase 7)
- Money is stored as integer cents (denars × 100), never floats
- Permissions are enforced on the API, never only in the UI
