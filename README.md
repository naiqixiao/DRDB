# DRDB system from PNB, McMaster University

This is an open source system to manage participant database, study, study schedules, and research personnel.

You will find some demo videos to illustrate how we use the system to help our research here: https://mcmaster-baby-lab.github.io/handbook/DRDB

Please check installation instruction and detailed introductions here: https://drdb.readthedocs.io

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
