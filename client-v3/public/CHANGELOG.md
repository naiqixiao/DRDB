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
