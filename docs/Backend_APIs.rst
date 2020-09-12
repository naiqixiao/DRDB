Backend REST APIs
====================================================================

Family API
----------------

- Create a family
   - method: **POST /api/family/add**
   - description: create a new family
   - request example:
   - response example: 

- Create multiple families
   - method: **POST /api/family/addBatch**
   - description: create multiple new families
   - request example:
   - response example: 

- Update family information
   - method: **POST /api/family**
   - description: update the information of a family
   - request example:
   - response example: 

- Search families
   - method: **GET /api/family**
   - description: search families based on criteria
   - request example:
   - response example: 

- Delete a family
   - method: **DELETE /api/family**
   - description: delete a family from the database
   - request example:
   - response example: 

Child API
----------------

- Create a child
   - method: **POST /api/child/add**
   - description: add a child to a family
   - request example:
   - response example: 

- Update child information
   - method: **POST /api/child**
   - description: update the information of a child
   - request example:
   - response example: 

- Search children
   - method: **GET /api/child**
   - description: search children based on criteria
   - request example:
   - response example: 

- Update sibling information
   - method: **GET /api/child/siblings**
   - description: update the sibling information of a child
   - request example:
   - response example: 

- Delete a child
   - method: **DELETE /api/child**
   - description: delete a child from the database
   - request example:
   - response example: 

Conversation API
------------------

- Create a conversation
   - method: **POST /api/conversation/**
   - description: add a conversation
   - request example:
   - response example: 

- Delete a child
   - method: **DELETE /api/conversation**
   - description: delete a conversation record from the database
   - request example:
   - response example:

Lab API
----------------

- Create a lab
   - method: **POST /api/lab/add**
   - description: create a new lab 
   - request example:
   - response example: 

- Update lab information
   - method: **POST /api/**
   - description: update the information of a lab
   - request example:
   - response example: 

- Delete a lab
   - method: **DELETE /api/lab**
   - description: delete a lab from the database
   - request example:
   - response example: 

Personnel API
------------------

- Create a lab member
   - see "Register" in the User API

- Update lab member information
   - method: **POST /api/personnel**
   - description: update the information of a lab member
   - request example:
   - response example: 

- Search lab members
   - method: **GET /api/personnel**
   - description: search lab members based on criteria
   - request example:
   - response example: 

- Delete a lab member
   - method: **DELETE /api/personnel**
   - description: delete a lab member from the database
   - request example:
   - response example: 


User API
------------------

- Register a lab member
   - method: **POST /api/user/signup**
   - description: create a new lab member
   - request example:
   - response example:

- Login to the system
   - method: **POST /api/user/login**
   - description: login to the system
   - request example:
   - response example:

- Login check
   - method: **POST /api/user/checklogin**
   - description: check whether the user is already logged in
   - request example:
   - response example:

- Update login password
   - method: **POST /api/user/changePassword**
   - description: update login password
   - request example:
   - response example:

- Reset login password
   - method: **POST /api/user/resetPassword**
   - description: reset login password to a random one, if a user forgets his/her password
   - request example:
   - response example:


Study API
--------------------

- Create a study
   - method: **POST /api/study/add**
   - description: create a new study 
   - request example:
   - response example: 

- Update study information
   - method: **POST /api/study**
   - description: update the information of a study
   - request example:
   - response example: 

- Search studies
   - method: **GET /api/study**
   - description: search studies based on criteria
   - request example:
   - response example: 

- Delete a study
   - method: **DELETE /api/study**
   - description: delete a study from the database
   - request example:
   - response example:


Study assignment API
----------------------------

- Create eligible experimenters for a study
   - method: **POST /api/experimenter/experimenter**
   - description: assign experimenters to a study 
   - request example:
   - response example: 

- Assign a study to a lab member
   - method: **POST /api/experimenter/studies**
   - description: assign a study to lab members 
   - request example:
   - response example: 


Schedule API
----------------------------

- Create a study schedule
   - method: **POST /api/schedule/add**
   - description: add a study schedule
   - request example:
   - response example: 

- Update study schedule information
   - method: **POST /api/schedule**
   - description: update the information of a study schedule
   - request example:
   - response example: 

- Send a reminder email for an upcoming schedule
   - method: **POST /api/schedule/remind**
   - description: send a reminder email for an upcoming schedule
   - request example:
   - response example: 

- Mark a study schedule is completed
   - method: **POST /api/schedule/complete**
   - description: mark a study schedule is completed
   - request example:
   - response example: 

- Search study schedules
   - method: **GET /api/schedule**
   - description: search study schedules based on criteria
   - request example:
   - response example: 

- Search study schedules
   - method: **GET /api/schedule/today**
   - description: search today's study schedules
   - request example:
   - response example: 

- Search study schedules within this week
   - method: **GET /api/schedule/week**
   - description: search study schedules from the Monday to the Sunday of this week
   - request example:
   - response example:

- Delete a study schedule
   - method: **DELETE /api/schedule**
   - description: delete a study schedule from the database
   - request example:
   - response example: 

Appointment API
----------------------------

- Create a study appointment
   - method: **POST /api/appointment/add**
   - description: add a study appointment to a study schedule
   - request example:
   - response example: 

- Update a study appointment
   - method: **POST /api/appointment**
   - description: update the Experimenter information of a study appointment,
   - request example:
   - response example: 

- Delete a study appointment
   - method: **DELETE /api/appointment**
   - description: delete a study appointment from a study schedule
   - request example:
   - response example:


Experimenter API
----------------------------

- Assign experimenters to a study appointment
   - method: **POST /api/experimentAssignment**
   - description: assign lab members to a study appointment
   - request example:
   - response example: 


Google service API
--------------------------------

- Send an email
   - method: **POST /api/gmail/send**
   - description: send an email to parents from lab email
   - request example:
   - response example: 

- Create a calendar event
   - method: **POST /api/cal/**
   - description: add a Google Calendar event for a study schedule
   - request example:
   - response example:

- Update a calendar event
   - method: **PATCH /api/cal/**
   - description: update a Google Calendar event
   - request example:
   - response example:

- Delete a calendar event
   - method: **DELETE /api/cal/**
   - description: delete a Google Calendar event
   - request example:
   - response example:

- Create Google Credentials
   - method: **GET /api/extAPIs**
   - description: create Google Credentials for a lab
   - request example:
   - response example: 

- Setup a token for a Google account
   - method: **POST /api/extAPIs**
   - description: setup a token for a Google account used by a lab
   - request example:
   - response example: 

- Setup a token for adminstrator account
   - method: **POST /api/extAPIs/admin**
   - description: setup the Google account for adminstrator account
   - request example:
   - response example: 

- Retrieve email information for the Admina and lab account
   - method: **POST /api/extAPIs/email**
   - description: Retrieve email addresses and displayName for the Admina and lab account
   - request example:
   - response example: 


Feedback API
----------------------

- Create feedback
   - method: **POST /api/feedback**
   - description: send a feedback email to the adminstrator 
   - request example:
   - response example: 