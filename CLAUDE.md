# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DRDB (Developmental Research Database) is a laboratory management system for developmental psychology and cognitive science research labs. It handles participant recruitment, longitudinal study tracking, scheduling, and personnel management.

## Tech Stack

- **Backend** (`server/`): Express.js, Sequelize ORM, MariaDB, Google APIs (Gmail + Calendar)
- **Frontend** (`client/`): Vue 3, Vite, Pinia (state management), Vuetify 3 (UI components)
- **Process Manager**: PM2 (production)
- **Web Server**: Nginx (reverse proxy, production)

## Quick Start

```bash
# Backend (from server/)
cp .env.example .env   # then edit with real DB credentials
npm install
npm start               # runs with nodemon on port 3000

# Frontend (from client/)
npm install
npm run dev             # Vite dev server on port 5173, proxies /api to localhost:3000
```

The client proxies API requests to the backend via Vite (`vite.config.js`). No separate CORS configuration needed for local dev.

## Commands

| Command | Directory | Description |
| --- | --- | --- |
| `npm start` | `server/` | Start backend with nodemon |
| `npm test` | `server/` | Run Jest tests (`NODE_ENV=test`) |
| `npm run dev` | `client/` | Start Vite dev server |
| `npm run build` | `client/` | Build for production (outputs to `client/dist`) |
| `npm run preview` | `client/` | Preview production build locally |

## Backend Architecture

**Entry point:** `server/server.js` creates the HTTP server and registers cron jobs from `server/jobs/scheduler.js`.

**App setup:** `server/app.js` configures Express middleware (CORS, body-parser, Morgan, Swagger) and mounts all route handlers under `/api/*`.

**Route → Controller → Model pattern:**
- Routes: `server/api/routes/*.js` — define REST endpoints
- Controllers: `server/api/controllers/*.js` — business logic
- Models: `server/api/models/DRDB.js` — Sequelize models (auto-imported from MariaDB schema)
- Middleware: `server/api/middleware/check-auth.js` — JWT auth guard; `validate.js` — request validation

**Auth:** JWT-based. Tokens sent as `Authorization: Bearer <token>`. The `check-auth` middleware verifies tokens and attaches `req.userData`.

**DB config:** `server/config/general.js` reads from `.env` (DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_DIALECT). Default dialect: MariaDB.

**Cron jobs:** Defined in `server/jobs/scheduler.js` as `SCHEDULED_JOBS` array. Run daily at fixed times (timezone from env `TIMEZONE`). Include child age updates, appointment auto-completion, RTU counter resets, family release, and reminder emails.

**Google integration:** Gmail + Calendar credentials go in `server/api/google/general/credentials.json` (gitignored). OAuth flow uses `web` app type, not `installed`.

**Swagger API docs:** Available at `/api-docs` when the server is running.

## Frontend Architecture

**Entry point:** `client/src/main.js` — creates Vue app with Vuetify, Pinia (with persisted state plugin), Vue Router, and a global parameters plugin.

**Router:** `client/src/router/index.js` — hash-based routing (`createWebHashHistory`). Routes include Home, Login, Family, Appointment, Schedule, Personnel, Study, Settings, Setup wizard.

**State management:** `client/src/stores/` — Pinia stores with `pinia-plugin-persistedstate` for localStorage persistence.

**API services:** `client/src/services/*.js` — each service file corresponds to a domain (api.js for HTTP client, family.js, appointment.js, etc.) and wraps axios calls to the backend.

**Views:** `client/src/views/*.vue` — one view per route, lazy-loaded.

**Components:** `client/src/components/` — ~300+ reusable Vuetify-based components.

**Styling:** Dual-layer — Vuetify theme colors in `main.js`, CSS custom properties in `src/design-system.css` (status colors, radii, fonts, shadows).

**Path alias:** `@` maps to `client/src/` (configured in `vite.config.js`).

## Key Environment Variables (server/.env)

| Variable | Description |
| --- | --- |
| `JWT_KEY` | Secret for signing JWT tokens |
| `DB_NAME` | Database name (default: DRDB) |
| `DB_USER` | Database user |
| `DB_PASS` | Database password |
| `DB_HOST` | Database host (default: localhost) |
| `DB_DIALECT` | Database dialect (default: mariadb) |
| `TIMEZONE` | Timezone for cron jobs (default: America/Toronto) |
| `FRONTEND_URL` | CORS allowed origins (comma-separated) |

## Testing

Tests use Jest + Supertest. Config in `server/jest.config.js` mocks `config/general` to avoid hitting a real DB. Tests are in `server/__tests__/`.

```bash
cd server && npm test          # run all tests
cd server && npx jest --verbose # run with verbose output
```

## Database

SQL migration scripts are in `MySQL/`. Key patches for V3 migration: `databasePatch1.01.sql`, `migrate_age_groups.sql`, `v3_patch.sql`, `v3_child_patch.sql`. Always backup the database before running patches.
