### Release v3.1.0

DRDB 3.1.0 introduces two optional, human-reviewed AI assistants in the email workflow, plus secure Administrator-only full-system migration for moving an existing installation into a new Docker deployment.

#### AI-Assisted Email & Participation Insights
* **Suggest Personalization:** The email composer can generate a short, human-reviewed personalization paragraph and subject line for Introduction, Follow-up, and Thank You emails, based on a family's participation history.
* **Polish with AI:** Any email draft, of any type, can be reworded for clarity and tone with one click. The AI is instructed to change wording only — never facts, links, dates, or placeholders — and you always preview the result and choose to replace or discard it before it touches your draft.
* **Family Participation Summary:** Family Details now has an on-demand AI summary of a family's participation history, plus an advisory Likely / Uncertain / Unlikely assessment of their intention to participate, to help prioritize outreach.
* **Local-First AI:** Every AI feature defaults to a lab-hosted, OpenAI-compatible local model so participant data stays on the network. Cloud providers remain available but are restricted to training-set or de-identified data until explicitly approved.
* **Opt-in and Reversible:** Every suggestion requires an explicit accept before it changes a draft; nothing is sent automatically, nothing is persisted, and the original draft is always preserved if you dismiss a suggestion.

#### System Migration
* **Encrypted export:** Administrators can download a passphrase-protected `.drdb-migration` archive directly from Settings.
* **Complete system transfer:** Archives include the DRDB database, participant and scheduling records, system and lab settings, branding uploads, Google OAuth credentials/tokens, and runtime data.
* **Safe import:** Importing validates the archive and checksums, requires an explicit `REPLACE THIS SYSTEM` confirmation, and creates a pre-import backup before replacing the destination system.
* **Maintenance protection:** DRDB pauses scheduled jobs and temporarily blocks other API activity while an export or import is in progress, preventing migration races.

#### Docker Deployment
* **Persistent-state aware:** Migration works with the existing MariaDB and backend runtime volumes; no Docker socket access is required.
* **Database tooling included:** The backend image now includes the MariaDB command-line client used for consistent database export and restore.
* **Upgrade guidance:** Docker deployment documentation now describes rebuilding the backend image and handling migration archives securely.
* **AI configuration wiring:** AI feature settings (provider, endpoint, enablement) are now passed through to the backend service in `docker-compose.yml` alongside the existing database and auth configuration.

#### Security Notes
* Migration actions are authorized on the server using the current database role; hiding the Settings controls alone is not relied upon.
* Archives contain sensitive participant data, password hashes, and Google credentials. Store the archive and its passphrase separately in approved secure storage.
* Google may require reauthorization after import if the destination uses a different public URL.
* AI prompts and generated suggestions are never persisted, and real participant data is not sent to an AI provider until a lab explicitly enables it.

#### Verification
* Frontend production build completed successfully.
* Backend test suite completed successfully.

### Release v3.0.2

This release introduces a centralized, hierarchical timezone management system. You can now set a global system timezone or override it with lab-specific settings directly from the UI, ensuring all scheduled reminders and jobs run at the correct local time.

#### Timezone Management
* **Hierarchical Timezone Logic:** Implemented a tiered system where the configuration follows a Lab-specific > General system > Environment fallback priority.
* **General Timezone Setting:** Admins can now configure the system-wide default timezone from the new "System Settings" section.
* **Lab-specific Timezones:** Individual labs can now override the global default with their own local timezone in the Lab Profile settings.
* **Dynamic Job Rescheduling:** Scheduled tasks and reminders (Family Reminders, Auto-completion, etc.) automatically re-register themselves whenever a timezone setting is changed.
* **Visual Status:** The "Timezone" column in the Scheduled Tasks table now reflects the dynamic, effective timezone for each task.

#### Improvements
* **Settings UI:** Added a new "System Settings" section for Admins to manage global configurations securely from the frontend.
* **Database Stability:** Introduced a `SystemSetting` table for persistent global configuration and added a `Timezone` field to the `Lab` table.

#### Fixes
* **Async Job Resolution:** Fixed a `SyntaxError` and async handling issues in the job scheduler that could prevent task registration.
* **Login Sync:** Updated the login protocol to ensure the correct effective timezone is synced to the frontend state immediately.

### Release v3.0.1

This release focuses on search reliability and backend stability. We added true pagination with total counts to large search flows, made eligible-child ordering fairer and consistent, and reduced backend memory spikes in nightly jobs and reminder processing.

#### New Features
* **True Search Pagination:** Family, follow-up, appointment, and eligible-child searches now show real totals and page ranges instead of silently stopping at the first 100 records.
* **Eligible Child Rotation:** The Schedule page now uses a deterministic daily ordering for eligible children so the list rotates fairly while staying consistent for everyone on the same day.
* **Large Result Warnings:** Search screens now warn you when a result set is very large and suggest refining filters.

#### Scheduling
* **Appointment Search Pages:** Appointment search, quick date-range shortcuts, and follow-up results now support paging through the full result set.
* **Eligible Child Search:** The Schedule page now pages through eligible children across the full result pool instead of only showing the first batch.
* **Stable Family Ordering:** Family search results are now ordered consistently by newest family first so records do not jump between pages.

#### Design
* **Search Status Hints:** The Family and Schedule pages now display clearer result counts and ordering hints so users know what they are looking at.

#### Architecture
* **Batch Processing:** Reminder and nightly cleanup jobs now process records in smaller batches and use lighter queries to reduce memory pressure.
* **Bulk Updates:** Automated completion, rejection, and family-release jobs now update records in groups instead of loading full objects one at a time.
* **Search Hardening:** Several large backend search endpoints now paginate at the API level to avoid unbounded result loads.

### Release v3.0.0

DRDB v3 is a complete rewrite. We migrated the frontend to Vue 3 and built a new component library to fix the inconsistent UI issues from v2.

#### New Features
* **Multi-Age Group Criteria:** You can now set multiple age brackets for a single study, and filter participant searches by these specific ranges.
* **Study Prerequisites:** You can now require or block participants based on which studies they've already completed.
* **Duplicate Merging:** The Family page now detects duplicate family or child records and lets you merge them into a single master record.
* **Stats:** We added dashboards for overall study progress and individual researcher workloads.

#### Design
* **UI Rewrite:** We replaced the old ad-hoc styling with a unified component system to fix spacing and contrast issues.
* **Navigation:** The sidebar is wider and main pages now have sticky headers.
* **Interactions:** Added standard hover states and click feedback to buttons.

#### Teams
* **Role Badges:** Staff names now show color-coded tags based on their role (Admin, Grad Student, Undergrad).
* **Directory Sorting:** The staff list defaults to grouping people by their lab hierarchy.
* **Quick Profile:** Opening the Team page automatically pulls up your own info.
* **Assigned Studies:** Added direct links to the study management page and fixed how child age ranges are formatted.

#### Scheduling
* **Calendar Sync:** Rewrote the Google Calendar integration as a background service to fix syncing reliability.
* **Timeline UI:** Cleaned up the family history cards and medical condition tags.
* **Copy Contacts:** Added clipboard buttons next to emails and phone numbers.
* **Upcoming Appointments:** The dashboard now shows your next three scheduled visits.

#### Studies
* **Analytics:** Cleaned up the charts for recruitment metrics, drop-off rates, and workload.
* **Dialogs:** Standardized all modal windows so they share the same layout and button placements.

#### Architecture
* **Vue 3:** Migrated the entire frontend to Vue 3 (Composition API) and Vite.
* **Backend Cleanup:** Extracted scheduling and cron jobs out of the controllers and into their own background services.
* **API Docs:** Added Swagger for backend routes.
