# Architecture

```
 Waiter tablet / Bar & kitchen display / Manager dashboard   (browsers)
                         │  HTTPS + WSS
                         ▼
                ┌──────────────────┐
                │  Caddy (TLS)     │   one domain, routes by path
                └──┬───────────┬───┘
         /*        │           │   /api/*, /ws
                   ▼           ▼
          ┌─────────────┐  ┌──────────────────────┐
          │ apps/web    │  │ apps/api             │
          │ Next.js     │  │ Fastify + Zod        │
          │ TanStack Q  │  │ REST + WebSocket hub │
          └─────────────┘  └──────────┬───────────┘
                                      ▼
                              ┌──────────────┐
                              │ PostgreSQL   │
                              └──────────────┘
   Docker Compose on one Hetzner VPS. Sentry in web and api.
   packages/shared: Zod schemas + types used by both apps.
```

## Decisions
- **Same origin behind Caddy** (`/` → web, `/api` + `/ws` → api). Why: no CORS setup, cookies are sent automatically, and the WebSocket connects to the same host.
- **Shared Zod schemas in `packages/shared`.** Why: one definition gives the frontend its types and lets the API validate incoming data at runtime. TypeScript types disappear at runtime, and anyone can send requests to the API.
- **Drizzle schema lives in `apps/api`, and `shared` never imports it.** Why: only the API talks to the database, and the database drivers are Node-only, so they would break the browser bundle.
- **Health checks: one for "process is up", one for "database reachable".** Why: these are different failures that need different responses.

## Learn when it comes up
- Renaming or dropping columns safely during a deploy (search "expand and contract migrations")
- Liveness vs readiness checks in detail
