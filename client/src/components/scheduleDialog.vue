<!-- this is the component used to interface study schedules -->
<!-- including picking up schedule time, participated studies, experimenters involved -->
<!-- It also drafts emails and setup next contact date (so this family won't be contacted too frequently.) -->

<!-- In this UI, there will be three steps: determining schedule details, send email, and arrange next contact. -->

<!-- todo, return schedule object after creation / update. Parent component will use the output to update the frontend UI. -->
<template>
    <v-dialog :value="dialog" @input="onDialogClose" transition="dialog-bottom-transition">
        <v-card>

            <v-stepper v-model="stepperPage">
                <v-stepper-step step="1" :complete="stepperPage > 1">
                    Schedule a visit
                </v-stepper-step>

                <v-divider></v-divider>

                <!-- Step 1, choose appointment time, studies, experimenters, and leave a note. -->
                <v-stepper-content step="1">
                    <v-card>
                        <v-card-title>
                            Create / Update Study Schedule
                            <v-spacer></v-spacer>
                            <v-btn icon @click="close()">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-card-title>

                        <v-container>
                            <v-card-text>

                                <!-- Schedule date and time -->
                                <v-divider style="margin-bottom: 20px"></v-divider>
                                <dateTimePicker ref="dateTimePicker" :dateTimePickerDisable="dateTimePickerDisable"
                                    :appointmentTime="currentSchedule.AppointmentTime" />

                                <!-- Appointment Data Table -->
                                <v-divider style="margin-bottom: 20px"></v-divider>
                                <appointmentDetails ref="appointmentDetails" :Appointments="currentSchedule.Appointments"
                                    :Children="currentFamily.Children" :scheduleType="scheduleType"
                                    :parentResponse="parentResponse"
                                    @dateTimePickerDisableUpdate="dateTimePickerDisableUpdate"
                                    @newAppointment="addAppointment" @deleteCurrentAppointment="deleteCurrentAppointment"
                                    @readyToCreateSchedule="readyToCreateSchedule">
                                </appointmentDetails>

                                <!-- Notes for this schedule -->
                                <v-divider style="margin-bottom: 20px"></v-divider>
                                <h2 class="text-left" style="margin-right: 0px;">Notes for this schedule:</h2>
                                <v-container>
                                    <v-textarea filled class="conv-textarea" label="" outlined no-resize rows="3"
                                        hide-details v-model="Note"></v-textarea>
                                </v-container>
                            </v-card-text>
                        </v-container>

                        <!-- action buttons -->
                        <v-card-actions>
                            <v-container
                                style="display: flex; align-items: center; flex-wrap: wrap; justify-content: end; gap: 60px">
                                <v-btn @click="createSchedule()" :disabled="!scheduleEnable"
                                    :loading="loadingStatus"><v-icon left
                                        v-show="scheduleButtonIconShow">mdi-checkbox-circle-line</v-icon>{{
                                            scheduleButtonText }}</v-btn>
                                <v-btn @click="step12" :disabled="disableStep12">Next</v-btn>

                            </v-container>
                        </v-card-actions>

                    </v-card>

                </v-stepper-content>

                <v-stepper-step step="2" :complete="stepperPage > 2">
                    Email
                </v-stepper-step>

                <v-stepper-content step="2">

                    <v-card>
                        <v-card-title>

                            <v-spacer></v-spacer>
                            <!-- a possible dropdown menu to select the type of email. -->
                            <v-select hide-details filled dense outlined :items="emailOptions" v-model="emailType"
                                v-show="emailSelectionShow" label="Email Type "></v-select>
                            <v-spacer></v-spacer>
                            <v-btn icon @click="close()">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-card-title>

                        <v-container>

                            <v-card-text>
                                <!-- only the appointment with status "Update appointment time" or "Confirmed" will be included in the email. -->
                                <emailComponent ref="emailComponent" :dialog="emailDialog" :emailType="emailType"
                                    :appointments="emailAppointments" :appointmentTime="studyDateTime"
                                    :familyInfo="currentFamily"></emailComponent>
                            </v-card-text>
                        </v-container>
                        <v-card-actions>
                            <v-container
                                style="display: flex; align-items: center; flex-wrap: wrap; justify-content: end; gap: 60px">
                                <v-btn @click="sendEmail()"><v-icon left v-show="emailButtonIconShow"
                                        :loading="loadingStatus">mdi-checkbox-marked-circle</v-icon>{{ emailButtonText
                                        }}</v-btn>
                                <v-btn @click="stepperPage = 3" :disabled="disableStep23">Next</v-btn>

                            </v-container>
                        </v-card-actions>
                    </v-card>
                </v-stepper-content>

                <v-stepper-step step="3" :complete="stepperPage > 3">
                    Next Contact
                </v-stepper-step>

                <v-stepper-content step="3">
                    <v-card>
                        <v-card-title>
                            Set up next contact date. This family can be contacted after this date.
                            <v-spacer></v-spacer>
                            <v-btn icon @click="close()">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-card-title>

                        <v-container>

                            <v-card-text>
                                <v-divider style="margin-bottom: 20px"></v-divider>
                                <h2 class="text-left" style="margin-right: 0px;">Next contact after:
                                </h2>
                                <v-container
                                    style="display: flex; flex-wrap: wrap; justify-content: start; align-items: center; gap: 40px">
                                    <!-- <v-spacer></v-spacer> -->
                                    <v-text-field filled dense outlined ref="contactDate" label="Date (YYYY-MM-DD)"
                                        style="width: 30%" v-model="contactDate" :rules="$rules.dob" hide-details
                                        prepend-inner-icon="mdi-calendar" @click:prepend-inner="datePicker = true"
                                        @click="datePicker = true"></v-text-field>

                                    <h3>{{ daysLate }}</h3>
                                    <v-spacer></v-spacer>

                                </v-container>

                                <v-divider style="margin-bottom: 20px"></v-divider>
                                <h2 class="text-left" style="margin-right: 0px;">Note for future contact:
                                </h2>
                                <v-container
                                    style="display: flex; flex-wrap: wrap; justify-content: start; align-items: center; gap: 40px">

                                    <v-textarea filled class="conv-textarea" label="" outlined no-resize rows="3"
                                        hide-details v-model="nextContactNote"></v-textarea>

                                </v-container>

                            </v-card-text>
                        </v-container>
                        <v-card-actions>
                            <v-container
                                style="display: flex; align-items: baseline; flex-wrap: wrap; justify-content: end; gap: 40px">
                                <v-btn @click="close()">Complete</v-btn>

                            </v-container>
                        </v-card-actions>
                    </v-card>

                </v-stepper-content>
            </v-stepper>

            <v-dialog v-model="datePicker" max-width="290px">
                <v-card outlined>
                    <v-date-picker v-model="contactDate" show-current @click:date="datePick"></v-date-picker>
                </v-card>
            </v-dialog>

        </v-card>
    </v-dialog>
</template>
  
<script>
import dateTimePicker from '@/components/dateTimePicker.vue';
import appointmentDetails from '@/components/appointmentDetails.vue';
import emailComponent from '@/components/emailComponent.vue';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import moment from "moment";

// backend services
import schedule from "@/services/schedule";
import calendar from "@/services/calendar";
// import login from "@/services/login";
import appointment from "@/services/appointment";

export default {
    components: {
        dateTimePicker,
        appointmentDetails,
        emailComponent,
    },
    props: {
        dialog: Boolean,
        currentSchedule: Object,
        currentFamily: Object,
        scheduleType: String, // indicate if the current operation involes the creation or updating schedules.
        // create | update
        parentResponse: String, // response from caregivers when contacted: Confirmed | Interested | Left a message | Rejected. This variable will be assigned to each appointment in the schedule.
        dialogType: String, // schedule | email 

    },
    data: () => ({
        studyDateTime: null,
        dateTimePickerDisable: true,
        stepperPage: 1,
        contactDate: null,
        datePicker: false,
        scheduleEnable: false,
        Note: "",
        nextContactNote: "",
        emailDialog: false,
        emailAppointments: [],
        disableStep12: true,
        disableStep23: true,
        skipEmail: false,
        emailSelectionShow: false,
        emailUpdate: false,
        emailBody: "",
        emailSubject: "",
        editor: ClassicEditor,
        editorData: '<p>Content of the editor.</p>',
        editorConfig: {
            toolbar: {
                items: [
                    'undo', 'redo',
                    '|', 'heading',
                    '|', 'bold', 'italic', 'link',
                    '|', 'bulletedList', 'numberedList', 'outdent', 'indent'
                ]
            }
        },
        emailType: "",
        emailOptions: ['Confirmation', 'ScheduleUpdate', 'ScheduleUpdate', 'Reminder', 'Follow-up', 'ThankYou'],
        contactType: "",
        loadingStatus: false,
        scheduleButtonIconShow: false,
        scheduleButtonText: "Create appointment",
        emailButtonIconShow: false,
        emailButtonText: "Send email",
    }),
    methods: {

        deleteCurrentAppointment(index) {
            this.$emit(
                "deleteCurrentAppointment", index
            );
        },

        dateTimePickerDisableUpdate(val) {
            this.dateTimePickerDisable = val;
        },

        datePick() {
            this.datePicker = false;
            setTimeout(() => {
            }, 100);
        },

        addAppointment(appointment) {
            this.$emit("newAppointment", appointment);
        },

        readyToCreateSchedule(val) {
            console.log(val)
            this.scheduleEnable = val;
        },

        // the most important function.
        async createSchedule() {

            this.loadingStatus = true;

            // create/update schedules according to the appointment time, appointments, and other information.
            const newAppointments = this.$refs.appointmentDetails.generateAppointments();

            this.studyDateTime = this.$refs.dateTimePicker.studyDateTime();

            // create new schedule
            if (newAppointments.newAppointments.length > 0) {
                const newSchedule = await this.newSchedule(newAppointments.newAppointments);

                console.log(newSchedule)
                this.scheduleButtonText = "Appointment created!";

                this.$emit("newSchedule", newSchedule);

            }

            // update existing schedule
            if (newAppointments.updatedAppointments.length > 0) {
                const updatedSchedule = await this.updateSchedule(newAppointments.updatedAppointments);

                console.log(updatedSchedule)
                this.scheduleButtonText = "Appointment updated!";

                this.$emit("updatedSchedule", updatedSchedule);
            }

            // Complete the schedule if the status is "Completed".
            if (newAppointments.completedAppointments.length > 0) {
                await this.schedule.complete({
                    id: newAppointments.completedAppointments[0].FK_Schedule,
                    Completed: 1
                })

                this.$emit("completedSchedule", {
                    id: newAppointments.completedAppointments[0].FK_Schedule,
                    Completed: 1
                });
            }

            // delete the appointment previously scheduled in the current schedule.
            if (newAppointments.deletedAppointments.length > 0) {
                for (const app of newAppointments.deletedAppointments) {
                    await appointment.delete({ id: app.id });
                }
            }


            this.loadingStatus = false;
            this.scheduleButtonIconShow = true;

            // create the list of appointments to draft emails.
            this.emailAppointments = newAppointments.newAppointments.concat(newAppointments.updatedAppointments).filter(appointment => {
                return appointment.status === 'Confirmed' || appointment.status === 'Tentative' || appointment.status === 'Update appointment time' || appointment.status === 'No Show';
            });

            // if there is no email to send, skip the email step.
            if (this.emailAppointments.length === 0) {
                this.skipEmail = true;
            }

            this.disableStep12 = false;

        },

        async newSchedule(newAppointments) {

            var statusValues = [];
            var status = "";

            // Get the unique status values from the newAppointments array
            statusValues = [...new Set(newAppointments.map(appointment => appointment.status))];

            switch (statusValues[0]) {
                case 'Update appointment time':
                    status = 'Confirmed';
                    break;
                case "Left a message":
                case "Interested":
                    status = "TBD";
                    break;
                case 'Reschedule (need to follow-up)':
                    status = 'Rescheduling';
                    break;
                default:
                    status = statusValues[0]
                    break;
            }

            var newSchedule = {
                AppointmentTime: this.studyDateTime,
                Status: status,
                FK_Family: this.currentSchedule.FK_Family,
                Note: this.Note,
                summary: status.toUpperCase() + " - " + this.calendarSummary(newAppointments),
                Appointments: newAppointments,
                ScheduledBy: this.$store.state.userID,
                location: this.$store.state.location,
                description: this.calendarDescription(newAppointments, this.Note),
                Reminded: 0
            }

            // prepare calendar events for the appointments
            var calendarEvents = []
            newSchedule.Appointments.forEach((appointment) => {

                const testingRoom = this.$store.state.testingRooms.find(room => room.id === appointment.Study.FK_TestingRoom);
                let calendarId;
                if (testingRoom) {
                    calendarId = testingRoom.calendarId;
                } else {
                    calendarId = 'primary';
                }

                appointment.calendarId = calendarId;

                calendarEvents.push(
                    {
                        calendarId: appointment.calendarId,
                        AppointmentTime: newSchedule.AppointmentTime,
                        description: newSchedule.description,
                        summary: newSchedule.summary,
                        location: newSchedule.location,
                        attendees: appointment.attendees,
                        eventId: appointment.calendarEventId || newSchedule.calendarEventId || null,
                        eventURL: appointment.eventURL || newSchedule.eventURL || null,
                    })
            })

            // 1. create calendar events, save the calendarEventId and eventURL to the appointment object
            for (const event of calendarEvents) {
                if (event.eventId) {

                    // update the calendar event with a new time/experimenters
                    await calendar.update(event);

                } else {

                    // create a new calendar event
                    if (newSchedule.Status === 'Confirmed') {
                        const createdCalendarEvents = await calendar.create(event);
                        event.eventURL = createdCalendarEvents.data.eventURL;
                        event.eventId = createdCalendarEvents.data.eventId;
                    }
                }
            }

            console.log(calendarEvents)

            newSchedule.Appointments.forEach((appointment, index) => {
                appointment.calendarEventId = calendarEvents[index].eventId;
                appointment.eventURL = calendarEvents[index].eventURL;

                appointment.Experimenters = appointment.PrimaryExperimenter.map((experimenter) => {
                    return experimenter.id;
                })

                appointment.Experimenters_2nd = appointment.SecondaryExperimenter.map((experimenter) => {
                    return experimenter.id;
                })
            })

            console.log("newSchedule")
            console.log(newSchedule)
            // 2. create schedule and associted appointments (experimenters and assistant experimenters)
            const createdSchedule = await this.createScheduleBackend(newSchedule);

            // 3. update frontend store?

            return createdSchedule;

        },

        async updateSchedule(updateAppointments) {

            var statusValues = [];
            var status = "";

            // Get the unique status values from the updateAppointments array
            statusValues = [...new Set(updateAppointments.map(appointment => appointment.status))];

            // convert the status to the one used in the database
            switch (statusValues[0]) {
                case 'Update appointment time':
                    status = 'Confirmed';
                    break;
                case 'Reschedule (need to follow-up)':
                    status = 'Rescheduling';
                    break;
                default:
                    status = statusValues[0]
                    break;
            }

            var updatedSchedule = {
                id: this.currentSchedule.id,
                AppointmentTime: this.studyDateTime,
                Status: status,
                FK_Family: this.currentSchedule.FK_Family,
                Note: this.Note,
                summary: status.toUpperCase() + " - " + this.calendarSummary(updateAppointments),
                Appointments: updateAppointments,
                ScheduledBy: this.$store.state.userID,
                location: this.$store.state.location,
                description: this.calendarDescription(updateAppointments, this.Note),
                Reminded: 0,
            }

            console.log("updatedSchedule")
            console.log(updatedSchedule)

            var updatedCalendarEvents = []
            updatedSchedule.Appointments.forEach((appointment) => {

                const testingRoom = this.$store.state.testingRooms.find(room => room.id === appointment.Study.FK_TestingRoom);
                let calendarId;
                if (testingRoom) {
                    calendarId = testingRoom.calendarId;
                } else {
                    calendarId = 'primary';
                }

                appointment.calendarId = calendarId;

                var calendarEvent = {
                    calendarId: appointment.calendarId,
                    AppointmentTime: updatedSchedule.AppointmentTime,
                    description: updatedSchedule.description,
                    summary: updatedSchedule.summary,
                    location: updatedSchedule.location,
                    attendees: appointment.attendees,
                    eventId: appointment.calendarEventId || updatedSchedule.calendarEventId || null,
                    eventURL: appointment.eventURL || updatedSchedule.eventURL || null,
                }

                updatedCalendarEvents.push(calendarEvent)

            })

            console.log(updatedCalendarEvents)

            // 1. update/create calendar events, save the calendarEventId and eventURL to the appointment object

            for (const event of updatedCalendarEvents) {
                // check if there was an calendar event created before. There is no calendar event created when the schedule was previously in TBD status.
                if (event.eventId) {

                    // update the calendar event
                    await calendar.update(event);

                } else {

                    // create a new calendar event
                    if (updatedSchedule.Status === 'Confirmed') {
                        const createdCalendarEvent = await calendar.create(event);
                        event.eventURL = createdCalendarEvent.data.eventURL;
                        event.eventId = createdCalendarEvent.data.eventId;
                    }

                }

            }

            updatedSchedule.Appointments.forEach((appointment, index) => {
                appointment.calendarEventId = updatedCalendarEvents[index].eventId;
                appointment.eventURL = updatedCalendarEvents[index].eventURL;

                appointment.Experimenters = appointment.PrimaryExperimenter.map((experimenter) => {
                    return experimenter.id;
                })

                appointment.Experimenters_2nd = appointment.SecondaryExperimenter.map((experimenter) => {
                    return experimenter.id;
                })

                appointment.FK_Schedule = updatedSchedule.id; // newly added appointment does not have this field.

            })

            console.log("updatedSchedule")
            console.log(updatedSchedule)

            // 2. update schedule and associted appointments (experimenters and assistant experimenters)

            const createdSchedule = await this.updateScheduleBackend(updatedSchedule);

            console.log("updatedSchedule")
            console.log(createdSchedule)

            // 3. update frontend store?

            return createdSchedule;
        },

        async createScheduleBackend(newSchedule) {
            const createdSchedule = await schedule.create(newSchedule);
            return createdSchedule.data
        },

        async updateScheduleBackend(updatedSchedule) {
            const createdSchedule = await schedule.update(updatedSchedule);
            return createdSchedule.data
        },

        calendarSummary(Appointments) {
            var studyNames = Appointments.map((appointment) => {
                return (
                    appointment.Study.StudyName +
                    "(" +
                    appointment.Child.FK_Family +
                    appointment.Child.IdWithinFamily +
                    ")"
                );
            });

            studyNames = Array.from(new Set(studyNames));

            return studyNames.join(" + ");
        },

        calendarDescription(Appointments, Note) {
            var description = "<b>Note: </b>" + Note + "<br>";

            Appointments.forEach((appointment) => {
                description =
                    description +
                    "<br>==================" +
                    "<br><b>" +
                    appointment.Study.StudyName +
                    "</b><br>" +
                    "<b>E1: </b>" +
                    appointment.E1 +
                    "<br>" +
                    "<b>E2: </b>" +
                    appointment.E2 +
                    "<br>";

                if (appointment.Study.StudyType == "Online")
                    description =
                        description +
                        "<b>zoom link: </b>" +
                        appointment.PrimaryExperimenter[0].ZoomLink;
            });

            return description;
        },

        onDialogClose(value) {
            if (!value) {
                // console.log('Dialog closed');
                this.$emit('close-dialog')
                // Additional logic for when the dialog closes
            } else {
                // console.log('Dialog opens');
            }
        },

        resetVariables() {
            this.studyDateTime = null;
            this.dateTimePickerDisable = true;
            this.stepperPage = 1;
            this.emailUpdate = false;
            this.emailBody = "";
            this.emailSubject = "";
            this.editor = ClassicEditor;
            this.editorData = '<p>Content of the editor.</p>';
            this.disableStep12 = true;
            this.disableStep23 = true;
            this.contactDate = null;
            this.datePicker = false;
            this.scheduleEnable = false;
            this.Note = "";
            this.nextContactNote = "";
            this.emailDialog = false;
            this.emailSelectionShow = false;
            this.emailAppointments = [];
            this.skipEmail = false;
            this.emailType = "";
            this.emailOptions = ['Confirmation', 'ScheduleUpdate', 'ScheduleUpdate', 'Reminder', 'Follow-up', 'ThankYou'];
            this.contactType = "";
            this.loadingStatus = false;
            this.scheduleButtonText = "Create Appointment";
            this.emailButtonIconShow = false;
            this.emailButtonText = "Send email";
            this.scheduleButtonIconShow = false;
        },

        initiateVariables(dialogType) {
            switch (dialogType) {
                case "schedule":
                    this.stepperPage = 1;
                    break;

                case "email":
                    // start the dialog from the email step.
                    this.stepperPage = 2;
                    this.emailAppointments = this.currentSchedule.Appointments;
                    this.studyDateTime = this.currentSchedule.AppointmentTime;
                    this.contactDate = this.currentFamily.NextContactDate;
                    this.nextContactNote = this.currentFamily.nextContactNote;
                    this.emailDialog = true;
                    this.emailSelectionShow = true;
                    this.emailType = "Reminder";
                    this.emailOptions = ['Reminder', 'Follow-up', 'ThankYou'];
                    break;
            }
        },

        close() {

            this.resetVariables();
            this.$emit('close-dialog')
        },

        sendEmail() {
            this.$refs.emailComponent.sendEmail();
            this.disableStep23 = false
        },

        step12() {
            // moving from schedule step to the next step while checking if sending email is neccesary.
            if (this.skipEmail) {
                this.emailDialog = false;
                this.stepperPage = 3;
            } else {

                for (const appointment of this.emailAppointments) {
                    switch (appointment.status) {
                        case 'Confirmed':
                            this.emailType = "Confirmation";
                            break;
                        case 'Update appointment time':
                            this.emailType = "ScheduleUpdate";
                            break;
                        case 'Tentative':
                            this.emailType = "Introduction";
                            break;
                        case 'No Show':
                            this.emailType = "noShowReminder";
                            break;
                    }
                }

            }

            this.loadingStatus = false;
            this.contactDate = moment(this.studyDateTime).add(7, 'days').startOf("day").tz(this.$store.state.timeZone).format("YYYY-MM-DD");
            this.emailSelectionShow = false;
            this.emailDialog = true;
            this.stepperPage = 2;
        },

        step23() {
            // moving from email step to the next step while checking if sending email is neccesary.
            this.loadingStatus = false;
            this.emailDialog = false;
            this.stepperPage = 3;
            this.contactType = '';
            this.nextContactNote = "";

        },

    },

    computed: {
        daysLate() {

            if (this.contactDate) {

                var differentDays = moment
                    .duration(
                        moment(this.contactDate)
                            .startOf("day")
                            .diff(moment().startOf("day"))
                    )
                    .asDays()

                return differentDays + " days later"
            } else {
                return ""
            }

        }

    },

    watch: {

        currentSchedule(newVal) {
            if (newVal) {
                this.Note = newVal.Note;
                this.nextNote = newVal.nextContactNote;
                this.scheduleButtonText = (this.scheduleType == 'create') ? "Create Appointment" : "Update Appointment"

                this.initiateVariables(this.dialogType);
                this.dateTimePickerDisable = (this.parentResponse !== 'Confirmed');

                switch (this.parentResponse) {
                    case 'Interested':
                    case 'Left a message':
                    case 'Rejected':
                        this.scheduleEnable = true;
                        break;
                }

            }
        },
    },

    mounted() {
        this.Note = this.currentSchedule.Note;
        this.nextNote = this.currentSchedule.nextContactNote;
        this.scheduleButtonText = (this.scheduleType == 'create') ? "Create Schedule" : "Update Schedule"

        this.initiateVariables(this.dialogType);
        this.dateTimePickerDisable = (this.parentResponse !== 'Confirmed');

        switch (this.parentResponse) {

            case 'Interested':
            case 'Left a message':
            case 'Rejected':
                this.scheduleEnable = true;
                break;
        }
    }
}
</script>

<style>
.ck-editor__editable_inline:not(.ck-comment__input *) {
    height: 500px;
    overflow-y: auto;
}

.v-card__subtitle,
.v-card__text,
.v-card__title {
    /* font-size: 20px; */
    padding: 4px 16px;
}
</style>