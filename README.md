# DRDB — Developmental Research Database

An open-source system for managing participant databases, studies, study schedules, and research personnel.

- **Demo Videos:** [System Overview](https://mcmaster-baby-lab.github.io/handbook/DRDB)
- **Documentation:** [drdb.readthedocs.io](https://drdb.readthedocs.io)

---

# Recent Updates (V3.0.0)

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

> [!NOTE]
> `FRONTEND_URL` controls the CORS allowed origins. Set it to your production domain. Multiple origins can be comma-separated (e.g., `https://yourdomain.com,http://localhost:5173`).

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
