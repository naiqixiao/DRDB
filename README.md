# DRDB: Developmental Research Database System

## Table of contents

- [System overview](#system-overview)
- [Docker setup for researchers](#docker-deployment)
  - [1. Download DRDB](#1-download-drdb)
  - [2. Install Docker Desktop](#2-install-docker-desktop)
  - [3. Open a command window in the DRDB folder](#3-open-a-command-window-in-the-drdb-folder)
  - [4. Create your settings file](#4-create-your-settings-file)
  - [5. Start DRDB](#5-start-drdb)
  - [6. Sign in for the first time](#6-sign-in-for-the-first-time)
  - [7. Stop and start DRDB later](#7-stop-and-start-drdb-later)
  - [Troubleshooting Docker setup](#troubleshooting-docker-setup)
  - [Connect Google and share with your lab](#connect-google-and-share-with-your-lab)
  - [Upgrades and database safety](#upgrades-and-database-safety)
  - [Full system migration](#full-system-migration)
- [Recent updates](#recent-updates)
- [Tech stack](#tech-stack)
- [V2 to V3 migration](#v2-to-v3-migration)
- [Google OAuth setup](#google-oauth-setup)
- [Backend environment variables](#backend-environment-variables)
- [Automated schedule](#automated-schedule)
- [Recruitment and scheduling rules](#recruitment--scheduling-rules)

## System Overview
The **Developmental Research Database (DRDB)** is a secure, laboratory management system designed specifically for developmental psychology and cognitive science research labs. It provides a centralized, modern interface to streamline participant recruitment, longitudinal study tracking, scheduling, and personnel management. 

Built with a robust Vue 3 frontend and a Node.js/MySQL backend, DRDB eliminates the friction of decentralized spreadsheets and legacy databases, allowing Principal Investigators (PIs) and Research Assistants (RAs) to focus on science rather than administrative overhead.

- **Demo Videos & Instructions (v2, to be updated):** [System Overview](https://mcmaster-baby-lab.github.io/handbook/DRDB)
- **Documentation (v1, obsolete):** [drdb.readthedocs.io](https://drdb.readthedocs.io)
- **AI email personalization:** [implementation guide](docs/AI_Email_Personalization.rst)
- **AI family participation summary:** [implementation guide](docs/AI_Family_Participation_Summary.rst)

---

## Recent Updates

- **Vue 3 Frontend:** The client (`client/`) has been rebuilt with Vue 3, Vite, and Pinia.
- **Testing Rooms:** Dedicated rooms (e.g., Eye Tracking, fNIRS) linked to independent Google Calendars.
- **Advanced Study Logistics:** Prerequisites, exclusions, multiple age groups, and condition-specific criteria (ASD, Premature, Vision/Hearing loss).
- **Automated Emails:** Template-based confirmation, reminder, and follow-up emails organized via Gmail labels.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** (`server/`) | Express.js, Sequelize ORM, MySQL/MariaDB, Google APIs |
| **Frontend** (`client/`) | Vue 3, Vite, Pinia, Vuetify |
| **Process Manager** | PM2 |
| **Web Server** | Nginx (reverse proxy) |

### Frontend Customization
A guide on changing colors, logo, and fonts is available in [`client/README.md`](client/README.md).

---

## V2 to V3 Migration

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

## Google OAuth Setup

Google Calendar and Gmail integration is a core feature of DRDB. **Without correctly configured credentials, email reminders and calendar sync will not function.**

### Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).

### Step 2: Enable Required APIs

Navigate to **APIs & Services > Library** and enable:
- **Gmail API**
- **Google Calendar API**

### Step 3: Configure the OAuth Consent Screen

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

### Step 4: Create OAuth Credentials

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

### Step 5: Deploy the Credentials File

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

### Step 6: Activate in the App

1. Log in to DRDB as an **Admin**.
2. Go to **Settings**.
3. Click **Setup Google Account** (for lab email) or **Setup Admin Account** (for admin email).
4. A Google sign-in window will open — authorize with the intended Gmail account.
5. Paste the authorization code back into the dialog in DRDB.
6. On success, the email address will appear next to the setup button.

### Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` | The redirect URI sent by the server doesn't match any URI registered in Google Cloud Console. | Add the exact URI (e.g., `https://yourdomain.com/oauth/callback`) to **Authorized redirect URIs** in the Cloud Console, and ensure `credentials.json` contains it. |
| `403: access_denied` | The consent screen is in "Testing" mode and the email is not listed as a test user. | Add the email to **Test users** in the OAuth consent screen, or publish the app. |
| `invalid_client` | The `client_id` or `client_secret` in `credentials.json` is wrong or the credential was deleted. | Re-download the JSON from Google Cloud Console. |

---

## Backend Environment Variables

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
AI_PROVIDER=local                # default/recommended: lab's OpenAI-compatible NInfer server
AI_TIMEOUT_MS=15000
LOCAL_LLM_BASE_URL=http://<host>:8080/v1
LOCAL_LLM_MODEL=Qwen3.8-27B
LOCAL_LLM_ENABLE_THINKING=false

AI_EMAIL_ENABLED=false
AI_EMAIL_ALLOW_REAL_DATA=false

AI_FAMILY_SUMMARY_ENABLED=false
AI_FAMILY_SUMMARY_ALLOW_REAL_DATA=false

# For Ollama or Groq instead of the local NInfer server, see server/.env.example.
```

Set `AI_EMAIL_PROVIDER` or `AI_FAMILY_SUMMARY_PROVIDER` to override the
provider for just that one feature without changing `AI_PROVIDER` globally.

> [!NOTE]
> `FRONTEND_URL` controls the CORS allowed origins. Set it to your production domain. Multiple origins can be comma-separated (e.g., `https://yourdomain.com,http://localhost:5173`).

---

## Docker deployment

This guide is for developmental researchers who have little experience setting up
software. Follow steps 1–6 to try DRDB on your own Mac or Windows computer.
**If your lab already runs DRDB, ask your lab manager for its website address and
an account; you do not need to install it yourself.**

Docker runs the website and its database together. You do not need to install
Node.js, MySQL, or Nginx separately. Keep an internet connection available for
the initial download and build. Start with fictional participant records while
you learn the system. For an existing lab database, use the
[system migration instructions](#full-system-migration) rather than entering it
again into a new installation.

### 1. Download DRDB

1. Open the [DRDB repository on GitHub](https://github.com/naiqixiao/DRDB).
2. Click the green **Code** button, then **Download ZIP**.
3. Extract the ZIP: on Windows, right-click it and choose **Extract All**; on
   Mac, double-click it.
4. Move the extracted folder (usually `DRDB-main`) somewhere easy to find,
   such as your **Documents** folder. Open it and check that you can see
   `README.md`, `docker-compose.yml`, `client`, and `server`. This is the
   **DRDB folder** used in the following steps. Do not work inside the ZIP.

If you already use Git, you can instead run `git clone https://github.com/naiqixiao/DRDB.git`
and use the resulting `DRDB` folder. Git is optional for the ZIP method.

### 2. Install Docker Desktop

Choose the instructions for your computer:

- **Mac:** Follow the [official Mac installation guide](https://docs.docker.com/desktop/setup/install/mac-install/).
  Under **Apple menu → About This Mac**, check whether your computer has an
  Apple chip (such as M1 or M2) or an Intel processor, then download the matching
  installer. Open the downloaded `.dmg`, drag Docker to **Applications**, and
  open **Docker** from Applications.
- **Windows:** Follow the [official Windows installation guide](https://docs.docker.com/desktop/setup/install/windows-install/).
  Run the installer and follow its prompts. Use the **WSL 2** backend when
  offered. If it asks you to install/update WSL or restart, complete those steps
  and then open **Docker Desktop**. DRDB uses Linux containers; if Docker is
  using Windows containers, switch it to Linux containers.
- **Linux or a university server:** Ask your IT team to install
  [Docker Engine and the Compose plugin](https://docs.docker.com/engine/install/),
  then continue with the command-line steps below.

Wait until Docker Desktop says its engine is running. Keep Docker Desktop
running whenever you use this local DRDB installation. If your university
computer prevents installation, ask IT to help.

### 3. Open a command window in the DRDB folder

A command window lets you give the computer short written instructions. Paste
one command at a time and press **Enter**. Copy only the text inside the code
boxes, without the surrounding backticks.

**Mac:** Open **Terminal** (search for it with Spotlight). Type `cd `, including
the space, then drag the DRDB folder from Finder into Terminal and press Enter.
`cd` means “change folder.”

**Windows:** Open the DRDB folder in File Explorer. Click its address bar, type
`powershell`, and press Enter. A PowerShell window opens in that folder.

Check Docker is installed:

```text
docker --version
docker compose version
```

Both commands should display version numbers. Check you are in the correct folder:

```text
ls
```

You should see `docker-compose.yml` in the list. Run all remaining Docker
commands from this same folder.

### 4. Create your settings file

The settings file stores passwords and the address of your installation.
**Do this once for a new installation; do not overwrite an existing `.env`.**

On **Mac** (or Linux), run:

```bash
cp .env.example .env
nano .env
```

This opens a simple text editor in Terminal. Use the arrow keys to move around.
After making the changes below, press **Control + O**, then **Enter** to save,
and **Control + X** to close the editor.

On **Windows**, run:

```powershell
Copy-Item .env.example .env
notepad .env
```

After making the changes below, choose **File → Save** and close Notepad.
The filename must stay exactly `.env`, not `.env.txt`.

Replace the text after `=` on these three lines with **three different random
values**, each at least 32 characters long. A password manager can generate and
store them. Using only letters and numbers avoids special-character issues in
this settings file. Do not copy the placeholder values as your passwords.

| Setting | What it does |
|---|---|
| `DB_PASS` | Protects the database account used by DRDB. |
| `DB_ROOT_PASS` | Protects the database administrator account. |
| `JWT_KEY` | Secures DRDB sign-in sessions. |

For a first trial on your own computer, leave these lines as they are:

```env
DB_USER=drdb
FRONTEND_URL=http://localhost:8080
URL=http://localhost:8080
HTTP_PORT=8080
TIMEZONE=America/Toronto
```

Change `TIMEZONE` if your lab is elsewhere, for example `Europe/London`.
Leave the optional AI features disabled for your first setup. Docker reads the
`.env` in the **DRDB folder**, not `server/.env`. Keep this file private and do
not upload it to GitHub. These settings passwords are separate from the account
password you will use to sign in to the website.

### 5. Start DRDB

With Docker Desktop running, enter:

```text
docker compose up --build -d
```

The first run downloads software and builds DRDB, which may take several minutes.
Wait for the command prompt to return, then check the services:

```text
docker compose ps
```

You should see `database`, `backend`, and `frontend` running; the database should
be marked `healthy`. Allow another minute for startup if needed.

Open [http://localhost:8080](http://localhost:8080) in your web browser. You should
see the DRDB sign-in page. “localhost” means **this computer**; it does not give
colleagues access from their own computers. You can close the command window
once DRDB is running.

The database is created automatically on the first run. Its contents are stored
in a Docker **volume** (persistent storage), so stopping the app does not erase
records. Initialization scripts run only when that database volume is first created.

### 6. Sign in for the first time

For a **new Docker installation using the included database template**, sign in with:

- **Email:** `admin@drdb.com`
- **Password:** `password`

Immediately open **Settings → Change Password** and replace this shared default
password with a strong password of your own. Update the administrator's details
and lab settings before entering participant records or sharing access.

An imported database uses its existing accounts instead. The separate
empty-database backend seeder uses `admin@example.com` / `admin` and a setup
wizard; that is a different initialization path from this Docker template.

### 7. Stop and start DRDB later

To stop DRDB without deleting your records, open a command window in the DRDB
folder and run:

```text
docker compose stop
```

To use it again, first open Docker Desktop, then run:

```text
docker compose start
```

Return to [http://localhost:8080](http://localhost:8080). After a computer restart,
open Docker Desktop and check DRDB is running; use the start command if needed.

**Do not delete Docker volumes or use Docker Desktop's factory reset to fix a
problem.** They can erase your database. See [database safety](#upgrades-and-database-safety).

### Troubleshooting Docker setup

| What you see | What to try |
|---|---|
| `docker` is not recognized or `command not found` | Finish installing Docker Desktop, then close and reopen Terminal or PowerShell. |
| `Cannot connect to the Docker daemon` | Open Docker Desktop and wait for its engine to finish starting. |
| `no configuration file provided` | Your command window is in the wrong folder. Repeat step 3 and check that `ls` lists `docker-compose.yml`. |
| An error asks you to set `DB_PASS`, `DB_ROOT_PASS`, or `JWT_KEY` | Check that you saved `.env` in the DRDB folder, with those values filled in, and that it is not named `.env.txt`. |
| Port 8080 is already in use | In `.env`, change `HTTP_PORT` to `8081` and both `FRONTEND_URL` and `URL` to `http://localhost:8081`. Run `docker compose up -d`, then open `http://localhost:8081`. |
| Browser says it cannot connect | Run `docker compose ps`. Wait for startup; if services are missing or stopped, run `docker compose up -d`. |
| A service keeps restarting or the database is unhealthy | Run `docker compose logs --tail=50 database backend frontend` and ask your lab's IT contact for help with the error. Remove participant details and secrets before sharing logs. |

Changing the database passwords in `.env` after the first run does not change
passwords already stored in the database. If you need to change them, ask IT for
help updating both places rather than deleting the volume.

### Connect Google and share with your lab

Google Calendar and Gmail require additional setup. Once the local website
works, follow [Google OAuth setup](#google-oauth-setup). For this Docker trial,
register `http://localhost:8080/oauth/callback` as the redirect URI (use port
8081 instead if you changed it above). Save the downloaded credentials as
`server/api/google/general/credentials.json` inside the DRDB folder.

With the backend running, copy that file into Docker. This command works in
Mac Terminal and Windows PowerShell:

```text
docker compose cp server/api/google/general/credentials.json backend:/app/api/google/general/credentials.json
```

Then complete the Google account connection in DRDB's **Settings**. Credentials
and the resulting Google sign-in tokens are saved in persistent Docker storage.
Keep credentials, tokens, and `.env` private.

For a shared lab installation, ask IT to provide an always-on computer/server,
a website address, HTTPS, and regular backups. Set `FRONTEND_URL` and `URL` to
that website address in the root `.env`, and register its Google callback URL.
The included Compose file does not configure HTTPS certificates; IT should
place an HTTPS reverse proxy in front of the frontend. Keep the trial on a
trusted network until the default administrator password has been changed.

### Upgrades and database safety

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

Create a backup before every upgrade. These backup/restore commands are for
Mac/Linux shells (or Windows WSL/Git Bash); ask IT to handle backups if you use
PowerShell. Replace `YYYY-MM-DD` with today's date, check that the command succeeds
and that the backup can be restored, and copy it to approved secure storage on
a different computer. A database dump does not include uploaded files or Google
credentials; use [full system migration](#full-system-migration) to export those too:

```bash
docker compose exec -T database sh -c 'exec mariadb-dump --single-transaction -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"' > drdb-backup-YYYY-MM-DD.sql
```

To restore into a deliberately empty database volume:

```bash
docker compose exec -T database sh -c 'exec mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"' < drdb-backup-YYYY-MM-DD.sql
```

The compose file also persists Google credentials/tokens, branding uploads,
and generated statistics independently of backend images. For an internet
deployment, place a TLS-capable reverse proxy in front of port 8080 (or expose
that port only on a private network); this compose file intentionally does not
ship TLS certificates.

### Full system migration

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

## Automated Schedule

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

## Recruitment & Scheduling Rules

- **Locking:** When a family is scheduled for a study, they are locked to that lab to prevent double-booking across labs.
- **Auto-Release:** Families are automatically released when:
  - Their confirmed appointment has passed and is marked completed.
  - A tentative schedule has had no update for 2 weeks (auto-rejected).
- **Completion:** Schedules move to "Completed" status automatically based on appointment time and confirmation status.

### Family participation availability

Select **Online studies only** when adding or editing a family that cannot attend
in-person studies. The flag appears in family details and recruitment, and applies
to all children in that family. Recruitment searches automatically exclude flagged
families for every study type except **Online**. Online searches include both flagged
and unflagged families. Eligible study suggestions apply the same rule.

Family search also has a **Participation availability** filter: **In person** excludes
flagged families, **Online studies only** finds flagged families, and a blank filter
includes all families.

Existing families default to an unchecked flag; notes are not converted automatically.
The server adds the `Family.OnlineStudyOnly` column on startup if it is missing.
If the database user cannot alter tables, apply
[`MySQL/migrate_online_study_only.sql`](MySQL/migrate_online_study_only.sql) once before
starting the updated server. New Docker databases include the column automatically.
