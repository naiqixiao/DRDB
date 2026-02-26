<template>
  <v-dialog :model-value="dialog" @update:model-value="onDialogClose" transition="dialog-bottom-transition" max-width="900px">
    <v-card>
      <v-stepper v-model="stepperPage" elevation="0">
        <v-stepper-header>
          <v-stepper-item title="Schedule a visit" value="1" :complete="stepperPage > 1"></v-stepper-item>
          <v-divider></v-divider>
          <v-stepper-item title="Email" value="2" :complete="stepperPage > 2"></v-stepper-item>
          <v-divider></v-divider>
          <v-stepper-item title="Next Contact" value="3" :complete="stepperPage > 3"></v-stepper-item>
        </v-stepper-header>

        <v-stepper-window>
          <!-- Step 1, choose appointment time, studies, experimenters, and leave a note. -->
          <v-stepper-window-item value="1">
            <v-card elevation="0">
              <v-card-title class="d-flex justify-space-between align-center">
                Create / Update Study Schedule
                <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
              </v-card-title>

              <v-container>
                <v-card-text>
                  <!-- Schedule date and time -->
                  <v-divider class="mb-5"></v-divider>
                  <dateTimePicker 
                    ref="dateTimePickerComp" 
                    :dateTimePickerDisable="dateTimePickerDisable"
                    :appointmentTime="currentSchedule?.AppointmentTime"
                    @readyToCreateSchedule="readyToCreateSchedule" 
                  />

                  <!-- Appointment Data Table -->
                  <v-divider class="my-5"></v-divider>
                  <appointmentDetails 
                    ref="appointmentDetailsRef" 
                    :Appointments="currentSchedule?.Appointments"
                    :Children="currentFamily?.Children" 
                    :scheduleType="scheduleType"
                    :parentResponse="parentResponse"
                    @dateTimePickerDisableUpdate="dateTimePickerDisableUpdate"
                    @newAppointment="addAppointment" 
                    @deleteCurrentAppointment="deleteCurrentAppointment"
                    @readyToCreateSchedule="readyToCreateSchedule"
                  />

                  <!-- Notes for this schedule -->
                  <v-divider class="my-5"></v-divider>
                  <h2 class="text-left py-2 ma-0">Notes for this schedule:</h2>
                  <v-container class="pa-0">
                    <v-textarea 
                      variant="filled" 
                      class="conv-textarea" 
                      label="" 
                      no-resize 
                      rows="3"
                      hide-details 
                      v-model="Note"
                    ></v-textarea>
                  </v-container>
                </v-card-text>
              </v-container>

              <!-- action buttons -->
              <v-card-actions>
                <v-container class="d-flex align-center flex-wrap justify-end" style="gap: 60px">
                  <v-btn 
                    variant="tonal"
                    color="primary"
                    @click="createSchedule" 
                    :disabled="!scheduleEnable"
                    :loading="loadingStatus"
                  >
                    <v-icon start v-show="scheduleButtonIconShow">mdi-checkbox-marked-circle-outline</v-icon>
                    {{ scheduleButtonText }}
                  </v-btn>
                  <v-btn variant="elevated" color="primary" @click="step12" :disabled="disableStep12">Next</v-btn>
                </v-container>
              </v-card-actions>
            </v-card>
          </v-stepper-window-item>

          <!-- Step 2 -->
          <v-stepper-window-item value="2">
            <v-card elevation="0">
              <v-card-title class="d-flex justify-space-between align-center">
                <v-spacer></v-spacer>
                <v-select 
                  v-show="emailSelectionShow" 
                  hide-details 
                  variant="filled" 
                  density="compact" 
                  :items="emailOptions" 
                  v-model="emailType"
                  label="Choose the type of email you want to send"
                  @update:model-value="emailTypeChange($event)"
                  style="max-width: 400px;"
                ></v-select>
                <v-spacer></v-spacer>
                <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
              </v-card-title>

              <v-container>
                <v-card-text>
                  <emailComponent 
                    ref="emailComponentRef" 
                    :dialog="emailDialog" 
                    :emailType="emailType"
                    :appointments="emailAppointments" 
                    :appointmentTime="studyDateTime"
                    :familyInfo="currentFamily"
                  />
                </v-card-text>
              </v-container>
              <v-card-actions>
                <v-container class="d-flex align-center flex-wrap justify-end" style="gap: 60px">
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }">
                      <div v-bind="props">
                        <v-checkbox 
                          label="Skip Email" 
                          class="ma-0 pa-0"
                          :model-value="skipConfirmationEmailStatus" 
                          @update:model-value="skipConfirmationEmail"
                          density="compact"
                          hide-details
                        ></v-checkbox>
                      </div>
                    </template>
                    <span>Check this box to skip emailing to parents.</span>
                  </v-tooltip>
                  <v-spacer></v-spacer>

                  <v-btn 
                    variant="tonal"
                    color="primary"
                    @click="sendEmail" 
                    :loading="loadingStatus"
                  >
                    <v-icon start v-show="emailButtonIconShow">mdi-checkbox-marked-circle-outline</v-icon>
                    {{ emailButtonText }}
                  </v-btn>

                  <v-btn variant="elevated" color="primary" @click="step23" :disabled="disableStep23 && !skipConfirmationEmailStatus">
                    {{ step23ButtonText }}
                  </v-btn>
                </v-container>
              </v-card-actions>
            </v-card>
          </v-stepper-window-item>

          <!-- Step 3 -->
          <v-stepper-window-item value="3">
            <v-card elevation="0">
              <v-card-title class="d-flex justify-space-between align-center" style="white-space: normal;">
                Set up next contact date. This family can be contacted after this date.
                <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
              </v-card-title>

              <v-container>
                <v-card-text>
                  <v-divider class="mb-5"></v-divider>
                  <h2 class="text-left ma-0">Next contact after:</h2>
                  <v-container class="d-flex flex-wrap justify-start align-center pa-0 pt-4" style="gap: 40px">
                    <v-text-field 
                      variant="filled" 
                      density="compact" 
                      ref="contactDateRef" 
                      label="Date (YYYY-MM-DD)"
                      style="max-width: 250px" 
                      v-model="contactDate" 
                      :rules="$rules.dob" 
                      hide-details
                      prepend-inner-icon="mdi-calendar" 
                      @click:prepend-inner="datePicker = true"
                      @click="datePicker = true"
                    ></v-text-field>

                    <h3 class="ma-0">{{ daysLate }}</h3>
                    <v-spacer></v-spacer>
                  </v-container>

                  <v-divider class="my-5"></v-divider>
                  <h2 class="text-left ma-0">Note for future contact:</h2>
                  <v-container class="pa-0 pt-4 d-flex flex-wrap justify-start align-center">
                    <v-textarea 
                      variant="filled" 
                      class="conv-textarea" 
                      label="" 
                      no-resize 
                      rows="3"
                      hide-details 
                      v-model="nextContactNote"
                    ></v-textarea>
                  </v-container>
                </v-card-text>
              </v-container>
              <v-card-actions>
                <v-container class="d-flex align-baseline flex-wrap justify-end pa-0" style="gap: 40px">
                  <v-btn variant="elevated" color="primary" @click="finalizeSchedule">Complete</v-btn>
                </v-container>
              </v-card-actions>
            </v-card>
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>

      <v-dialog v-model="datePicker" max-width="360px">
        <v-card variant="outlined">
          <v-date-picker 
            v-model="contactDateObj" 
            show-current 
            @update:model-value="datePick"
          ></v-date-picker>
        </v-card>
      </v-dialog>

    </v-card>
  </v-dialog>
</template>

<script>
import dateTimePicker from '@/components/dateTimePicker.vue';
import appointmentDetails from '@/components/appointmentDetails.vue';
import emailComponent from '@/components/emailComponent.vue';
import moment from "moment";

import family from "@/services/family";
import schedule from "@/services/schedule";
import calendar from "@/services/calendar";
import appointment from "@/services/appointment";

export default {
  name: "scheduleDialog",
  components: {
    dateTimePicker,
    appointmentDetails,
    emailComponent,
  },
  props: {
    dialog: Boolean,
    currentSchedule: Object,
    currentFamily: Object,
    scheduleType: String,
    parentResponse: String,
    dialogType: String,
  },
  emits: ["close-dialog", "newAppointment", "deleteCurrentAppointment", "newSchedule", "updatedSchedule", "completedSchedule"],
  data: () => ({
    studyDateTime: null,
    dateTimePickerDisable: true,
    stepperPage: "1",
    contactDate: null,
    contactDateObj: null,
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
      this.$emit("deleteCurrentAppointment", index);
    },
    dateTimePickerDisableUpdate(val) {
      this.dateTimePickerDisable = val;
    },
    datePick(val) {
      if (val) {
        this.contactDate = moment(val).format("YYYY-MM-DD");
      }
      this.datePicker = false;
    },
    addAppointment(app) {
      this.$emit("newAppointment", app);
    },
    readyToCreateSchedule() {
      if (this.$refs.appointmentDetailsRef?.appointmentDetailReady && this.$refs.dateTimePickerComp?.studyDateTimeReady) {
        this.scheduleEnable = true;
      } else {
        this.scheduleEnable = false;
      }
    },

    async createSchedule() {
      this.loadingStatus = true;
      const newAppointments = this.$refs.appointmentDetailsRef.generateAppointments();
      this.studyDateTime = this.$refs.dateTimePickerComp.studyDateTime();

      let newSchedule = {};
      let updatedSchedule = {};

      if (newAppointments.newAppointments.length > 0) {
        newSchedule = await this.newSchedule(newAppointments.newAppointments);
        this.scheduleButtonText = "Appointment created!";
        this.$emit("newSchedule", newSchedule);
      }

      if (newAppointments.updatedAppointments.length > 0) {
        updatedSchedule = await this.updateSchedule(newAppointments.updatedAppointments);
        this.scheduleButtonText = "Appointment updated!";
        this.$emit("updatedSchedule", updatedSchedule);
      }

      if (newAppointments.completedAppointments.length > 0) {
        await schedule.complete({
          id: newAppointments.completedAppointments[0].FK_Schedule,
          FK_Family: newAppointments.completedAppointments[0].FK_Family,
          Completed: 1
        });
        this.$emit("completedSchedule", {
          id: newAppointments.completedAppointments[0].FK_Schedule,
          FK_Family: newAppointments.completedAppointments[0].FK_Family,
          Completed: 1
        });
      }

      if (newAppointments.deletedAppointments.length > 0) {
        for (const app of newAppointments.deletedAppointments) {
          await appointment.delete({ id: app });
        }
      }

      this.loadingStatus = false;
      this.scheduleButtonIconShow = true;

      const statusArray = ['Confirmed', 'Left a message', 'Interested', 'Update appointment time', 'Reschedule (need to follow-up)', 'No Show', 'Cancelled'];
      this.emailAppointments = newAppointments.newAppointments.concat(newAppointments.updatedAppointments).filter(app => {
        return statusArray.includes(app.status);
      });

      if (this.emailAppointments.length === 0) {
        this.skipEmail = true;
      }

      if (newAppointments.completedAppointments.length > 0) {
        this.contactType = "Completed";
      }

      if (newAppointments.newAppointments.length > 0) {
        switch (newSchedule.Status) {
          case 'Confirmed':
            this.contactType = "nextStudy";
            break;
          case "TBD":
            this.contactType = "followUP";
            break;
          case 'Rejected':
            this.contactType = "rejectAndFutureStudy";
            break;
        }
      }

      if (newAppointments.updatedAppointments.length > 0) {
        switch (updatedSchedule.Status) {
          case 'Confirmed':
            this.contactType = "nextStudy";
            break;
          case "Rescheduling":
            this.contactType = "followUP";
            break;
          case 'Cancelled':
            this.contactType = "followUpforCancelledAppointment";
            break;
          case 'No Show':
            this.contactType = "followUpforNoShow";
            break;
          case 'Rejected':
            this.contactType = "rejectAndFutureStudy";
            break;
        }
      }

      this.disableStep12 = false;
    },

    async newSchedule(newAppointments) {
      let statusValues = [...new Set(newAppointments.map(appointment => appointment.status))];
      let status = "";

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
          status = statusValues[0];
          break;
      }

      let newSchedule = {
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
      };

      let calendarEvents = [];
      newSchedule.Appointments.forEach((app) => {
        const testingRoom = this.$store.state.testingRooms.find(room => room.id === app.Study.FK_TestingRoom);
        let calendarId = testingRoom ? testingRoom.calendarId : 'primary';
        app.calendarId = calendarId;

        calendarEvents.push({
          calendarId: app.calendarId,
          AppointmentTime: newSchedule.AppointmentTime,
          description: newSchedule.description,
          summary: newSchedule.summary,
          location: newSchedule.location,
          attendees: app.attendees,
          eventId: app.calendarEventId || newSchedule.calendarEventId || null,
          eventURL: app.eventURL || newSchedule.eventURL || null,
        });
      });

      for (const event of calendarEvents) {
        if (event.eventId) {
          try {
            await calendar.update(event);
          } catch (error) {
            console.error(error);
          }
        } else {
          if (newSchedule.Status === 'Confirmed') {
            try {
              const createdEvent = await calendar.create(event);
              event.eventURL = createdEvent.data.eventURL;
              event.eventId = createdEvent.data.eventId;
            } catch (error) {
              console.error(error);
            }
          }
        }
      }

      newSchedule.Appointments.forEach((app, index) => {
        app.calendarEventId = calendarEvents[index].eventId;
        app.eventURL = calendarEvents[index].eventURL;

        app.Experimenters = app.PrimaryExperimenter.map(exp => exp.id);
        app.Experimenters_2nd = app.SecondaryExperimenter.map(exp => exp.id);
      });

      const createdSchedule = await this.createScheduleBackend(newSchedule);
      return createdSchedule;
    },

    async updateSchedule(updateAppointments) {
      let statusValues = [...new Set(updateAppointments.map(appointment => appointment.status))];
      let status = "";

      switch (statusValues[0]) {
        case 'Update appointment time':
          status = 'Confirmed';
          break;
        case 'Reschedule (need to follow-up)':
          status = 'Rescheduling';
          break;
        default:
          status = statusValues[0];
          break;
      }

      let updatedSchedule = {
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
      };

      let updatedCalendarEvents = [];
      updatedSchedule.Appointments.forEach((app) => {
        const testingRoom = this.$store.state.testingRooms.find(room => room.id === app.Study.FK_TestingRoom);
        let calendarId = testingRoom ? testingRoom.calendarId : 'primary';
        app.calendarId = calendarId;

        updatedCalendarEvents.push({
          calendarId: app.calendarId,
          AppointmentTime: updatedSchedule.AppointmentTime,
          description: updatedSchedule.description,
          summary: updatedSchedule.summary,
          location: updatedSchedule.location,
          attendees: app.attendees,
          eventId: app.calendarEventId || updatedSchedule.calendarEventId || null,
          eventURL: app.eventURL || updatedSchedule.eventURL || null,
        });
      });

      for (const event of updatedCalendarEvents) {
        if (event.eventId) {
          try {
            await calendar.update(event);
          } catch (error) {
            console.error(error);
          }
        } else {
          if (updatedSchedule.Status === 'Confirmed') {
            try {
              const createdEvent = await calendar.create(event);
              event.eventURL = createdEvent.data.eventURL;
              event.eventId = createdEvent.data.eventId;
            } catch (error) {
              console.error(error);
            }
          }
        }
      }

      updatedSchedule.Appointments.forEach((app, index) => {
        app.calendarEventId = updatedCalendarEvents[index].eventId;
        app.eventURL = updatedCalendarEvents[index].eventURL;

        app.Experimenters = app.PrimaryExperimenter.map(exp => exp.id);
        app.Experimenters_2nd = app.SecondaryExperimenter.map(exp => exp.id);
        app.FK_Schedule = updatedSchedule.id;
      });

      await this.updateScheduleBackend(updatedSchedule);
      return updatedSchedule;
    },

    async createScheduleBackend(newSchedule) {
      const createdSchedule = await schedule.create(newSchedule);
      return createdSchedule.data;
    },

    async updateScheduleBackend(updatedSchedule) {
      const rs = await schedule.update(updatedSchedule);
      return rs.data;
    },

    calendarSummary(Appointments) {
      let studyNames = Appointments.map((app) => {
        return app.Study.StudyName + "(" + app.Child.FK_Family + app.Child.IdWithinFamily + ")";
      });
      studyNames = Array.from(new Set(studyNames));
      return studyNames.join(" + ");
    },

    calendarDescription(Appointments, Note) {
      let description = "<b>Note: </b>" + Note + "<br>";
      Appointments.forEach((app) => {
        description += "<br>==================" +
          "<br><b>" + app.Study.StudyName + "</b><br>" +
          "<b>E1: </b>" + app.E1 + "<br>" +
          "<b>E2: </b>" + app.E2 + "<br>";

        if (app.Study.StudyType === "Online" && app.PrimaryExperimenter[0] && app.PrimaryExperimenter[0].ZoomLink) {
          description += "<b>zoom link: </b>" + app.PrimaryExperimenter[0].ZoomLink;
        }
      });
      return description;
    },

    emailTypeChange(newVal) {
      switch (newVal) {
        case "Reminder":
        case "ThankYou":
          this.step23ButtonText = "Complete";
          break;
        case "Follow-up":
          this.step23ButtonText = "Next";
          this.contactDate = moment().tz(this.$store.state.timeZone).startOf("day").add(2, "days").format("YYYY-MM-DD");
          this.nextContactNote = "Sent a follow-up email on " + moment().tz(this.$store.state.timeZone).startOf("day").format("YYYY-MM-DD") + ", follow up in 2 days to confirm the participation.";
          break;
      }
    },

    resetVariables() {
      this.studyDateTime = null;
      this.dateTimePickerDisable = true;
      this.stepperPage = "1";
      this.emailUpdate = false;
      this.emailBody = "";
      this.emailSubject = "";
      this.disableStep12 = true;
      this.disableStep23 = true;
      this.contactDate = null;
      this.contactDateObj = null;
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
          this.stepperPage = "1";
          break;
        case "email":
          this.stepperPage = "2";
          this.emailAppointments = this.currentSchedule.Appointments || [];
          this.studyDateTime = this.currentSchedule.AppointmentTime;
          this.contactDate = this.currentFamily?.NextContactDate;
          this.nextContactNote = this.currentFamily?.NextContactNote;
          this.emailDialog = true;
          this.emailSelectionShow = true;
          this.emailOptions = ['Reminder', 'Follow-up', 'ThankYou'];

          this.emailType = "Reminder";
          if (this.currentSchedule.Status === "Confirmed" && this.currentSchedule.Completed === 1) {
            this.emailType = "ThankYou";
          }

          if (["TBA", "Rescheduling", "No Show", "Cancelled"].includes(this.currentSchedule.Status)) {
            this.emailType = "Follow-up";
          }
          break;
      }
    },

    onDialogClose(value) {
      if (!value) {
        this.$emit('close-dialog');
      }
    },

    close() {
      this.$emit('close-dialog');
    },

    async sendEmail() {
      this.loadingStatus = true;
      const success = await this.$refs.emailComponentRef.sendEmail();
      if (success) {
        this.emailButtonText = "Email sent!";
        this.emailButtonIconShow = true;
        this.disableStep23 = false;
      }
      this.loadingStatus = false;
    },

    skipConfirmationEmail(val) {
      this.skipConfirmationEmailStatus = val;
    },

    generateNextContactNote() {
      const tz = this.$store.state.timeZone;
      switch (this.contactType) {
        case "nextStudy":
          this.contactDate = moment(this.studyDateTime).tz(tz).add(7, "days").format("YYYY-MM-DD");
          this.nextContactNote = "The family is about to participate in a study on " + moment(this.studyDateTime).tz(tz).format("YYYY-MM-DD") + ". Contact the family at least 7 days (" + moment(this.studyDateTime).add(7, "days").tz(tz).format("YYYY-MM-DD") + ") after their participation.";
          break;
        case "followUP":
        case "followUpforNoShow":
        case "followUpforCancelledAppointment":
          this.contactDate = moment().tz(tz).startOf("day").add(2, "days").format("YYYY-MM-DD");
          this.nextContactNote = "Action taken today. Follow up in 2 days to confirm their status / participation.";
          break;
        case "rejectAndFutureStudy":
          this.contactDate = moment().tz(tz).startOf("day").add(2, "w").format("YYYY-MM-DD");
          this.nextContactNote = "Rejected participation on " + moment().tz(tz).startOf("day").format("YYYY-MM-DD") + ". Recommend contacting the family for other studies after 2 weeks.";
          break;
        case "Completed":
          this.contactDate = moment(this.studyDateTime).tz(tz).startOf("day").add(1, "w").format("YYYY-MM-DD");
          this.nextContactNote = "Finished a study on " + moment(this.studyDateTime).tz(tz).startOf("day").format("YYYY-MM-DD") + ". Contact the family again for other studies at least after one week.";
          break;
      }
    },

    step12() {
      if (this.skipEmail) {
        this.emailDialog = false;
        this.stepperPage = "3";
      } else {
        for (const appointment of this.emailAppointments) {
          switch (appointment.status) {
            case 'Confirmed': this.emailType = "Confirmation"; break;
            case 'Update appointment time': this.emailType = "ScheduleUpdate"; break;
            case 'Left a message':
            case 'Interested': this.emailType = "Introduction"; break;
            case 'Reschedule (need to follow-up)': this.emailType = "Reschedule"; break;
            case 'Cancelled': this.emailType = "cancelledReminder"; break;
            case 'No Show': this.emailType = "noShowReminder"; break;
          }
        }
        this.stepperPage = "2";
        this.emailDialog = true;
      }

      this.loadingStatus = false;
      this.generateNextContactNote();
      this.emailSelectionShow = false;
    },

    step23() {
      if (this.emailType === "ThankYou" || this.emailType === "Reminder") {
        this.close();
      } else {
        this.stepperPage = "3";
        this.emailDialog = false;
      }
    },

    async finalizeSchedule() {
      try {
        await family.update({
          id: this.currentFamily?.id,
          NextContactDate: this.contactDate,
          LastContactDate: moment().tz(this.$store.state.timeZone).startOf("day").format("YYYY-MM-DD"),
          NextContactNote: this.nextContactNote,
        });
        this.close();
      } catch (error) {
        console.error(error);
      }
    },
  },
  computed: {
    daysLate() {
      if (this.contactDate) {
        let differentDays = moment.duration(moment(this.contactDate).startOf("day").diff(moment().startOf("day"))).asDays();
        return differentDays + " days later";
      } else {
        return "";
      }
    },
  },
  watch: {
    dialog(val) {
      if (!val) {
        if (this.$refs.dateTimePickerComp) this.$refs.dateTimePickerComp.resetDateTime();
        if (this.$refs.appointmentDetailsRef) this.$refs.appointmentDetailsRef.resetVariables();
        this.resetVariables();
      }
    },
    currentSchedule(newVal) {
      if (newVal) {
        this.Note = newVal.Note || "";
        this.nextContactNote = newVal.nextContactNote || "";
        this.scheduleButtonText = (this.scheduleType === 'create') ? "Create Appointment" : "Update Appointment";

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
    if (this.currentSchedule) {
      this.Note = this.currentSchedule.Note || "";
      this.nextContactNote = this.currentSchedule.nextContactNote || "";
      this.scheduleButtonText = (this.scheduleType === 'create') ? "Create Schedule" : "Update Schedule";

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
}
</script>

<style scoped>
.v-card__subtitle,
.v-card__text,
.v-card__title {
  padding: 4px 16px;
}
</style>
