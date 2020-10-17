Participant related table
===========================

Family table
-------------------
**Family** table stores family related information, including contact information, parents' demographic information, and some recruitment/participation notes.

Table colums
^^^^^^^^^^^^^^^^^^^^^^^^^

**NameMom**: *mother's (or primary caregiver's) name*
    Type: varchar(30)
**NameDad**: *father's (or secondary caregiver's) name*
    Type: varchar(30)
**Email**: *email address*
    Type: varchar(40)
**Phone**: *phone number*
    Type: varchar(10)
**RacePrimary**: *mother's (or primary caregiver's) race*
    Type: varchar(20)
**RaceSecondary**: *father's (or secondary caregiver's) race*
    Type: varchar(20)
**LanguagePrimary**: *mother's (or primary caregiver's) mostly used language*
    Type: varchar(20)
**LanguageSecondary**: *father's (or secondary caregiver's) mostly used language*
    Type: varchar(20)
**EnglishPercent**: *percentage of english spoken at home*
    Type: int
**Note**: *notes about the family*
    Type: text
**Vehicle**: *vehicle descriptions*
    Type: text
**Address**: *home address or postal code*
    Type: text
**LastContactDate**: *the date the family is contacted by us*
    Type: date
**NextContactDate**: *the earliest date this family will show up in the search for eligible participants on the Schedule Page*
    Type: date
**NextContactNote**: *the nature for the next contact, such as to follow up a undecided study schedule*
    Type: text
**RecruitmentMethod**: *how this family was recruited*
    Type: varchar(30)
**AssignedLab**: *id of lab, which has an on-going study with this family*
    Type: int
**CreatedBy**: *id of the lab member who created this family record*
    Type: int
**UpdatedBy**: *id of the lab member who updated this family's inforamtion*
    Type: int
**NoMoreContact**: *should this family be contacted in the future*
    Type: int

Child table
------------------------
**Child** table stores child related information.

Table colums
^^^^^^^^^^^^^^^^^^^^^^^^^

**Name**: *name of the child*
    Type: varchar(30)
**Sex**: *biological sex of the child*
    Type: enum('F','M')
**DoB**: *date of birth*
    Type: date
**Age**: *age in days*
    Type: int
**Language**: *mostly spoken language*
    Type: varchar(45)
**IdWithinFamily**: *code for the child within a family, such as a, b, c,& d*
    Type: varchar(1)
**HearingLoss**: *whether this child has hearing loss*
    Type: int
**VisionLoss**: *whether this child has vision loss*
    Type: int
**PrematureBirth**: *whether this child was born prematurely*
    Type: int
**Illness**: *whether this child has any illness*
    Type: int
**BirthWeight**: *birth weight*
    Type: int
**Note**: *notes for this child*
    Type: text
**FK_Family**: *id of the family this child belongs to*
    Type: int


Sibling table
------------------------
**Sibling** table stores the kinships among children.

Table colums
^^^^^^^^^^^^^^^^^^^^^^^^^

**FK_Child**: *id of a child*
    Type: int
**Sibling**: *id of the sibling of this child*
    Type: int

Conversations table
------------------------
**Conversations** table stores important conversations with a family. These conversation will help future communication with this family.


Table colums
^^^^^^^^^^^^^^^^^^^^^^^^^

**Conversation**: *content of a conversation*
    Type: text
**Time**: *the date when this conversation is stored*
    Type: datetime
**FK_Family**: *id of the family this conversation relates to*
    Type: int
