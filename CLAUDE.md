# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DRDB (Developmental Research Database) is a laboratory management system for developmental psychology and cognitive science research labs. It handles participant recruitment, longitudinal study tracking, scheduling, and personnel management.

## Tech Stack

- **Backend** (`server/`): Express.js, Sequelize ORM, MariaDB, Google APIs (Gmail + Calendar)
- **Frontend** (`client/`): Vue 3, Vite, Pinia (state management), Vuetify 3 (UI components)
- **Process Manager**: PM2 (production)
- **Web Server**: Nginx (reverse proxy, production)

## Commands

| Command | Directory | Description |
| --- | --- | --- |
| `npm start` | `server/` | Start backend with nodemon (port 3000) |
| `npm test` | `server/` | Run Jest tests (`NODE_ENV=test`) |
| `npm run dev` | `client/` | Start Vite dev server (port 5173) |
| `npm run build` | `client/` | Build for production (outputs to `client/dist`) |
| `npm run preview` | `client/` | Preview production build locally |

No project-level linting or formatting configs exist. Prettier is a server devDependency but has no config file or script entry.

**Note:** There are two timezone env vars: `TZ` (read by `config/general.js` for DB connection) and `TIMEZONE` (read by `jobs/scheduler.js` as cron job fallback). The README only shows `TIMEZONE`. For consistency, set both to the same value.

## Backend Architecture

**Entry point:** `server/server.js` creates the HTTP server, registers cron jobs from `server/jobs/scheduler.js`, and handles graceful shutdown (SIGTERM/SIGINT: drain connections, force-close after 10s).

**App setup:** `server/app.js` configures Express middleware (CORS, body-parser, Morgan, Swagger) and mounts all route handlers under `/api/*`.

**Route → Controller → Model pattern:**
- Routes: `server/api/routes/*.js` — define REST endpoints
- Controllers: `server/api/controllers/*.js` — business logic
- Models: `server/api/models/DRDB.js` — defines all Sequelize associations; auto-generated model files in `server/api/models/SequelizeAuto/` (17 entities: Appointment, Child, Conversations, Experimenter, ExperimenterAssignment, Family, Feedback, Lab, Personnel, Schedule, ScheduledJobSetting, SecondExperimenterAssignment, Sibling, Study, StudyAgeGroup, SystemSetting, TestingRoom)
- Middleware: `server/api/middleware/check-auth.js` — JWT auth guard; `validate.js` — request validation; `oAuth.js` — loads Google OAuth2 credentials + token for a given lab, attaches `req.oAuth2Client`

**Auth:** JWT-based. Tokens sent as `Authorization: Bearer <token>`. The `check-auth` middleware verifies tokens and attaches `req.userData`.

**Google OAuth:** The `oAuth` middleware reads credentials from `api/google/general/credentials.json` and per-lab tokens from `api/google/labs/lab{labId}/token.json`. It supports both `"web"` and `"installed"` credential formats (use `"web"` in production).

**DB config:** `server/config/general.js` reads from `.env` via `dotenv`. Connection pool config: max 40, min 0, acquire 30s, idle 10s. `freezeTableName: true` on all models.

**Cron jobs:** Defined in `server/jobs/scheduler.js` as `SCHEDULED_JOBS` array. Two job types:
- **Editable (lab-scoped):** `family-reminders`, `experimenter-reminders`, `auto-completion-prompt`, `auto-rejection-prompt` — can be enabled/disabled and rescheduled per-lab via `/api/jobs`. Settings persisted in `ScheduledJobSetting` model.
- **Global (nightly maintenance):** `update-child-ages`, `past-appt-completion`, `reset-rtu-counters`, `release-old-families`, `update-study-summaries` — run once, cannot be edited.

Timezone resolution order: `Lab.Timezone` > `SystemSetting.GeneralTimezone` > `process.env.TIMEZONE` > `"America/Toronto"`.

**Google integration:** Gmail + Calendar credentials go in `server/api/google/general/credentials.json` (gitignored). OAuth flow uses `web` app type, not `installed`. Per-lab OAuth tokens are stored at `server/api/google/labs/lab{labId}/token.json`. See README.md for full setup guide.

**Swagger API docs:** Available at `/api-docs` when the server is running.

**API route registry** (mounted in `app.js`):
```
/api/user            — auth, login, user profile
/api/family           — family CRUD
/api/child            — child CRUD
/api/conversation     — recruitment conversations
/api/study            — study definitions
/api/personnel        — lab personnel
/api/lab              — lab configuration
/api/experimenter     — study-experimenter assignments
/api/appointment      — appointment scheduling
/api/experimentAssignment — experimenter assignments for appointments (1st + 2nd)
/api/schedule         — family study schedules
/api/auto             — autocomplete suggestions
/api/cal              — Google Calendar integration
/api/gmail            — Gmail integration
/api/extAPIs          — external API proxies
/api/feedback         — feedback submissions
/api/reminder         — email reminders
/api/RTU              — real-time update counters
/api/jobs             — scheduled job management (enable/disable)
/api/TestingRoom      — testing room config + calendar links
/api/systemSetting    — system-wide settings
/api/emailTest        — email diagnostic tool
/api/calendarTest     — calendar diagnostic tool
```

### Key Data Relationships

- Family 1:N Child, 1:N Conversations, 1:N Appointment
- Lab 1:N Personnel, 1:N Study, 1:N Family (AssignedLab), 1:N TestingRoom
- Study M:N Personnel (through Experimenter)
- Study M:N Study (self-referencing for Prerequisites and Exclusions)
- Child M:N Child (through Sibling)
- Appointment M:N Personnel (through ExperimenterAssignment and SecondExperimenterAssignment)
- Study 1:N StudyAgeGroup

## Frontend Architecture

**Entry point:** `client/src/main.js` — creates Vue app with Vuetify (full component/directive import), Pinia (with `pinia-plugin-persistedstate`), Vue Router, and a global `parameters` plugin (`client/src/plugins/parameters.js`). Vuetify theme: primary `#1E40AF`, secondary `#3B82F6`, background `#F8FAFC`. Also imports `style.css` and `design-system.css`.

**Router:** `client/src/router/index.js` — hash-based routing (`createWebHashHistory`). 11 routes: Login, Home, Family, Appointment, Schedule, Personnel, Study, Settings, EmailTest, CalendarTest, Setup.

**First-run setup wizard:** A `router.beforeEach` guard forces logged-in users with `temporaryPassword && isFirstRun` to `/setup`. Conversely, navigating to `/setup` without those flags redirects to `/family`.

**State management:** `client/src/stores/` — Pinia stores with `pinia-plugin-persistedstate` for localStorage persistence.

**API services:** `client/src/services/*.js` — each file wraps axios calls to the backend (api.js for HTTP client, family.js, appointment.js, etc.).

**Views:** `client/src/views/*.vue` — one view per route, lazy-loaded.

**Components:** `client/src/components/` — 300+ reusable Vuetify-based components.

**Rich text editor:** TipTap (`@tiptap/vue-3`) with links, tables, and underline extensions. Used for email templates and conversation notes.

**Charts:** Chart.js via `vue-chartjs` for study statistics visualizations.

**Excel export:** `xlsx` (SheetJS) for data export functionality.

**Styling:** Dual-layer — Vuetify theme colors in `main.js`, CSS custom properties in `src/design-system.css` (status colors, radii, fonts, shadows). Default fonts: Fira Code (headings), Fira Sans (body).

**Path alias:** `@` maps to `client/src/` (configured in `vite.config.js`).

**Vite proxy:** `/api` requests proxied to `http://localhost:3000` (configured in `vite.config.js`). No separate CORS config needed for local dev.

**Frontend customization:** See `client/README.md` for theme, logo, font, and app name changes.

## Key Environment Variables (server/.env)

There is no `.env.example` file. Create `server/.env` manually with the variables below.

| Variable | Default | Description |
| --- | --- | --- |
| `JWT_KEY` | *(required)* | Secret for signing JWT tokens |
| `APP_URL` | `'URL of the system'` | System URL |
| `TZ` | `'America/Toronto'` | Timezone for DB and cron jobs |
| `DB_NAME` | `'DRDB'` | Database name |
| `DB_USER` | `'root'` | Database user |
| `DB_PASS` | `''` | Database password |
| `DB_HOST` | `'localhost'` | Database host |
| `DB_DIALECT` | `'mariadb'` | Database dialect |
| `DB_POOL_MAX` | `'40'` | DB connection pool max |
| `FRONTEND_URL` | `'example URL'` | CORS allowed origins (comma-separated) |
| `port` | `3000` | Server listen port |

## Testing

Tests use Jest + Supertest. Config in `server/jest.config.js` mocks `config/general` via `server/__mocks__/generalConfig.js` (fake Sequelize instance, test DB name `DRDB_TEST`). Tests are in `server/__tests__/`.

**Note:** There are currently no frontend tests. The client has no test runner configured.

```bash
cd server && npm test               # run all tests
cd server && npx jest --verbose     # run with verbose output
cd server && npx jest path/to/file  # run a single test file
```

## Database

SQL migration scripts are in `MySQL/`. Key patches for V3 migration: `databasePatch1.01.sql`, `migrate_age_groups.sql`, `v3_patch.sql`, `v3_child_patch.sql`. Full migration guide: `migration_guide_v2_to_v3.md`. Always backup the database before running patches.

**Auto-seeding:** On startup (`server/api/models/DRDB.js`), if the `Personnel` table is empty, the seeder (`server/api/utils/seeder.js`) creates a default Lab, a default Admin (email: `admin@example.com`, password: `admin`, `temporaryPassword: true`), and sets `SystemSetting.isFirstRun = true`. This triggers the frontend setup wizard on first login.
