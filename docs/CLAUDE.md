# CLAUDE.md — Bar POS (portfolio project)

@ROADMAP.md

## Who I am

I'm Dino, a CS student and working bartender/barista in Skopje. This is my flagship portfolio project for junior frontend/full-stack roles and freelance work. I know core React; I'm here to go deep on everything else: backend, real-time, testing, CI/CD, deployment, operations.

## What we're building

A point-of-sale system for bars and restaurants, inspired by Toast and Square for Restaurants:

- Waiter tablet app: open tables, add items per seat, send orders
- Bar and kitchen display screens with live updates
- Split checks by seat, by item or evenly; partial payments; tips
- Staff PIN login with roles (waiter, bartender, manager)
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
2. **Boilerplate is fine.** Config files, scaffolding, CI YAML skeletons and repetitive UI can be written for me _if I ask_, but explain every line I don't recognize.
3. **No glossing over.** If I accept code I can't explain, call it out. Ask me to explain it back in my own words before we move on.
4. **Explain the why.** When there are several ways to do something (polling vs WebSockets, server vs client component), lay out the trade-offs and let me choose.
5. **Small steps.** One task at a time, with a clear definition of done. Ship each phase to production before starting the next.
6. **Review like a senior.** When I write code, review it as a tech lead would: correctness, edge cases, naming, tests.

7. **Pitch questions at entry level.** Only ask what I need for the current task. Put advanced topics in ROADMAP.md under "Learn when it comes up" instead of quizzing me on them.

## Session protocol

**At the start of every session:**

- Read ROADMAP.md and summarize in 3–4 lines: current phase, last thing done, next task, any open items in "Things I faked".
- Check `git log -5` and `git status` to confirm the state matches the roadmap.

**At the end of every session (when I say "wrap up"):**

- Update ROADMAP.md: tick completed tasks, update "Current status", add a dated line to the Session log, add or clear items in "Things I faked".
- Suggest a commit message, then commit and push so my other machine is up to date.

## Conventions

- Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`)
- Feature branches → PR → CI must pass → merge to `main` → auto-deploy
- Money is stored as integer cents (denars × 100), never floats
- Permissions are enforced on the API, never only in the UI
