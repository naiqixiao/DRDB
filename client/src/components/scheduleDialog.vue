<!-- this is the component used to interface study schedules -->
<!-- including picking up schedule time, participated studies, experimenters involved -->
<!-- It also drafts emails and setup next contact date (so this family won't be contacted too frequently.) -->

<!-- In this UI, there will be three steps: determining schedule details, send email, and arrange next contact. -->

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
                                <dateTimePicker ref="dateTimePickerComp" :dateTimePickerDisable="dateTimePickerDisable"
                                    :appointmentTime="currentSchedule.AppointmentTime"
                                    @readyToCreateSchedule="readyToCreateSchedule" />

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
                                        v-show="scheduleButtonIconShow">mdi-checkbox-marked-circle-outline</v-icon>{{
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
                                v-show="emailSelectionShow" label="Choose the type of email you want to send"
                                @change="emailTypeChange($event)"></v-select>
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

                                <v-tooltip top>
                                    <template v-slot:activator="{ on }">
                                        <div v-on="on">
                                            <v-checkbox label="Skip Email" class="ma-0 pa-0"
                                                :value="skipConfirmationEmailStatus" @change="skipConfirmationEmail()"
                                                dense></v-checkbox>
                                        </div>
                                    </template>
                                    <span>Check this box to skip emailing to parents.</span>
                                </v-tooltip>
                                <v-spacer></v-spacer>

                                <v-btn @click="sendEmail()" :loading="loadingStatus"><v-icon left
                                        v-show="emailButtonIconShow">mdi-checkbox-marked-circle-outline</v-icon>{{
                                            emailButtonText
                                        }}</v-btn>

                                <v-btn @click="step23" :disabled="disableStep23 && !skipConfirmationEmailStatus">{{
                                    step23ButtonText }}</v-btn>

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
                                <v-btn @click="finalizeSchedule">Complete</v-btn>

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
import family from "@/services/family";
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
        skipConfirmationEmailStatus: false,
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
        emailOptions: ['Confirmation', 'ScheduleUpdate', 'Reminder', 'Follow-up', 'ThankYou'],
        contactType: "",
        loadingStatus: false,
        scheduleButtonIconShow: false,
        scheduleButtonText: "Create appointment",
        emailButtonIconShow: false,
        emailButtonText: "Send email",
        step23ButtonText: "Next",
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

        readyToCreateSchedule() {
            // check appointmentDetails
            if (this.$refs.appointmentDetails.appointmentDetailReady && this.$refs.dateTimePickerComp.studyDateTimeReady) {
                this.scheduleEnable = true;
            } else {
                this.scheduleEnable = false;
            }
        },

        // the most important function.
        async createSchedule() {

            this.loadingStatus = true;

            // create/update schedules according to the appointment time, appointments, and other information.
            const newAppointments = this.$refs.appointmentDetails.generateAppointments();

            this.studyDateTime = this.$refs.dateTimePickerComp.studyDateTime();

            var newSchedule = {};
            var updatedSchedule = {};

            // create new schedule
            if (newAppointments.newAppointments.length > 0) {
                newSchedule = await this.newSchedule(newAppointments.newAppointments);

                this.scheduleButtonText = "Appointment created!";

                this.$emit("newSchedule", newSchedule);

            }

            // update existing schedule
            if (newAppointments.updatedAppointments.length > 0) {
                updatedSchedule = await this.updateSchedule(newAppointments.updatedAppointments);

                this.scheduleButtonText = "Appointment updated!";

                this.$emit("updatedSchedule", updatedSchedule);
            }

            // Complete the schedule if the status is "Completed".
            if (newAppointments.completedAppointments.length > 0) {
                await schedule.complete({
                    id: newAppointments.completedAppointments[0].FK_Schedule,
                    FK_Family: newAppointments.completedAppointments[0].FK_Family,
                    Completed: 1
                })

                this.$emit("completedSchedule", {
                    id: newAppointments.completedAppointments[0].FK_Schedule,
                    FK_Family: newAppointments.completedAppointments[0].FK_Family,
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
            const statusArray = ['Confirmed', 'Left a message', 'Interested', 'Update appointment time', 'Reschedule (need to follow-up)', 'No Show', 'Cancelled'];
            this.emailAppointments = newAppointments.newAppointments.concat(newAppointments.updatedAppointments).filter(appointment => {
                return statusArray.includes(appointment.status);
            });

            // if there is no email to send, skip the email step.
            if (this.emailAppointments.length === 0) {
                this.skipEmail = true;
            }

            // determine the type of next contact based on status.
            if (newAppointments.completedAppointments.length > 0) {
                // console.log("Completed")
                this.contactType = "Completed";
            }

            // if we need to create new schedule (for confirmed, tentative, or rejected ones)
            if (newAppointments.newAppointments.length > 0) {
                // console.log(newSchedule.Status)
                switch (newSchedule.Status) {
                    case 'Confirmed':
                        this.contactType = "nextStudy"; // condtact the family at least one week after the study is completed.
                        break;
                    case "TBD":
                        this.contactType = "followUP"; // condtact the family at least tow days after the current contact.
                        break;
                    case 'Rejected':
                        this.contactType = "rejectAndFutureStudy"; // condtact the family at least two weeks after the current contact.
                        break;
                }
            }

            // if we need to update the schedule (for confirmed, rescheduling, no show, or cancelled ones)
            if (newAppointments.updatedAppointments.length > 0) {
                // console.log(updatedSchedule.Status)
                switch (updatedSchedule.Status) {
                    case 'Confirmed':
                        this.contactType = "nextStudy"; // condtact the family at least one week after the study is completed.
                        break;
                    case "Rescheduling":
                        this.contactType = "followUP"; // condtact the family at least tow days after the current contact.
                        break;

                    case 'Cancelled':
                        this.contactType = "followUpforCancelledAppointment"; // condtact the family at least tow days after the current contact.
                        break;
                    case 'No Show':
                        this.contactType = "followUpforNoShow"; // condtact the family at least tow days after the current contact.
                        break;
                    case 'Rejected':
                        this.contactType = "rejectAndFutureStudy"; // condtact the family at least two weeks after the current contact.
                        break;
                }
            }

            // console.log(this.contactType)
            // 
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
                default: // Rejected
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

            // console.log(calendarEvents)

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

            // console.log("newSchedule")
            // console.log(newSchedule)
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
                default: // No Show || Cancelled
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

            // console.log("updatedSchedule")
            // console.log(updatedSchedule)

            // 2. update schedule and associted appointments (experimenters and assistant experimenters)

            await this.updateScheduleBackend(updatedSchedule);

            // 3. update frontend store?

            return updatedSchedule;
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

        emailTypeChange(newVal) {
            switch (newVal) {
                case "Reminder":
                case "ThankYou":
                    // no need to update next contact data or note.
                    // name of the next button is complete.
                    // click to end turn off the window.
                    this.step23ButtonText = "Complete";
                    break;

                case "Follow-up":
                    this.step23ButtonText = "Next";
                    this.contactDate = moment().tz(this.$store.state.timeZone)
                        .startOf("day")
                        .add(2, "days")
                        .format("YYYY-MM-DD");
                    this.nextContactNote = "Sent a follow-up email on " +
                        moment().tz(this.$store.state.timeZone)
                            .startOf("day")
                            .format("YYYY-MM-DD") +
                        ", follow up in 2 days to confirm the participation.";

                    break;
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
            this.skipConfirmationEmailStatus = false;
            this.skipEmail = false;
            this.emailType = "";
            this.emailOptions = ['Confirmation', 'ScheduleUpdate', 'Reminder', 'Follow-up', 'ThankYou'];
            this.contactType = "";
            this.loadingStatus = false;
            this.scheduleButtonText = "Create Appointment";
            this.emailButtonIconShow = false;
            this.emailButtonText = "Send email";
            this.scheduleButtonIconShow = false;
            this.step23ButtonText = "Next";
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
                    this.nextContactNote = this.currentFamily.NextContactNote;
                    this.emailDialog = true;
                    this.emailSelectionShow = true;
                    this.emailOptions = ['Reminder', 'Follow-up', 'ThankYou'];

                    this.emailType = "Reminder";
                    if (this.currentSchedule.Status === "Confirmed" && this.currentSchedule.Completed === 1) {
                        this.emailType = "ThankYou";
                    }

                    if (this.currentSchedule.Status === "TBA" || this.currentSchedule.Status === "Rescheduling" || this.currentSchedule.Status === "No Show" || this.currentSchedule.Status === "Cancelled") {
                        this.emailType = "Follow-up";
                    }
                    break;
            }
        },

        onDialogClose(value) {
            // when the dialog is closed by clicking the background
            if (!value) {
                this.$emit('close-dialog')
            }
        },

        close() {
            // when the close button is clicked
            this.$emit('close-dialog')
        },

        async sendEmail() {
            this.loadingStatus = true;
            await this.$refs.emailComponent.sendEmail();
            this.emailButtonText = "Email sent!";
            this.emailButtonIconShow = true;
            this.disableStep23 = false
            this.loadingStatus = false;
        },

        skipConfirmationEmail() {
            this.skipConfirmationEmailStatus = !this.skipConfirmationEmailStatus;
        },

        generateNextContactNote() {

            switch (this.contactType) {
                case "nextStudy":
                    this.contactDate = moment(this.studyDateTime).tz(this.$store.state.timeZone)
                        .add(7, "days")
                        .format("YYYY-MM-DD");

                    this.nextContactNote =
                        "The family is about to participate in a study on " +
                        moment(this.studyDateTime).tz(this.$store.state.timeZone).format("YYYY-MM-DD") +
                        ". Contact the family at least 7 days (" +
                        moment(this.studyDateTime)
                            .add(7, "days").tz(this.$store.state.timeZone)
                            .format("YYYY-MM-DD") +
                        ") after their participation.";
                    break;

                case "followUP":
                    this.contactDate = moment().tz(this.$store.state.timeZone)
                        .startOf("day")
                        .add(2, "days")
                        .format("YYYY-MM-DD");
                    this.nextContactNote =
                        "Left a message or sent an email on " +
                        moment().tz(this.$store.state.timeZone)
                            .startOf("day")
                            .add(2, "days")
                            .format("YYYY-MM-DD") +
                        ", follow up in 2 days to confirm the participation.";
                    break;

                case "followUpforNoShow":
                    this.contactDate = moment().tz(this.$store.state.timeZone)
                        .startOf("day")
                        .add(2, "days")
                        .format("YYYY-MM-DD");
                    this.nextContactNote =
                        "The family didn't show up. Contact the family again on " +
                        moment().tz(this.$store.state.timeZone)
                            .startOf("day")
                            .add(2, "days")
                            .format("YYYY-MM-DD") +
                        ", to confirm their participation.";
                    break;

                case "followUpforCancelledAppointment":
                    this.contactDate = moment().tz(this.$store.state.timeZone)
                        .startOf("day")
                        .add(2, "days")
                        .format("YYYY-MM-DD");
                    this.nextContactNote =
                        "We had to cancel the study dueto our problems. Contact the family again on " +
                        moment().tz(this.$store.state.timeZone)
                            .startOf("day")
                            .add(2, "days")
                            .format("YYYY-MM-DD") +
                        ", to confirm their participation.";
                    break;

                case "rejectAndFutureStudy":
                    this.contactDate = moment().tz(this.$store.state.timeZone)
                        .startOf("day")
                        .add(2, "w")
                        .format("YYYY-MM-DD");
                    this.nextContactNote =
                        "Rejected participation on " +
                        moment().tz(this.$store.state.timeZone).startOf("day").format("YYYY-MM-DD") +
                        ". Recommend contacting the family for other studies after 2 weeks.";
                    break;

                case "Completed":
                    this.contactDate = moment(this.studyDateTime).tz(this.$store.state.timeZone)
                        .startOf("day")
                        .add(1, "w")
                        .format("YYYY-MM-DD");
                    this.nextContactNote =
                        "Finished a study on " +
                        moment(this.studyDateTime).tz(this.$store.state.timeZone).startOf("day")
                            .format("YYYY-MM-DD") +
                        ". Contact the family again for other studies at least after one week.";
                    break;

            }

        },

        step12() {
            // moving from schedule step to the next step while checking if sending email is neccesary.
            if (this.skipEmail) {
                this.emailDialog = false;
                this.stepperPage = 3;
                // console.log(this.stepperPage)
            } else {

                // ['Confirmed', 'Left a message', 'Interested', 'Update appointment time', 'Reschedule (need to follow-up)', 'No Show', 'Cancelled']
                for (const appointment of this.emailAppointments) {
                    switch (appointment.status) {
                        case 'Confirmed':
                            this.emailType = "Confirmation";
                            break;
                        case 'Update appointment time':
                            this.emailType = "ScheduleUpdate";
                            break;
                        case 'Left a message':
                        case 'Interested':
                            this.emailType = "Introduction";
                            break;
                        case 'Reschedule (need to follow-up)':
                            this.emailType = "Reschedule";
                            break;
                        case 'Cancelled':
                            this.emailType = "cancelledReminder";
                            break;
                        case 'No Show':
                            this.emailType = "noShowReminder";
                            break;
                    }
                }

                this.stepperPage = 2;
                this.emailDialog = true;
            }

            this.loadingStatus = false;
            this.generateNextContactNote();
            this.emailSelectionShow = false;
        },

        step23() {
            // moving from email step to the next step while checking if sending email is neccesary.

            if (this.emailType === "ThankYou" || this.emailType === "Reminder") {
                this.close();
            } else {
                this.stepperPage = 3;
                this.emailDialog = false;
            }
        },

        async finalizeSchedule() {
            // update the next contact date and note.
            try {
                await family.update({
                    id: this.currentFamily.id,
                    NextContactDate: this.contactDate,
                    LastContactDate: moment().tz(this.$store.state.timeZone).startOf("day").format("YYYY-MM-DD"),
                    NextContactNote: this.nextContactNote,
                });

                this.close();

            } catch (error) {
                console.log(error);
            }

        }

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
        dialog() {
            if (!this.dialog) {
                // console.log("dialog closed", val)
                this.resetVariables();
                this.$refs.dateTimePickerComp.resetDateTime();
            }
        },

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