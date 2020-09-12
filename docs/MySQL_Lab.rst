Lab related table
==================

Lab table
-------------------
**Lab** table stores general information of a lab.

Table colums
^^^^^^^^^^^^^^^^^^^^^^^^^

**LabName**: *name of a lab*
    Type: varchar(45)
**PI**: *name of the PI*
    Type: varchar(45)
**Email**: *lab's email, used to send emails to parents*
    Type: varchar(45)
**EmailOpening**: *the opening sentences of the emails to parents, which includes a placeholder for mother's name*
    Type: mediumtext
**EmailClosing**: *the closing sentences of the emails to parents*
    Type: mediumtext
**Location**: *the location of the lab, used in the location fielf of Calendar events*
    Type: mediumtext
**TransportationInstructions**: *instructions for parents coming to the lab, which will be show up in the emails to parents*
    Type: mediumtext


Study table
--------------
**Study** table stores study information and participant criteria.

Table colums
^^^^^^^^^^^^^^^^


**StudyName**: *name of a study*
    Type: varchar(45)
**Description**: *summary of the study, which is used as a script to explain the study to parents. The study description will also send to parents, if they express interests in participation*
    Type: text
**EmailTemplate**: *email template of the study, which includes placeholders for child's name and pronouns*
    Type: text
**Completed**: *whether data collection of this study is paused or completed*
    Type: int
**FK_Lab**: *id of the lab that this study belongs to*
    Type: int
**FK_Personnel**: *personnel id of the contact person of this study*
    Type: int
**StudyType**: *study type*
    Type: enum('Behavioural','EEG/ERP','EyeTracking','fNIRS')
**MinAge**: *study criterion, the youngest age in months of eligible participants*
    Type: decimal(5,2)
**MaxAge**: *study criterion, the oldest age in months of eligible participants*
    Type: decimal(5,2)
**PrematureParticipant**: *study criterion, should prematurely borned participants be included into the study? Include, Exclude, or Only recruit participants with premature birth*
    Type: enum('Include','Exclude','Only')
**VisionLossParticipant**: *study criterion, should vision impaired participants be included into the study? Include, Exclude, or Only recruit participants with vision deficit*
    Type: enum('Include','Exclude','Only')
**HearingLossParticipant**: *study criterion, should hearing impaired participants be included into the study? Include, Exclude, or Only recruit participants with hearing deficit*
    Type: enum('Include','Exclude','Only')
**IllParticipant**: *study criterion, should participants with illness be included into the study? Include, Exclude, or Only recruit participants with illness*
    Type: enum('Include','Exclude','Only')


Personnel table
-------------------
**Personnel** table stores information about lab members.

Table colums
^^^^^^^^^^^^^^^^^^^^^^^^^

**Name**: *name of the lab member*
    Type: varchar(45)
**Initial**: *name initials*
    Type: varchar(45)
**Role**: *role in the lab*
    Type: enum('Admin','PostDoc','PI','GradStudent','Undergrad','RA','Lab manager','Staff')
**Email**: *email address, used as login id*
    Type: varchar(45)
**Calendar**: *Google calendar address*
    Type: varchar(100)
**Phone**: *phone number*
    Type: varchar(10)
**Password**: *encrypted login password*
    Type: varchar(255)
**FK_Lab**: *id of the lab that this member belongs to*
    Type: int
**Active**: *whether this member is available to run participants*
    Type: int
**temporaryPassword**: *whether the lab member needs to update password*
    Type: tinyint


Experimenter table
--------------------
**Experimenter** table stores the study a lab member is assigned to.

Table colums
^^^^^^^^^^^^^^^^^^^^^^^^^
**FK_Experimenter**: *id of a lab member*
    Type: int
**FK_Study**: *id of the study that this member is assigned to*
    Type: int



Experimenter Assignment table
-------------------
**Experimenter Assignment** table stores the study assignment that a lab member is assigned as an experimenter.

Table colums
^^^^^^^^^^^^^^^^^^^^^^^^^
**FK_Experimenter**: *id of a lab member*
    Type: int
**FK_Appointment**: *id of the study appointment that this member is assigned to*
    Type: int
