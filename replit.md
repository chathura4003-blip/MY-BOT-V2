# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT (jsonwebtoken)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (backend for admin panel)
│   └── admin-panel/        # React + Vite WhatsApp Bot Admin Panel
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## WhatsApp Bot Admin Panel

A full-featured WhatsApp bot admin panel with:
- **Login page** — JWT-based authentication (username: `admin`, password: `admin123`)
- **Dashboard** — Bot stats, uptime, memory/CPU usage, session summary, network stats
- **Sessions page** — Manage WhatsApp sessions (create, reconnect, logout, delete)
- **Broadcast page** — Send messages to all users or specific targets
- **Settings page** — Configure bot settings (name, prefix, toggles) and restart bot
- **Logs page** — Real-time terminal-style log viewer with color-coded levels

Default credentials: `admin` / `admin123` (set via `ADMIN_USER` and `ADMIN_PASS` env vars)

### API Routes (all under `/api`)
- `POST /auth/login` — Login, returns JWT token
- `GET /stats` — Bot statistics (auth required)
- `GET /sessions` — List all sessions (auth required)
- `POST /sessions` — Create session (auth required)
- `DELETE /sessions/:id` — Delete session (auth required)
- `POST /sessions/:id/reconnect` — Reconnect session (auth required)
- `POST /sessions/:id/logout` — Logout session (auth required)
- `POST /broadcast` — Send broadcast message (auth required)
- `GET /settings` — Get bot settings (auth required)
- `POST /settings` — Update bot settings (auth required)
- `GET /logs` — Get recent logs (auth required)
- `POST /bot/restart` — Restart bot (auth required)

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request/response validation.

### `artifacts/admin-panel` (`@workspace/admin-panel`)

React + Vite frontend. Dark purple cyberpunk theme. Uses React Query hooks from `@workspace/api-client-react`.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec. Run codegen: `pnpm --filter @workspace/api-spec run codegen`
