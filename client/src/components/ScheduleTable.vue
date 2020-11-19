<template>
  <v-data-table
    hide-default-footer
    disable-pagination
    fixed-header
    :height="tableHeight"
    single-select
    no-data-text="No study schedule to display."
    :headers="this.$headersSchedule"
    :items="Schedules"
    class="elevation-1"
    @click:row="rowSelected"
    single-expand
  >
    <template #item.Child="{ item }">
      <ChildNameSchedule :item="item" />
    </template>
    <template #item.Study="{ item }">
      <StudyNameSchedule :item="item" />
    </template>
    <template #item.AppointmentTime="{ item, value }">
      <DateDisplay :date="value" :format="'long'" :status="item.Status" />
    </template>
    <template #item.updatedAt="{ item, value }">
      <DateDisplay :date="value" :format="'short'" :status="item.Status" />
    </template>
    <template #item.AgeByParticipation="{ item }">
      <AgeByParticipationSchedule :item="item" />
    </template>

    <template #item.actions="{ item }">
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            @click.stop="updateSchedule(item, 'Confirmed')"
            :disabled="item.Status === 'Confirmed' || item.Completed == true"
            v-bind="attrs"
            v-on="on"
            >event</v-icon
          >
        </template>
        <span>Pick study date and time</span>
      </v-tooltip>

      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            @click.stop="updateSchedule(item, 'Rescheduling')"
            :disabled="
              item.Status === 'Rescheduling' ||
              item.Status === 'No Show' ||
              item.Status === 'TBD' ||
              item.Completed == true
            "
            v-bind="attrs"
            v-on="on"
            >update</v-icon
          >
        </template>
        <span>Reschedule this appointment</span>
      </v-tooltip>

      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            @click.stop="updateSchedule(item, 'No Show')"
            :disabled="
              item.Status === 'Rescheduling' ||
              item.Status === 'No Show' ||
              item.Status === 'TBD' ||
              item.Completed == true
            "
            v-bind="attrs"
            v-on="on"
            >sentiment_dissatisfied</v-icon
          >
        </template>
        <span>No show</span>
      </v-tooltip>

      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            @click.stop="updateSchedule(item, 'Cancelled')"
            :disabled="item.Status === 'Cancelled' || item.Completed == true"
            v-bind="attrs"
            v-on="on"
            >not_interested</v-icon
          >
        </template>
        <span>Cancel this appointment</span>
      </v-tooltip>
    </template>

    <template #item.Reminded="{ item }">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <div v-on="on">
            <v-simple-checkbox
              :value="!!item.Reminded"
              class="mr-0 pa-0"
              @input="updateSchedule(item, 'Reminded')"
              dense
              :disabled="remindIconEnable(item)"
            ></v-simple-checkbox>
          </div>
        </template>
        <span>Confirm reminder is sent</span>
      </v-tooltip>
    </template>

    <template #item.Completed="{ item }">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <div v-on="on">
            <v-simple-checkbox
              :value="!!item.Completed"
              class="mr-0 pa-0"
              @input="updateSchedule(item, 'Completed')"
              dense
              :disabled="completeIconEnable(item)"
            ></v-simple-checkbox>
          </div>
        </template>
        <span>Confirm reminder is sent</span>
      </v-tooltip>
    </template>

    <template #expanded-item="{ headers, item }">
      <td :colspan="headers.length">
        <v-row
          justify="space-between"
          style="background-color: rgba(0, 0, 0, 0); overflow-x: scroll"
        >
          <MiniAppointmentTable
            :Appointments="item.Appointments"
            :Schedule="item"
            :Index="Schedules.indexOf(item)"
            @updateSchedule="updateSchedule"
          ></MiniAppointmentTable>
        </v-row>
      </td>
    </template>

    <template #top>
      <v-dialog
        v-model="nextContactDialog"
        max-width="800px"
        :retain-focus="false"
        persistent
      >
        <v-card outlined>
          <v-card-title>
            <span class="headline">Notes for the next contact</span>
          </v-card-title>
          <NextContact
            ref="NextContact"
            :familyId="editedSchedule.FK_Family"
            :labId="$store.state.lab"
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

      <v-dialog v-model="dialog" max-width="1000px" persistent>
        <v-stepper v-model="e1">
          <v-stepper-header>
            <v-stepper-step
              :complete="e1 > 1"
              editable
              step="1"
              @click="emailDialog = false"
              >Reschedule</v-stepper-step
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
                    >Confirm
                  </v-btn>
                </v-col>
                <v-col cols="12" md="2">
                  <v-btn :disabled="!scheduleNextPage" @click="scheduleNextStep"
                    >Next</v-btn
                  >
                </v-col>
              </v-row>
            </v-stepper-content>
            <v-stepper-content step="2">
              <Email
                ref="Email"
                :dialog="emailDialog"
                :appointments="editedSchedule.Appointments"
                :scheduleInfo="editedSchedule"
                :familyInfo="editedSchedule.Family"
                emailType="Confirmation"
              ></Email>
              <v-divider></v-divider>
              <v-row justify="space-between" align="center">
                <v-col cols="12" md="2"></v-col>
                <v-col cols="12" md="6">
                  <v-btn
                    color="primary"
                    @click="continue23()"
                    :disabled="!editedSchedule.Family.Email"
                  >
                    <v-icon dark left v-show="emailSent"
                      >mdi-checkbox-marked-circle</v-icon
                    >Send Email
                  </v-btn>
                </v-col>
                <v-col cols="12" md="2">
                  <v-btn
                    :disabled="
                      !scheduleNextPage && !!editedSchedule.Family.Email
                    "
                    @click="scheduleNextStep"
                    >{{
                      !!editedSchedule.Family.Email ? "Next" : "Skip email"
                    }}</v-btn
                  >
                </v-col>
              </v-row>
            </v-stepper-content>

            <v-stepper-content step="3">
              <NextContact
                ref="NextContactStepper"
                :familyId="editedSchedule.FK_Family"
                :labId="$store.state.lab"
                :studyDate="studyDate"
                contactType="Confirmed"
                :nextContactDialog="nextContactDialogStepper"
                @nextContactDone="updateNextContactFrontend"
              ></NextContact>
              <v-divider></v-divider>
              <v-row dense justify="center" align="center">
                <v-col>
                  <v-btn color="primary" @click="completeSchedule"
                    >Complete</v-btn
                  >
                </v-col>
              </v-row>
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </v-dialog>
    </template>
  </v-data-table>
</template>

<script>
import DateDisplay from "@/components/DateDisplay";
import AgeByParticipationSchedule from "@/components/AgeByParticipationSchedule";
import ChildNameSchedule from "@/components/ChildNameSchedule";
import StudyNameSchedule from "@/components/StudyNameSchedule";
import MiniAppointmentTable from "@/components/MiniAppointmentTable";

import NextContact from "@/components/NextContact";
import Email from "@/components/Email";

import schedule from "@/services/schedule";

import moment from "moment";

export default {
  components: {
    DateDisplay,
    AgeByParticipationSchedule,
    ChildNameSchedule,
    StudyNameSchedule,
    MiniAppointmentTable,
    Email,
    NextContact,
  },
  props: {
    Schedules: Array,
    studyTimeSlots: Array,
    tableHeight: String,
  },
  data() {
    return {
      e1: 1,
      contactType: "",
      dialog: false,
      editedIndex: -1,
      editedSchedule: {
        FK_Family: 1,
        Family: { NamePrimary: "" },
        Appointments: [
          {
            FK_Family: 1,
            Study: { EmailTemplate: "" },
            Family: { NamePrimary: "" },
            Child: { Name: "" },
          },
        ],
      },
      earliestDate: new Date(),
      latestDate: new Date(),
      studyDate: null,
      studyTime: "09:00AM",
      emailDialog: false,
      scheduleNextPage: false,
      emailSent: false,
      scheduleUpdated: false,
      response: "Confirmed",
      nextContactDate: "",
      nextContactDialog: false,
      nextContactDialogStepper: false,
      defaultSchedule: {
        FK_Family: 1,
        Family: { NamePrimary: "" },
        Appointments: [
          {
            FK_Family: 1,
            Study: { EmailTemplate: "" },
            Family: { NamePrimary: "" },
            Child: { Name: "" },
          },
        ],
      },
    };
  },
  methods: {
    async updateSchedule(item, status) {
      this.$emit("rowSelected", item.Family, this.Schedules.indexOf(item));
      this.response = status;
      switch (status) {
        case "Confirmed":
          this.editedIndex = this.Schedules.indexOf(item);
          this.editedSchedule = Object.assign({}, item);
          this.datePickerRange();
          this.editedSchedule.Appointments[0].Child.Family = {};
          this.editedSchedule.Appointments[0].Child.Family.Email = this.editedSchedule.Family.Email;
          this.editedSchedule.Appointments[0].Child.Family.NamePrimary = this.editedSchedule.Family.NamePrimary;

          this.dialog = true;
          break;

        case "Completed":
          try {
            item.Completed = !item.Completed;
            await schedule.complete(item);
          } catch (error) {
            console.log(error);
          }

          item.updatedAt = new Date().toISOString();
          break;

        case "Reminded":
          try {
            item.Reminded = !item.Reminded;
            await schedule.remind(item);
          } catch (error) {
            console.log(error);
          }

          item.updatedAt = new Date().toISOString();
          break;

        default:
          item.Status = status;

          if (status == "Cancelled") {
            this.$emit("alert");
          }

          // name by combining all study names within a schedule
          var studyNames = item.Appointments.map((appointment) => {
            return (
              appointment.Study.StudyName +
              " (" +
              item.FK_Family +
              appointment.Child.IdWithinFamily +
              ")"
            );
          });

          studyNames = Array.from(new Set(studyNames));

          // Calendar event title
          item.summary =
            item.Status.toUpperCase() + " - " + studyNames.join(" + ");

          try {
            await schedule.update(item);
            item.AppointmentTime = null;
            item.updatedAt = new Date().toISOString();

            console.log("Study appointment updated!");

            this.editedSchedule = Object.assign({}, item);

            // next contact
            this.contactType = status;
            this.nextContactDate = this.TodaysDate;
            this.nextContactDialog = true;
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
          this.editedSchedule.Status = "Confirmed";

          this.editedSchedule.AppointmentTime = moment(
            this.studyDateTime
          ).toISOString(true);

          var studyNames = this.editedSchedule.Appointments.map(
            (appointment) => {
              return (
                appointment.Study.StudyName +
                " (" +
                this.editedSchedule.FK_Family +
                appointment.Child.IdWithinFamily +
                ")"
              );
            }
          );

          studyNames = Array.from(new Set(studyNames));

          this.editedSchedule.summary = studyNames.join(" + ");

          this.editedSchedule.start = {
            dateTime: moment(this.studyDateTime).toISOString(true),
            timeZone: "America/Toronto",
          };
          this.editedSchedule.end = {
            dateTime: moment(this.studyDateTime)
              .add(1, "h") // might change if multiple studies are scheduled for one visit
              .toISOString(true),
            timeZone: "America/Toronto",
          };

          const calendarEvent = await schedule.update(this.editedSchedule);

          this.editedSchedule.calendarEventId = calendarEvent.calendarEventId;
          this.editedSchedule.eventURL = calendarEvent.eventURL;
          this.editedSchedule.updatedAt = new Date().toISOString();

          this.editedSchedule.Appointments[0].Schedule = {};
          this.editedSchedule.Appointments[0].Schedule.AppointmentTime = this.editedSchedule.AppointmentTime;

          Object.assign(this.Schedules[this.editedIndex], this.editedSchedule);
        }

        // this.close();
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

        this.emailSent = true;
        this.scheduleNextPage = true;
      } catch (error) {
        console.log(error);
      }
    },

    async completeSchedule() {
      try {
        await this.$refs.NextContactStepper.updateNextContact();
        // this.$emit("newSchedule");
        this.close();
      } catch (error) {
        console.log(error);
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

    rowSelected(item, row) { 
      row.select(true);
      row.expand(!row.isExpanded);
      this.$emit("rowSelected", item.Family, this.Schedules.indexOf(item));
    },

    datePickerRange() {
      if (this.editedSchedule.Appointments) {
        var minAges = this.editedSchedule.Appointments.map((appointment) => {
          return moment(appointment.Child.DoB).add(
            Math.floor(appointment.Study.MinAge * 30.5),
            "days"
          );
        });

        minAges.push(moment());

        var MinAge = moment.max(minAges);

        this.earliestDate = MinAge.toISOString(true);

        var maxAges = this.editedSchedule.Appointments.map((appointment) => {
          return moment(appointment.Child.DoB).add(
            Math.floor(appointment.Study.MaxAge * 30.5),
            "days"
          );
        });

        var MaxAge = moment.min(maxAges);

        this.latestDate = MaxAge.toISOString(true);
      }
    },

    remindIconEnable(item) {
      var iconDisable = true;
      var daysAheadofSchedule = 1;

      if (moment(item.AppointmentTime).day() == 1) {
        daysAheadofSchedule = 3;
      }

      switch (item.Status) {
        case "Confirmed":
          if (
            moment(item.AppointmentTime).startOf("day") <=
              moment().startOf("day").add(daysAheadofSchedule, "d") 
              &&
            moment(item.AppointmentTime).startOf("day") >=
              moment().startOf("day")
          ) {
            iconDisable = false;
          }

          break;
       
      }

      return iconDisable;
    },

    completeIconEnable(item) {
      var iconDisable = true;

      switch (item.Status) {
        case "Confirmed":
          if (new Date(item.AppointmentTime) <= new Date()) {
            iconDisable = false;
          }

          break;

      }

      return iconDisable;
    },
  },

  computed: {
    studyDateTime: function () {
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
    TodaysDate() {
      return moment().startOf("day").format("YYYY-MM-DD");
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

/* .theme--light.v-data-table /deep/ thead /deep/ tr th:hover {
  color: var(--v-secondary-base) !important;
}

.v-data-table
  /deep/
  tbody
  /deep/
  tr:hover:not(.v-data-table__expanded__content) {
  border-bottom-width: 2px !important;
  background-color: var(--v-secondary-lighten1) !important;
} */

/deep/ tr.v-data-table__selected {
  /* color: var(--v-secondary-lighten1) !important; */
  /* margin: 2px !important;
  border-style: double   !important; */
  background-color: var(--v-secondary-lighten1) !important;
}
</style>
