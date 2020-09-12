Study schedule related tables
=================================

Schedule table
-------------------
**Schedule** table stores informations about schedules of participation, which represents the visit of a family.

Table colums
^^^^^^^^^^^^^^^^^^^^^^^^^

**AppointmentTime**: *the date and time of a study schedule*
    Type: datetime
**Status**: *the status of a schedule*
    Type: enum('Confirmed','TBD','Rescheduling','Rescheduled','No Show','Cancelled','Rejected')
**FK_Family**: *id of the family*
    Type: int
**Reminded**: *whether a reminder email is sent*
    Type: int
**ThankYouEmail**: *whether a thank you email is sent*
    Type: int
**Note**: *note about the visit*
    Type: text
**Completed**: *whether the schedule is completed*
    Type: tinyint
**ScheduledBy**: *id of the lab member who scheduled the family*
    Type: int
**eventURL**: *Google calendar event URL*
    Type: varchar(150)
**calendarEventId**: *id of theGoogle calendar event*
    Type: varchar(30)

Appointment table
-------------------
**Appointment** table stores information about specific study appointment within each schedule. There can be multiple study appointments within a study schedule, involving multiple studies and/or multiple children within a family.

Table colums
^^^^^^^^^^^^^^^^^^^^^^^^^

**FK_Study**: *id of the study*
    Type: int
**FK_Child**: *id of the child (participant)*
    Type: int
**FK_Schedule**: *id of the study schedule*
    Type: int
**FK_Family**: *id of the family*
    Type: int


Experimenter Assignment table
---------------------------------------
**Experimenter Assignment** table stores the study assignment that a lab member is assigned as an experimenter.

Table colums
^^^^^^^^^^^^^^^^^^^^^^^^^
**FK_Experimenter**: *id of a lab member*
    Type: int
**FK_Appointment**: *id of the study appointment that this member is assigned to*
    Type: int
