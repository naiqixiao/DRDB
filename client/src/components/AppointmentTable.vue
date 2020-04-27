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
          item.Schedule.Status === 'Confirmed' || item.Schedule.Completed == 1
        "
        >event</v-icon
      >
      <v-icon
        @click.stop="updateSchedule(item, 'Rescheduling')"
        :disabled="
          item.Schedule.Status === 'Rescheduling' ||
            item.Schedule.Status === 'No Show' ||
            item.Schedule.Status === 'TBD' ||
            item.Schedule.Completed == 1
        "
        >update</v-icon
      >
      <v-icon
        @click.stop="updateSchedule(item, 'No Show')"
        :disabled="
          item.Schedule.Status === 'Rescheduling' ||
            item.Schedule.Status === 'No Show' ||
            item.Schedule.Status === 'TBD' ||
            item.Schedule.Completed == 1
        "
        >sentiment_dissatisfied</v-icon
      >
      <v-icon
        @click.stop="updateSchedule(item, 'Cancelled')"
        :disabled="
          item.Schedule.Status === 'Cancelled' || item.Schedule.Completed == 1
        "
        >not_interested</v-icon
      >

      <v-dialog v-model="dialog" max-width="1200px" :retain-focus="false">
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
                  <v-col cols="12" lg="6">
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
                    ></v-combobox>
                    <h3>{{ studyDateTime }}</h3>
                  </v-col>
                </v-row>
                <!-- <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="green darken-1" text @click="close"
                    >Cancel</v-btn
                  >
                  <v-btn color="green darken-1" text @click="save"
                    >Confirm</v-btn
                  >
                </v-card-actions> -->
              </v-card>
              <v-btn
                text
                color="green darken-1"
                :disabled="!studyDateTime"
                @click="continue12()"
              >
                Confirm
              </v-btn>
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

              <v-btn text color="green darken-2" @click="continue23()">
                Send Email
              </v-btn>
            </v-stepper-content>

            <v-stepper-content step="3">
              <NextContact
                ref="NextContact"
                :familyId="family.id"
                :studyDate="studyDate"
                contactType="Confirmed"
                :nextContactDialog="nextContactDialogStepper"
                @nextContactDone="updateNextContactFrontend"
              ></NextContact>
              <v-btn text color="primary" @click="completeSchedule()">
                Complete
              </v-btn>
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
            <v-spacer></v-spacer>
            <v-btn
              color="green darken-1"
              text
              @click="nextContactDialog = false"
              >Cancel</v-btn
            >
            <v-btn color="green darken-1" text @click="updateNextContact"
              >Save</v-btn
            >
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

          var studyNames = this.Appointments.map((appointment) => {
            return appointment.Study.StudyName;
          });

          item.Schedule.summary =
            item.Schedule.Status.toUpperCase() +
            " - " +
            studyNames.join(" + ") +
            ", Family: " +
            item.FK_Family +
            ", Child: " +
            item.FK_Child;

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

    close() {
      this.dialog = false;
      setTimeout(() => {
        // this.editedItem = {
        //   Study: {
        //     MinAge: 6,
        //     MaxAge: 18,
        //   },
        //   Child: {
        //     Name: null,
        //     DoB: new Date(),
        //   },
        // };
        // this.editedIndex = -1;
        this.studyDate = null;
        this.studyTime = "09:00AM";
        this.e1 = 1;
        this.emailDialog = false;
        this.nextContactDialogStepper = false;
      }, 300);
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

          var studyNames = "";

          this.Appointments.forEach((appointment) => {
            if (appointment.FK_Schedule === this.editedItem.FK_Schedule) {
              studyNames += appointment.Study.StudyName + " + ";
            }
          });

          studyNames = studyNames.slice(0, studyNames.length - 3);

          this.editedItem.Schedule.summary =
            studyNames +
            ", Family: " +
            this.editedItem.FK_Family +
            ", Child: " +
            this.editedItem.FK_Child;

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

        this.e1 = 2;
        this.emailDialog = true;
      } catch (error) {
        console.log(error);
      }
    },

    async continue23() {
      try {
        await this.$refs.Email.sendEmail();
        this.e1 = 3;
        this.nextContactDialogStepper = true;
      } catch (error) {
        console.log(error.response);
      }
    },

    async completeSchedule() {
      try {
        await this.$refs.NextContact.updateNextContact();
        this.$emit("newSchedule");
        this.close();
        this.e1 = 1;
      } catch (error) {
        console.log(error.response);
      }
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

<style scoped>
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
