Email Template
=========================

The DRDB system can send tailored emails to participants and lab managers to inform study schedules, reminders, etc.

To make the emailling system run properly, users need to setup several email templates in the system.



Email template components
--------------------------------
- Lab specific email components, which is set up in **Setting** page
    -  email opening (**currently not used**)
        a greeting message specific to the lab
    -  transportation instructions
        instructions for how to come to the lab
    -  email closing
        a closing message specific to the lab, such as "looking forward to seeing you!"

- Study specific email components, which is setup in **Study management** page
    -  email template
        a brief introduction of the study
    -  reminder template
        study specific reminder for participants, such as installing Zoom before an online study

Key words
--------------------------------
Key words, such as child's name and pronouns can be placed in email templates in the form of placeholders.
The key word placeholder has to follow **${{Key Word}}** format.

The available key words are:
    -  childName
    -  he/she
    -  him/her
    -  his/her

These key words will be replaced with corresponding information in generated emails.


Study scheduling emails
--------------------------------
- Structure
    -  email opening (no setting is available at the momemnt)
        - for confirming an appointment: "Thanks for your support to our research! This is a confirmation for your visit with ${{childName}} on ${{AppointTime}}."
        - for updating an appointment: "This is an update on your visit with ${{childName}} on ${{AppointTime}}."
        - to introduce a study to parents: We are ${{labName}}. We would love to have you and ${{childName}} to participate in our study. Here is the information about the study:"
    -  study specific email template
        - if there are more than one studies, each study's template will be presented in separate paragraphs.
    -  transportation instructions
    -  email closing

- When will the email be sent?
    -  during scheduling a study appointment
    -  after updating an existing study appointment

**Email example**

.. image:: /img/ScheduleEmailTemplate.jpeg
    :width: 70em

Reminder emails
--------------------------------
- Structure
    -  reminder opening (no setting is available at the momemnt)
        - in-person lab studies: "This is a reminder for your visit to ${{LabName}} with ${{childName}} on ${{AppointTime}}."
        - online studies: "This is ${{LabName}}. Just a reminder that you and ${{childName}} will participate our online study."
    -  reminder template
    -  transportation instructions (for in-person studies)
    -  email closing

- When will the email be sent?
    -  Everyday at 3pm, reminding emails will be sent to parents with appointments on the next day

- What if a participant doesn't have email in the system?
    An email will be sent to the lab email to remind researchers of calling the participant.

**Email example**

.. image:: /img/ReminderEmailTemplate.jpeg
    :width: 70em