# DRDB V2 to V3 Migration Guide

This guide provides step-by-step instructions to migrate your DRDB system from version 2 to version 3. The V3 update is a major upgrade introducing a completely rewritten Vue 3 frontend (`client`), enhanced study logistics (age groups, prerequisites), and testing room integrations.

> [!CAUTION]
> **Take a full backup before proceeding.** This major version includes significant database structure changes, particularly moving age requirements into separate tables.

---

## 1. Preparation & Backup

1. **Navigate to the application folder** and pull the latest code:
   ```bash
   cd ~/DRDB
   git pull
   ```

2. **Backup your existing database**:
   Replace `yourusername` and `DRDB` with your actual MySQL username and database name.
   ```bash
   mysqldump -u yourusername -p DRDB > ~/DRDB_v2_backup.sql
   ```

---

## 2. Database Upgrade

The upgrade changes how age ranges are stored and introduces `TestingRoom` records. **You must run the SQL scripts before starting the new backend/frontend.**

1. **Apply the general database patch (adds Testing Rooms & Event URLs)**:
   ```bash
   mysql -u yourusername -p DRDB < MySQL/databasePatch1.01.sql
   ```
   *(Enter your password when prompted.)*

2. **Migrate Study Age Groups & Logistics Requirements**:
   ```bash
   mysql -u yourusername -p DRDB < MySQL/migrate_age_groups.sql
   ```
> [!NOTE]
> The [migrate_age_groups.sql](file:///Users/naiqixiao/Documents/GitHub/DRDB/MySQL/migrate_age_groups.sql) script correctly shifts the `MinAge`/`MaxAge` values into the new `StudyAgeGroup` table to ensure no data is lost. It also creates the prerequisite and exclusion junction tables for advanced study logistics.

---

## 3. Google API Credentials
DRDB integrates with Google Calendar and Gmail. You must provide a valid `credentials.json` to enable these features.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services > Library** and enable both the **Google Calendar API** and **Gmail API**.
4. Go to **APIs & Services > OAuth consent screen** and configure it (typically for "Internal" use within your organization).
5. Go to **APIs & Services > Credentials**.
6. Click **Create Credentials > OAuth client ID**. (Choose "Desktop app" or "Web application", depending on how your backend handles the auth flow.)
7. Download the resulting JSON file and rename it to `credentials.json`.
8. Place the file in the backend directory at `server/api/google/general/credentials.json`.

---

## 4. Backend Upgrade (`server`)

The backend has updated dependencies to support the new database structure and features.

1. **Install new backend module dependencies**:
   ```bash
   cd ~/DRDB/server
   npm install
   ```

2. **Verify Environment Variables ([.env](file:///Users/naiqixiao/Documents/GitHub/DRDB/server/.env))**:
   Verify that your database configuration is appropriately set. While the old [config/general.js](file:///Users/naiqixiao/Documents/GitHub/DRDB/server/config/general.js) works, V3 also natively supports a [.env](file:///Users/naiqixiao/Documents/GitHub/DRDB/server/.env) file out-of-the-box. If utilizing [.env](file:///Users/naiqixiao/Documents/GitHub/DRDB/server/.env), ensure it is present in the `server` directory and has the expected keys:
   ```env
   JWT_KEY=your_secret
   DB_NAME=DRDB
   TIMEZONE=America/Toronto
   ```

3. **Restart the Backend Server**:
   Depending on your PM2 configuration name, restart the backend.
   ```bash
   pm2 restart server.js
   # Or, if your PM2 app is named differently (e.g., DRDB_v3):
   # pm2 restart DRDB_v3
   ```

---

## 5. Frontend Upgrade (`client`)

1. **Navigate to the new directory and install dependencies**:
   ```bash
   cd ~/DRDB/client
   npm install
   ```

2. **Build the Vue 3 application**:
   ```bash
   npm run build
   ```
   *This command will generate the production-ready application within the `~/DRDB/client/dist` directory.*

3. **Deploy the frontend artifacts to NGINX**:
   Assuming your NGINX web root for DRDB is located at `/var/www/html/DRDB`:
   ```bash   
   # Copy the newly built V3 artifacts over
   sudo cp -r -T dist /var/www/html/DRDB  
   ```

4. **Restart NGINX**:
   ```bash
   sudo systemctl restart nginx
   ```

---

## 6. Verification Checklist

1. **Access the Website**: Open the system URL. You should see the newly redesigned, modernized login page indicating the UI framework has changed.
2. **Verify the Backend**: Log in with an admin or researcher account. Success means the backend JWT validation and database connection are working.
3. **Check Study Requirements**: Go to an existing Study and check its age groups and requirements. The ages should reflect what was present in the V2 system.
4. **Monitor PM2 Logs**: Watch for any anomalies in the backend:
   ```bash
   pm2 logs
   ```

If you encounter unexpected errors immediately following the upgrade, check Nginx (`/var/log/nginx/error.log`) or your PM2 output for specific stack traces.
