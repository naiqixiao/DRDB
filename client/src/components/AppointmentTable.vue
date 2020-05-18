<template>
  <v-data-table
    hide-default-footer
    disable-pagination
    fixed-header
    single-select
    no-data-text="The family hasn't participated in any study or no family is selected."
    :headers="this.$headersAppointments"
    :items="Appointments"
    class="elevation-1"
    height="380px"
    calculate-widths
  >
    <template #item.AppointmentTime="{ item }">
      <DateDisplay :date="item.Schedule.AppointmentTime" :format="'long'" />
    </template>
    <template #item.updatedAt="{ item }">
      <DateDisplay :date="item.Schedule.updatedAt" :format="'short'" />
    </template>
    <template #item.AgeByParticipation="{ item }">
      <AgeByParticipation :item="item" />
    </template>

    <template v-slot:item.actions="{ item }">
      <v-icon
        @click.stop="updateSchedule(item, 'Confirmed')"
        :disabled="
          item.Schedule.Status === 'Confirmed' ||
            item.Schedule.Completed == true
        "
        >event</v-icon
      >
      <v-icon
        @click.stop="updateSchedule(item, 'Rescheduling')"
        :disabled="
          item.Schedule.Status === 'Rescheduling' ||
            item.Schedule.Status === 'No Show' ||
            item.Schedule.Status === 'TBD' ||
            item.Schedule.Completed == true
        "
        >update</v-icon
      >
      <v-icon
        @click.stop="updateSchedule(item, 'No Show')"
        :disabled="
          item.Schedule.Status === 'Rescheduling' ||
            item.Schedule.Status === 'No Show' ||
            item.Schedule.Status === 'TBD' ||
            item.Schedule.Completed == true
        "
        >sentiment_dissatisfied</v-icon
      >
      <v-icon
        @click.stop="updateSchedule(item, 'Cancelled')"
        :disabled="
          item.Schedule.Status === 'Cancelled' ||
            item.Schedule.Completed == true
        "
        >not_interested</v-icon
      >

      <v-dialog v-model="dialog" max-width="1000px" :retain-focus="false">
        <v-stepper v-model="e1">
          <v-stepper-header>
            <v-stepper-step
              :complete="e1 > 1"
              editable
              step="1"
              @click="emailDialog = false"
              >Reschedule for {{ item.Child.Name }}</v-stepper-step
            >

            <v-divider></v-divider>

            <v-stepper-step :complete="e1 > 2" step="2">Email</v-stepper-step>

            <v-divider></v-divider>

            <v-stepper-step step="3">Next contact</v-stepper-step>
          </v-stepper-header>

          <v-stepper-items>
            <v-stepper-content step="1">
              <v-card outlined>
                <v-card-title class="headline"
                  >Select study date and time.</v-card-title
                >
                <v-row justify="space-around">
                  <v-col cols="12" md="6">
                    <v-date-picker
                      v-model="studyDate"
                      show-current
                      :min="earliestDate"
                      :max="latestDate"
                    ></v-date-picker>
                  </v-col>
                  <v-col cols="12" lg="3">
                    <v-combobox
                      v-model="studyTime"
                      :items="studyTimeSlots"
                      label="Study time"
                      hide-details
                      dense
                    ></v-combobox>
                  </v-col>
                </v-row>
              </v-card>
              <v-divider></v-divider>
              <v-row justify="space-between" align="center">
                <v-col cols="12" md="2"></v-col>
                <v-col cols="12" md="6">
                  <v-btn
                    color="primary"
                    :disabled="!studyDateTime"
                    @click="continue12()"
                  >
                    <v-icon dark left v-show="scheduleUpdated"
                      >mdi-checkbox-marked-circle</v-icon
                    >
                    Confirm
                  </v-btn>
                </v-col>
                <v-col cols="12" md="2">
                  <v-btn
                    :disabled="!scheduleNextPage"
                    @click="scheduleNextStep"
                  >
                    Next</v-btn
                  >
                </v-col>
              </v-row>
            </v-stepper-content>
            <v-stepper-content step="2">
              <Email
                ref="Email"
                :dialog="emailDialog"
                :emailTemplate="item.Study.EmailTemplate"
                :data="{
                  nameMom: family.NameMom,
                  childName: item.Child.Name,
                  Email: family.Email,
                  scheduleTime: studyDateTime,
                }"
                emailType="Confirmation"
              ></Email>
              <v-divider></v-divider>
              <v-row justify="space-between" align="center">
                <v-col cols="12" md="2"></v-col>
                <v-col cols="12" md="6">
                  <v-btn color="primary" @click="continue23()"
                    ><v-icon dark left v-show="emailSent"
                      >mdi-checkbox-marked-circle</v-icon
                    >
                    Send Email
                  </v-btn>
                </v-col>
                <v-col cols="12" md="2">
                  <v-btn
                    :disabled="!scheduleNextPage"
                    @click="scheduleNextStep"
                  >
                    Next</v-btn
                  >
                </v-col>
              </v-row>
            </v-stepper-content>

            <v-stepper-content step="3">
              <NextContact
                ref="NextContactStepper"
                :familyId="family.id"
                :studyDate="studyDate"
                contactType="Confirmed"
                :nextContactDialog="nextContactDialogStepper"
                @nextContactDone="updateNextContactFrontend"
              ></NextContact>
              <v-divider></v-divider>
              <v-row dense justify="center" align="center">
                <v-col>
                  <v-btn color="primary" @click="completeSchedule()">
                    Complete
                  </v-btn>
                </v-col>
              </v-row>
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </v-dialog>

      <v-dialog
        v-model="nextContactDialog"
        max-width="800px"
        :retain-focus="false"
      >
        <v-card outlined>
          <v-card-title>
            <span class="headline">Notes for the next contact</span>
          </v-card-title>
          <NextContact
            ref="NextContact"
            :familyId="family.id"
            :studyDate="nextContactDate"
            :contactType="contactType"
            :nextContactDialog="nextContactDialog"
            @nextContactDone="updateNextContactFrontend"
          ></NextContact>

          <v-card-actions>
            <v-row justify="space-between" style="height: 50px">
              <v-col md="4"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="nextContactDialog = false"
                  >Cancel</v-btn
                >
              </v-col>
              <v-col md="2">
                <v-btn color="primary" @click="updateNextContact">Save</v-btn>
              </v-col>
              <v-col md="4"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>

    <template #item.Schedule.Completed="{ item }">
      <v-simple-checkbox
        v-model="item.Schedule.Completed"
        class="ma-0 pa-0"
        @input="updateSchedule(item, 'Completed')"
        dense
      ></v-simple-checkbox>
    </template>
  </v-data-table>
</template>

<script>
import DateDisplay from "@/components/DateDisplay";
import AgeByParticipation from "@/components/AgeByParticipation";
import NextContact from "@/components/NextContact";
import Email from "@/components/Email";

import schedule from "@/services/schedule";

import moment from "moment";

export default {
  components: {
    DateDisplay,
    AgeByParticipation,
    NextContact,
    Email,
  },
  props: {
    Appointments: Array,
    studyTimeSlots: Array,
    family: Object,
  },
  data() {
    return {
      e1: 1,
      contactType: "",
      emailDialog: false,
      nextContactDialogStepper: false,
      nextContactDate: "",
      nextContactDialog: false,
      dialog: false,
      editedIndex: -1,
      editedItem: {
        Study: {
          MinAge: 6,
          MaxAge: 18,
        },
        Child: {
          Name: null,
          DoB: new Date(),
        },
      },
      studyDate: null,
      studyTime: "09:00AM",
      scheduleNextPage: false,
      emailSent: false,
      scheduleUpdated: false,
    };
  },
  methods: {
    async updateSchedule(item, status) {
      switch (status) {
        case "Confirmed":
          this.editedIndex = this.Appointments.indexOf(item);
          this.editedItem = Object.assign({}, item);
          this.dialog = true;
          break;

        case "Completed":
          try {
            await schedule.complete(item.Schedule);
          } catch (error) {
            console.log(error);
          }
          break;

        default:
          item.Schedule.Status = status;

          // if (status == "Cancelled") {
          //   this.$emit("alert");
          // }

          var currentSchedules = await schedule.search({
            id: item.FK_Schedule,
          });

          var currentSchedule = currentSchedules.data[0];

          var studyNames = currentSchedule.Appointments.map((appointment) => {
            return (
              appointment.Study.StudyName +
              " (" +
              appointment.FK_Family +
              appointment.Child.IdWithinFamily +
              ")"
            );
          });

          studyNames = Array.from(new Set(studyNames));

          item.Schedule.summary =
            item.Schedule.Status.toUpperCase() + " - " + studyNames.join(" + ");

          try {
            await schedule.update(item.Schedule);
            item.Schedule.AppointmentTime = null;
            item.Schedule.updatedAt = new Date().toISOString();

            this.Appointments.forEach((appointment) => {
              if (appointment.FK_Schedule === item.FK_Schedule) {
                appointment.Schedule = item.Schedule;
              }
            });

            // next contact
            this.contactType = status;
            this.nextContactDate = this.TodaysDate;
            this.nextContactDialog = true;

            console.log("appointment updated!");
          } catch (error) {
            console.log(error);
          }
          break;
      }
    },

    async updateNextContact() {
      try {
        await this.$refs.NextContact.updateNextContact();

        this.nextContactDialog = false;
      } catch (error) {
        console.log(error);
      }
    },

    updateNextContactFrontend(nextContact) {
      this.$emit("nextContactDone", nextContact);
    },

    async reschedule() {
      try {
        if (this.editedIndex > -1) {
          this.editedItem.Schedule.Status = "Confirmed";

          this.editedItem.Schedule.AppointmentTime = moment(
            this.studyDateTime
          ).toISOString(true);

          var studyNames = this.Appointments.map((appointment) => {
            if (appointment.FK_Schedule === this.editedItem.FK_Schedule) {
              return (
                appointment.Study.StudyName +
                " (" +
                appointment.FK_Family +
                appointment.Child.IdWithinFamily +
                ")"
              );
            } else {
              return null;
            }
          });

          studyNames = studyNames.filter(function(el) {
            return el != null;
          });

          studyNames = Array.from(new Set(studyNames));

          this.editedItem.Schedule.summary = studyNames.join(" + ");

          this.editedItem.Schedule.start = {
            dateTime: moment(this.studyDateTime).toISOString(true),
            timeZone: "America/Toronto",
          };
          this.editedItem.Schedule.end = {
            dateTime: moment(this.studyDateTime)
              .add(1, "h")
              .toISOString(true),
            timeZone: "America/Toronto",
          };

          const calendarEvent = await schedule.update(this.editedItem.Schedule);

          this.editedItem.Schedule.calendarEventId =
            calendarEvent.calendarEventId;
          this.editedItem.Schedule.eventURL = calendarEvent.eventURL;
          this.editedItem.Schedule.updatedAt = new Date().toISOString();

          Object.assign(this.Appointments[this.editedIndex], this.editedItem);

          this.Appointments.forEach((appointment) => {
            if (appointment.FK_Schedule === this.editedItem.FK_Schedule) {
              appointment.Schedule = this.editedItem.Schedule;
            }
          });
        }
      } catch (error) {
        console.log(error);
      }
    },

    async continue12() {
      try {
        await this.reschedule();

        this.scheduleUpdated = true;
        this.scheduleNextPage = true;
      } catch (error) {
        console.log(error);
        alert("Failed to update the appointment, please try again.");
      }
    },

    async continue23() {
      try {
        await this.$refs.Email.sendEmail();
        // this.e1 = 3;
        // this.nextContactDialogStepper = true;
        this.emailSent = true;
        this.scheduleNextPage = true;
      } catch (error) {
        console.log(error.response);
      }
    },

    async completeSchedule() {
      try {
        await this.$refs.NextContactStepper.updateNextContact();
        this.$emit("newSchedule");
        this.close();
        this.e1 = 1;
      } catch (error) {
        console.log(error.response);
      }
    },

    scheduleNextStep() {
      switch (this.e1) {
        case 1:
          if (this.response != "Rejected") {
            this.emailDialog = true;
          } else {
            this.e1 = 2; // skip email if parents rejected participation.
            this.nextContactDialogStepper = true;
          }
          break;

        case 2:
          this.nextContactDialogStepper = true;
          break;
      }

      this.e1 += 1;
      this.scheduleNextPage = false;
    },

    close() {
      this.dialog = false;
      setTimeout(() => {
        this.studyDate = null;
        this.studyTime = "09:00AM";
        this.e1 = 1;
        this.emailDialog = false;
        this.nextContactDialogStepper = false;
        this.emailSent = false;
        this.scheduleNextPage = false;
        this.scheduleUpdated = false;
      }, 300);
    },
  },

  computed: {
    studyDateTime: function() {
      var StudyTimeString = this.studyTime.slice(0, 5);
      var AMPM = this.studyTime.slice(5, 7);
      var StudyHour = StudyTimeString.split(":")[0];
      var StudyMin = StudyTimeString.split(":")[1];

      switch (AMPM) {
        case "PM":
          if (parseInt(StudyHour) < 12) {
            StudyHour = parseInt(StudyHour) + 12;
          }
          break;

        case "AM":
          StudyHour = parseInt(StudyHour);
          break;
      }

      StudyMin = parseInt(StudyMin);
      var studyDateTime =
        new Date(this.studyDate).getTime() +
        StudyHour * 3600 * 1000 +
        StudyMin * 60000 +
        new Date(this.studyDate).getTimezoneOffset() * 60000;

      studyDateTime = new Date(studyDateTime);
      return studyDateTime;
    },
    earliestDate: function() {
      if (
        moment(new Date())
          .add(1, "days")
          .isSameOrAfter(
            moment(this.editedItem.Child.DoB).add(
              Math.floor(this.editedItem.Study.MinAge * 30.5),
              "days"
            )
          )
      ) {
        return moment(new Date())
          .add(1, "days")
          .toISOString(true);
      } else {
        return moment(this.editedItem.Child.DoB)
          .add(Math.floor(this.editedItem.Study.MinAge * 30.5), "days")
          .toISOString(true);
      }
    },
    latestDate: function() {
      return moment(this.editedItem.Child.DoB)
        .add(Math.floor(this.editedItem.Study.MaxAge * 30.5), "days")
        .toISOString(true);
    },
    TodaysDate() {
      return moment()
        .startOf("day")
        .format("YYYY-MM-DD");
    },
  },

  watch: {
    dialog(val) {
      val || this.close();
    },
  },
};
</script>

<style lang="css" scoped>
.theme--light.v-icon {
  color: var(--v-primary-base);
  font-size: 28px;
  padding-left: 2px;
  padding-right: 2px;
}

.theme--light.v-data-table /deep/ thead /deep/ tr th:hover {
  color: var(--v-secondary-base) !important;
}

.v-data-table
  /deep/
  tbody
  /deep/
  tr:hover:not(.v-data-table__expanded__content) {
  /* border-bottom-width: 2px !important; */
  background-color: var(--v-secondary-lighten1) !important;
}
</style>
