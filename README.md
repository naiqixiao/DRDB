# DRDB system from PNB, McMaster University

This is an open source system to manage participant database, study, study schedules, and research personnel.

You will find some demo videos to illustrate how we use the system to help our research here: https://mcmaster-baby-lab.github.io/handbook/DRDB

Please check installation instruction and detailed introductions here: https://drdb.readthedocs.io

# Recent Updates (V3.0.0 & Beyond)
- **V3.0.0 Major UI & Platform Upgrade:** The client has been completely rebuilt using Vue 3, Vite, and a professional, cohesive UI framework (`ui-ux-pro-max`).
- **Testing Rooms Integration:** Create dedicated testing rooms (e.g., Eye Tracking, fNIRS) linked to independent Google Calendars for streamlined logistics.
- **Advanced Study Logistics:** Studies now support complex prerequisites, exclusions, multiple age groups, and condition-specific health criteria (ASD, Premature, Vision/Hearing loss).
- **Automated Email Management:** Email templates (Confirmation, Reminder, Follow-up) are now generated natively per study and organized via tags in Google Workspace.

# Tech Stack Structure

- **Backend (`server/`)**: Express.js REST API with Sequelize ORM (MySQL). Interacts heavily with Google APIs (Calendar, Email) for seamless daily logistics.
- **Frontend (`client/`)**: A modern Single Page Application built with Vue 3 (Composition API), Vite, Pinia for state management, and Tailwind CSS (utility classes) for rapid UI styling. 
  - **Customization**: A detailed guide on changing colors, logo, and fonts is available in [client/README.md](client/README.md).

To start the development server for the new client:
```bash
cd client
npm install
npm run dev
```

# Periodic Automated Processes Schedule
The following task can be customized in **server/server.js**.

## Study Schedule Management
- **00:15 AM**: The system will update study schedules as follows:
  - **Confirmed** study schedules from two days prior will be marked as ***Completed***.
  - **Tentative** study schedules that have not been updated for two weeks will also be marked as ***Rejected*** and ***Completed***.
  - **Rejected** study schedules will be finalized and marked as ***Completed***.

## Email Reminders
- **04:00 PM**: Reminder emails will be sent to experimenters about their studies scheduled for the following day.
- **05:00 PM**: Reminder emails will be dispatched to parents regarding their upcoming studies for the next day.
- **09:30 AM**: Primary experimenters will receive reminders about their past studies being marked as ***Completed***.
- **09:35 AM**: Recruiters will be reminded to follow up with families they previously contacted. Without follow-up, tentative study schedules will be marked as ***Rejected*** in one week.

## Participant Availability and Data Maintenance
- **06:00 AM**: Families linked to ***Completed*** study schedules will be made available for new studies.
- **00:05 AM**: Children's ages in the system will be updated to reflect their current age.


# Automated Rules
- Whenever a schedule is created, the family is assigned to a lab.
    - And a warning will appear when this family is searched. 
    - This family will not appear in search for elegible families for any other studies.
- Study schedules will be marked as **Completed**, if
    - With a **Confirmed** appointment:
        - Release if their studies were completed (appointment time has passed and the status was Comfirmed).
        - NOT release, if there appointments are in the future.
    - With a **Tentative** appointment:
        - Release, if the last contact happened **two weeks** ago.
            - they haven't responded to previous recruitment email for 2 weeks (based on updatedAt).
        - NOT release, if they were contacted within **2 weeks**.
            - they don't have any upcoming studies (including pending schedules) or was not previously contacted within 2 weeks.

- Alternatively, families will be release if their schedules are **Completed**.

- Schedules will be marked **Completed**, if there is no update for 2 weeks. Related families will be released.

- If we don't follow up with the pending families for **two weeks**, we will release them. And the schedule will be marked as rejected.

Q: when we choose noshow or cancel, should we just label the status as **Rescheduling**? We might as well just keep the no-show or cancel in a log file
Q: whats the value having the status of **Rescheduled**?