# DRDB system from PNB, McMaster University

This is an open source system to manage participant database, study, study schedules, and research personnel.

Please check installation instruction and detailed introductions here: https://drdb.readthedocs.io

# Future features
## study relations
- The eligible participants for a study may depend on whether a child participated in other studies. For a longitudinal study, participants have to finish the 1st task before doing the second one. Alternatively, participants are not be eligible for participation because their prior participation in other studies.
how studies are related, such as longitudinal studies?
- we will need to update the mySQL database to present the relations between studies.
- set up interval between studies, e.g., 3 months after the 1st participation

## multiple age groups
- studies can have multiple age groups, set up with a list of minAge and maxAge
- when scheduling, researchers can choose one or multiple age groups

## local resident identifier
- need to identify whether families live close to campus
- filter out families who don't live close

## family info correction
- button to show the families/children need to be updated
- icon to indicate there are families needed to be updated

## misc.
- selecting participants based on their borned year, instead of age.
