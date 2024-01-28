# DRDB system from PNB, McMaster University

This is an open source system to manage participant database, study, study schedules, and research personnel.

You will find some demo videos to illustrate how we use the system to help our research here: https://mcmaster-baby-lab.github.io/handbook/DRDB

Please check installation instruction and detailed introductions here: https://drdb.readthedocs.io

# Recent update
- Organize emails with labels (in gmail). Whenever an email is sent out, the email will be labelled with study name. It would be very easy to tell which study an email belongs to.

# Future features

As we are moving back to in-person research, we realize the current system lacks a few key functions to reflect the complexity of our in-person studies. To bridge the gaps, we aim to improve the system in the following areas over the summer of 2023.

## Study relations
The eligible participants for a study may depend on whether a child participated in other studies. For a longitudinal study, participants have to finish the 1st task before doing the second one. Alternatively, participants are not be eligible for participation because their prior participation in other studies.
how studies are related, such as longitudinal studies?
- we will need to update the mySQL database to present the relations between studies.
- set up interval between studies, e.g., 3 months after the 1st participation

## Testing rooms (within a lab)
Each lab usually has multiple testing rooms. These rooms typically are used for specific research projects, such as eye tracking, neuroimaging, and obsrvational studies. To better organize study assignment (which room is used at the specific time), we need to include testing rooms under each lab. Here are few related functions:
- in MySQL, create a table of test rooms associate with lab table (many to one relation).
- each testing room includes the following columns:
    - name
    - description
    - Google calendar URL (each testing room will has its own Google Calendar, so study schecudules for each room is easy to see). This would change where Google Calendar URL is stored: currently is in with Lab table.
- each study needs to be assigned to a specific testing room (having a dropdown menu in Lab information creation/editing pop out window).

## Multiple age groups
- studies can have multiple age groups, set up with a list of minAge and maxAge
- when scheduling, researchers can choose one or multiple age groups

## Local resident identifier
- need to identify whether families live close to campus
- filter out families who don't live close

## Family info correction
- button to show the families/children need to be updated
- icon to indicate there are families needed to be updated

## Misc.
- selecting participants based on their borned year, instead of age.
- randomized the order of available studies when booking additional studies.
- set target sample size for each study, and show the completion percentage during booking (e.g., next to study button).

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