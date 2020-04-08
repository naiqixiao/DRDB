<template>
  <v-data-table
    hide-default-footer
    disable-pagination
    fixed-header
    height="700"
    single-select
    no-data-text="No study schedule to display."
    :headers="headersSchedule"
    :items="Schedules"
    class="elevation-1"
    @click:row="rowSelected"
    show-expand
    single-expand
  >
    <template #top>
      <v-dialog v-model="dialog" max-width="760px" :retain-focus="false">
        <v-card>
          <v-card-title class="headline"
            >Select study date and time.</v-card-title
          >
          <template>
            <v-container fluid>
              <v-row
                class="grey lighten-5"
                style="height: 400px;"
                justify="space-around"
              >
                <v-col cols="12" lg="5">
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
            </v-container>
          </template>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" text @click="close">Cancel</v-btn>
            <v-btn color="green darken-1" text @click="save">Confirm</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>

    <template #item.Child="{ item }">
      <ChildNameSchedule :item="item" />
    </template>
    <template #item.Study="{ item }">
      <StudyNameSchedule :item="item" />
    </template>
    <template #item.AppointmentTime="{ value }">
      <DateDisplay :date="value" :format="'long'" />
    </template>
    <template #item.updatedAt="{ value }">
      <DateDisplay :date="value" :format="'short'" />
    </template>
    <template #item.AgeByParticipation="{ item }">
      <AgeByParticipationSchedule :item="item" />
    </template>

    <template #item.actions="{ item }">
      <v-icon
        @click="updateSchedule(item, 'Confirmed')"
        :disabled="item.Status === 'Confirmed' || item.Completed == 1"
        >event</v-icon
      >
      <v-icon
        @click="updateSchedule(item, 'Rescheduling')"
        :disabled="
          item.Status === 'Rescheduling' ||
            item.Status === 'No Show' ||
            item.Status === 'TBD' ||
            item.Completed == 1
        "
        >update</v-icon
      >
      <v-icon
        @click="updateSchedule(item, 'No Show')"
        :disabled="
          item.Status === 'Rescheduling' ||
            item.Status === 'No Show' ||
            item.Status === 'TBD' ||
            item.Completed == 1
        "
        >sentiment_dissatisfied</v-icon
      >
      <v-icon
        @click="updateSchedule(item, 'Cancelled')"
        :disabled="item.Status === 'Cancelled' || item.Completed == 1"
        >not_interested</v-icon
      >
    </template>

    <template #item.Completed="{ item }">
      <v-switch
        v-model="item.Completed"
        class="mr-0 pa-0"
        @change="updateSchedule(item, 'Completed')"
        dense
      ></v-switch>
    </template>

    <template #expanded-item="{ headers, item }">
      <td :colspan="headers.length">
        <v-row class="grey lighten-5" justify="space-around">
          <v-col cols="12" md="12">
            <MiniAppointmentTable
              :Appointments="item.Appointments"
              @updateSchedule="updateSchedule"
            ></MiniAppointmentTable>
          </v-col>
        </v-row>
      </td>
    </template>
  </v-data-table>
</template>

<script>
import DateDisplay from "@/components/DateDisplay";
import AgeByParticipationSchedule from "@/components/AgeByParticipationSchedule";
import ChildNameSchedule from "@/components/ChildNameSchedule";
import StudyNameSchedule from "@/components/StudyNameSchedule";
import MiniAppointmentTable from "@/components/MiniAppointmentTable";

import schedule from "@/services/schedule";

import moment from "moment";

export default {
  components: {
    DateDisplay,
    AgeByParticipationSchedule,
    ChildNameSchedule,
    StudyNameSchedule,
    MiniAppointmentTable,
  },
  props: {
    Schedules: Array,
  },
  data() {
    return {
      dialog: false,
      editedIndex: -1,
      editedItem: {},
      earliestDate: new Date(),
      latestDate: new Date(),
      studyDate: null,
      studyTime: "09:00AM",
      studyTimeSlots: [
        "08:30AM",
        "09:00AM",
        "09:30AM",
        "10:00AM",
        "10:30AM",
        "11:00AM",
        "11:30AM",
        "12:00PM",
        "12:30PM",
        "01:00PM",
        "01:30PM",
        "02:00PM",
        "02:30PM",
        "03:00PM",
        "03:30PM",
        "04:00PM",
        "04:30PM",
        "05:00PM",
        "05:30PM",
        "06:00PM",
      ],
      headersSchedule: [
        {
          text: "Child",
          align: "center",
          value: "Child",
          width: "50px",
        },
        {
          text: "Study",
          align: "center",
          value: "Study",
          width: "50px",
        },
        {
          text: "Study Time",
          align: "center",
          value: "AppointmentTime",
          width: "100px",
        },
        {
          text: "Age by Participation",
          align: "center",
          value: "AgeByParticipation",
          width: "80px",
        },
        {
          text: "Status",
          align: "center",
          value: "Status",
          width: "80px",
        },
        {
          text: "Updated Time",
          align: "center",
          value: "updatedAt",
          width: "80px",
        },

        {
          text: "Actions",
          align: "center",
          value: "actions",
          sortable: false,
          width: "80px",
        },
        {
          text: "Completion",
          align: "start",
          value: "Completed",
          sortable: false,
          width: "80px",
        },
      ],
    };
  },
  methods: {
    async updateSchedule(item, status) {
      switch (status) {
        case "Confirmed":
          this.editedIndex = this.Schedules.indexOf(item);
          this.editedItem = Object.assign({}, item);
          this.datePickerRange();
          this.dialog = true;
          break;

        case "Completed":
          try {
            await schedule.update(item);
          } catch (error) {
            console.log(error.response);
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
            return appointment.Study.StudyName;
          });

          var childNames = item.Appointments.map((appointment) => {
            return appointment.FK_Child;
          });

          childNames = Array.from(new Set(childNames));

          // Calendar event title
          item.summary =
            item.Status.toUpperCase() +
            " - " +
            studyNames.join(" + ") +
            ", Family: " +
            item.Appointments[0].FK_Family +
            ", Child: " +
            childNames.join(" + ");

          try {
            await schedule.update(item);
            item.AppointmentTime = null;
            item.updatedAt = new Date().toISOString();

            console.log("appointment updated!");
          } catch (error) {
            console.log(error.response);
          }
          break;
      }
    },

    close() {
      this.dialog = false;
      setTimeout(() => {
        this.editedItem = {};
        this.editedIndex = -1;
        this.studyDate = null;
        this.studyTime = "09:00AM";
      }, 300);
    },

    async save() {
      try {
        if (this.editedIndex > -1) {
          this.editedItem.Status = "Confirmed";

          this.editedItem.AppointmentTime = moment(
            this.studyDateTime
          ).toISOString(true);

          var studyNames = this.editedItem.Appointments.map((appointment) => {
            return appointment.Study.StudyName;
          });

          var childNames = this.editedItem.Appointments.map((appointment) => {
            return appointment.FK_Child;
          });

          childNames = Array.from(new Set(childNames));

          this.editedItem.summary =
            studyNames.join(" + ") +
            ", Family: " +
            this.editedItem.Appointments[0].FK_Family +
            ", Child: " +
            childNames.join(" + ");

          this.editedItem.start = {
            dateTime: moment(this.studyDateTime).toISOString(true),
            timeZone: "America/Toronto",
          };
          this.editedItem.end = {
            dateTime: moment(this.studyDateTime)
              .add(1, "h") // might change if multiple studies are scheduled for one visit
              .toISOString(true),
            timeZone: "America/Toronto",
          };

          const calendarEvent = await schedule.update(this.editedItem);

          this.editedItem.calendarEventId = calendarEvent.calendarEventId;
          this.editedItem.eventURL = calendarEvent.eventURL;
          this.editedItem.updatedAt = new Date().toISOString();

          Object.assign(this.Schedules[this.editedIndex], this.editedItem);
        }

        this.close();
      } catch (error) {
        console.log(error.response);
      }
    },

    rowSelected(item, row) {
      row.select(true);
      this.$emit("rowSelected", item.Appointments[0].FK_Family);
    },

    datePickerRange() {
      if (this.editedItem.Appointments) {
        var minAges = this.editedItem.Appointments.map((appointment) => {
          return moment(appointment.Child.DoB).add(
            Math.floor(appointment.Study.MinAge * 30.5),
            "days"
          );
        });

        minAges.push(moment());

        var MinAge = moment.max(minAges);

        this.earliestDate = MinAge.toISOString(true);

        var maxAges = this.editedItem.Appointments.map((appointment) => {
          return moment(appointment.Child.DoB).add(
            Math.floor(appointment.Study.MaxAge * 30.5),
            "days"
          );
        });

        var MaxAge = moment.min(maxAges);

        this.latestDate = MaxAge.toISOString(true);
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
  },
  watch: {
    dialog(val) {
      val || this.close();
    },
  },
};
</script>

<style lang="scss" scoped></style>
