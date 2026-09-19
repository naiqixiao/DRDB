# DRDB: Developmental Research Database System

### System Overview
The **Developmental Research Database (DRDB)** is a secure, laboratory management system designed specifically for developmental psychology and cognitive science research labs. It provides a centralized, modern interface to streamline participant recruitment, longitudinal study tracking, scheduling, and personnel management. 

Built with a robust Vue 3 frontend and a Node.js/MySQL backend, DRDB eliminates the friction of decentralized spreadsheets and legacy databases, allowing Principal Investigators (PIs) and Research Assistants (RAs) to focus on science rather than administrative overhead.

- **Demo Videos & Instructions (v2, to be updated):** [System Overview](https://mcmaster-baby-lab.github.io/handbook/DRDB)
- **Documentation (v1, obsolete):** [drdb.readthedocs.io](https://drdb.readthedocs.io)
- **AI email personalization:** [implementation guide](docs/AI_Email_Personalization.rst)
- **AI family participation summary:** [implementation guide](docs/AI_Family_Participation_Summary.rst)

---

# Recent Updates

- **Vue 3 Frontend:** The client (`client/`) has been rebuilt with Vue 3, Vite, and Pinia.
- **Testing Rooms:** Dedicated rooms (e.g., Eye Tracking, fNIRS) linked to independent Google Calendars.
- **Advanced Study Logistics:** Prerequisites, exclusions, multiple age groups, and condition-specific criteria (ASD, Premature, Vision/Hearing loss).
- **Automated Emails:** Template-based confirmation, reminder, and follow-up emails organized via Gmail labels.

---

# Tech Stack

| Layer | Technology |
|---|---|
| **Backend** (`server/`) | Express.js, Sequelize ORM, MySQL/MariaDB, Google APIs |
| **Frontend** (`client/`) | Vue 3, Vite, Pinia, Vuetify |
| **Process Manager** | PM2 |
| **Web Server** | Nginx (reverse proxy) |

### Frontend Customization
A guide on changing colors, logo, and fonts is available in [`client/README.md`](client/README.md).

---

# V2 to V3 Migration

> [!CAUTION]
> **Take a full database backup before proceeding.** V3 includes significant database structure changes.

A detailed, step-by-step migration guide is available in [`migration_guide_v2_to_v3.md`](migration_guide_v2_to_v3.md).

**Summary of steps:**
1. Pull the latest code and backup the database (`mysqldump`).
2. Run the SQL patches from the `MySQL/` directory (`databasePatch1.01.sql`, `migrate_age_groups.sql`).
3. Configure the backend environment (`.env`).
4. Set up Google OAuth credentials (see below).
5. Build the frontend (`npm run build` in `client/`) and deploy to Nginx.

---

# Google OAuth Setup

Google Calendar and Gmail integration is a core feature of DRDB. **Without correctly configured credentials, email reminders and calendar sync will not function.**

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).

## Step 2: Enable Required APIs

Navigate to **APIs & Services > Library** and enable:
- **Gmail API**
- **Google Calendar API**

## Step 3: Configure the OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**.
2. Choose **User Type**:
   - **Internal** — if all users are within a Google Workspace organization (no verification needed).
   - **External** — if users have regular `@gmail.com` accounts.
3. Fill in the required app information (name, support email).
4. Under **Scopes**, add the following (or they will be requested automatically):
   - `https://mail.google.com/`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.compose`
   - `https://www.googleapis.com/auth/gmail.settings.basic`
   - `https://www.googleapis.com/auth/gmail.labels`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`

> [!WARNING]
> If the consent screen is set to **"Testing"** (not published), only emails explicitly listed under **Test users** can authorize the app. You will get a **`403: access_denied`** error for any email not on that list.

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. **Application type: Web application** (do NOT choose "Desktop app" for production servers).
4. Under **Authorized redirect URIs**, add your callback URL:
   ```
   https://yourdomain.com/oauth/callback
   ```
   For example: `https://ccd.tau.ac.il/oauth/callback`.

   For local development, also add: `http://localhost:5173/oauth/callback`.

5. Click **Create** and download the JSON file.

## Step 5: Deploy the Credentials File

1. Rename the downloaded file to `credentials.json`.
2. Place it on the server at:
   ```
   server/api/google/general/credentials.json
   ```
3. The file should have a `"web"` key (not `"installed"`). Example structure:
   ```json
   {
     "web": {
       "client_id": "xxxx.apps.googleusercontent.com",
       "project_id": "your-project-id",
       "auth_uri": "https://accounts.google.com/o/oauth2/auth",
       "token_uri": "https://oauth2.googleapis.com/token",
       "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
       "client_secret": "GOCSPX-xxxx",
       "redirect_uris": ["https://yourdomain.com/oauth/callback"]
     }
   }
   ```

> [!IMPORTANT]
> The backend code supports both `"web"` and `"installed"` credential formats. However, **`"web"` is required for production** because Google blocks `"installed"` (Desktop) credentials from using redirect URIs with real domains.

## Step 6: Activate in the App

1. Log in to DRDB as an **Admin**.
2. Go to **Settings**.
3. Click **Setup Google Account** (for lab email) or **Setup Admin Account** (for admin email).
4. A Google sign-in window will open — authorize with the intended Gmail account.
5. Paste the authorization code back into the dialog in DRDB.
6. On success, the email address will appear next to the setup button.

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` | The redirect URI sent by the server doesn't match any URI registered in Google Cloud Console. | Add the exact URI (e.g., `https://yourdomain.com/oauth/callback`) to **Authorized redirect URIs** in the Cloud Console, and ensure `credentials.json` contains it. |
| `403: access_denied` | The consent screen is in "Testing" mode and the email is not listed as a test user. | Add the email to **Test users** in the OAuth consent screen, or publish the app. |
| `invalid_client` | The `client_id` or `client_secret` in `credentials.json` is wrong or the credential was deleted. | Re-download the JSON from Google Cloud Console. |

---

# Backend Environment Variables

The backend reads configuration from `server/.env`. Key variables (see `server/config/general.js` for defaults):

```env
JWT_KEY=your_jwt_secret
DB_NAME=DRDB
DB_USER=root
DB_PASS=your_db_password
DB_HOST=localhost
DB_DIALECT=mariadb
TIMEZONE=America/Toronto
FRONTEND_URL=https://yourdomain.com
```

DRDB includes two optional, human-reviewed AI assistants — email
personalization/polishing and a family participation summary — both opt-in
and both requiring an explicit accept before anything changes. See
[AI email personalization](docs/AI_Email_Personalization.rst) and
[AI family participation summary](docs/AI_Family_Participation_Summary.rst)
for full details. Cloud testing (Groq) is restricted to training-set or
de-identified families unless the relevant `*_ALLOW_REAL_DATA=true` flag is
explicitly enabled after the lab approves the provider's data-processing
terms. Every AI feature shares one provider config:

```env
AI_PROVIDER=ninfer               # default/recommended: local NInfer server
AI_TIMEOUT_MS=15000
NINFER_URL=http://<host>:8080/v1/chat/completions
NINFER_MODEL=Qwen3.8-27B
NINFER_ENABLE_THINKING=false

AI_EMAIL_ENABLED=false
AI_EMAIL_ALLOW_REAL_DATA=false

AI_FAMILY_SUMMARY_ENABLED=false
AI_FAMILY_SUMMARY_ALLOW_REAL_DATA=false

# For Ollama or Groq instead of NInfer, see server/.env.example.
```

Set `AI_EMAIL_PROVIDER` or `AI_FAMILY_SUMMARY_PROVIDER` to override the
provider for just that one feature without changing `AI_PROVIDER` globally.

> [!NOTE]
> `FRONTEND_URL` controls the CORS allowed origins. Set it to your production domain. Multiple origins can be comma-separated (e.g., `https://yourdomain.com,http://localhost:5173`).

---

# Docker deployment

The repository includes a production-oriented Docker Compose deployment with
three services: Vue/Nginx frontend, Node backend, and MariaDB. The browser only
needs the frontend port; Nginx forwards `/api` requests internally to the
backend.

## First deployment

1. Install Docker Engine and Docker Compose on the host.
2. Copy the example configuration and replace every placeholder with a strong,
   unique value:

   ```bash
   cp .env.example .env
   ```

   Set `FRONTEND_URL` and `URL` to the public address users will visit (use an
   `https://` URL when a TLS reverse proxy is in front of DRDB).

   > [!NOTE]
   > The AI feature variables (`AI_PROVIDER`, `NINFER_URL`, `AI_EMAIL_ENABLED`,
   > `AI_FAMILY_SUMMARY_ENABLED`, etc.) are passed through to the `backend`
   > service in `docker-compose.yml` the same way `DB_PASS`/`JWT_KEY` are —
   > set them in this root `.env`, not `server/.env` (the backend container
   > never sees `server/.env`; it's excluded from the build via
   > `server/.dockerignore`). They all default to disabled/local-NInfer if
   > left unset.
3. Build and start all services:

   ```bash
   docker compose up --build -d
   ```

   Open `http://localhost:8080` (or the configured `HTTP_PORT`). The initial
   empty database is initialized from `MySQL/Template.sql` and the current
   migration tables. Initialization scripts run only once, when the database
   volume is first created.
4. Before configuring Google integration, copy the Google OAuth credential
   file into the backend's persistent runtime volume:

   ```bash
   docker cp server/api/google/general/credentials.json "$(docker compose ps -q backend):/app/api/google/general/credentials.json"
   ```

   OAuth tokens created through the application then remain in the same
   persistent volume. Never add credentials, tokens, or `.env` to Git.

For an existing installation, first create a verified `mysqldump` backup, then
import it into the new database container rather than allowing the blank-schema
initialization to become the source of truth. See the backup and restore
commands below.

## Upgrades and database safety

Application images and database data are separate. MariaDB uses the named
volume `drdb_database`; it is not rebuilt or replaced when frontend/backend
images are rebuilt. Update the application services without touching the
database service:

```bash
docker compose build frontend backend
docker compose up -d --no-deps frontend backend
```

Do not run `docker compose pull` as the routine application upgrade command:
it can also pull a newer MariaDB image. The volume still prevents a database
replacement, but a database-engine upgrade can perform its own system-table or
storage-format migrations. Treat MariaDB version changes as separate,
backup-first maintenance and follow the MariaDB upgrade guide for the exact
versions involved.

Do **not** use `docker compose down -v`, `docker volume rm drdb_database`, or
`docker system prune --volumes` unless you intentionally want to delete the
database. `docker compose down` (without `-v`) is safe: it stops and removes
containers but preserves all named volumes.

Create an off-host backup before every upgrade:

```bash
docker compose exec -T database mariadb-dump -u"$DB_USER" -p"$DB_PASS" DRDB > drdb-backup-$(date +%F).sql
```

To restore into a deliberately empty database volume:

```bash
docker compose exec -T database mariadb -u"$DB_USER" -p"$DB_PASS" DRDB < drdb-backup-YYYY-MM-DD.sql
```

The compose file also persists Google credentials/tokens, branding uploads,
and generated statistics independently of backend images. For an internet
deployment, place a TLS-capable reverse proxy in front of port 8080 (or expose
that port only on a private network); this compose file intentionally does not
ship TLS certificates.

## Full system migration

An active **Admin** can open **Settings → System Migration** to export an
encrypted `.drdb-migration` archive or import one into a new deployment. The
archive contains the full database, branding/uploads, and Google OAuth
credentials/tokens. It therefore contains participant data and secrets: keep
the downloaded archive and its passphrase separately in approved secure
storage.

Importing is deliberately destructive. It requires typing `REPLACE THIS
SYSTEM`, temporarily places DRDB in maintenance mode, and stores a pre-import
backup in the backend's persistent `app_data/migration-backups` directory.
After an import, sign in using an account from the imported system. Google may
ask for reauthorization if the new deployment uses a different public URL.

The backend image includes the MariaDB command-line client required by this
feature. Rebuild the backend after upgrading to a release containing it:

```bash
docker compose build backend
docker compose up -d --no-deps backend
```

---

# Automated Schedule

Cron jobs are defined in `server/jobs/scheduler.js` and registered from `server/server.js`.

| Time | Task |
|---|---|
| **00:05 AM** | Update all children's ages |
| **00:15 AM** | Auto-complete past confirmed appointments; reject stale tentative ones |
| **00:35 AM** | Reset daily RTU counters |
| **06:00 AM** | Release families from completed schedules |
| **09:30 AM** | Remind primary experimenters about studies pending completion |
| **09:35 AM** | Remind recruiters to follow up with contacted families |
| **04:00 PM** | Send reminder emails to experimenters for next-day studies |
| **05:00 PM** | Send reminder emails to parents for next-day studies |
| **10:46 PM** | Update monthly/weekly study appointment summaries |

---

# Recruitment & Scheduling Rules

- **Locking:** When a family is scheduled for a study, they are locked to that lab to prevent double-booking across labs.
- **Auto-Release:** Families are automatically released when:
  - Their confirmed appointment has passed and is marked completed.
  - A tentative schedule has had no update for 2 weeks (auto-rejected).
- **Completion:** Schedules move to "Completed" status automatically based on appointment time and confirmation status.
