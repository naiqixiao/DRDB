<template>
  <v-data-table
    hide-default-footer
    disable-pagination
    fixed-header
    single-select
    no-data-text="The family hasn't participated in any study."
    :headers="this.$headersAppointments"
    :items="Appointments"
    class="elevation-1"
    @click:row="rowSelected"
  >
    <template v-slot:top>
      <v-dialog v-model="dialog" max-width="760px" :retain-focus="false">
        <v-card>
          <v-card-title class="headline"
            >Select study date and time.</v-card-title
          >
          <template>
            <v-container fluid>
              <v-row style="height: 400px;" justify="space-around">
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
        class="pr-1"
        @click="updateSchedule(item, 'Confirmed')"
        :disabled="
          item.Schedule.Status === 'Confirmed' || item.Schedule.Completed == 1
        "
        >event</v-icon
      >
      <v-icon
        class="pr-1"
        @click="updateSchedule(item, 'Rescheduling')"
        :disabled="
          item.Schedule.Status === 'Rescheduling' ||
            item.Schedule.Status === 'No Show' ||
            item.Schedule.Status === 'TBD' ||
            item.Schedule.Completed == 1
        "
        >update</v-icon
      >
      <v-icon
        class="pr-1"
        @click="updateSchedule(item, 'No Show')"
        :disabled="
          item.Schedule.Status === 'Rescheduling' ||
            item.Schedule.Status === 'No Show' ||
            item.Schedule.Status === 'TBD' ||
            item.Schedule.Completed == 1
        "
        >sentiment_dissatisfied</v-icon
      >
      <v-icon
        @click="updateSchedule(item, 'Cancelled')"
        :disabled="
          item.Schedule.Status === 'Cancelled' || item.Schedule.Completed == 1
        "
        >not_interested</v-icon
      >
    </template>

    <template #item.Schedule.Completed="{ item }">
      <v-simple-checkbox
        v-model="item.Schedule.Completed"
        class="mr-0 pa-0"
        @input="updateSchedule(item, 'Completed')"
        dense
      ></v-simple-checkbox>
    </template>
  </v-data-table>
</template>

<script>
import DateDisplay from "@/components/DateDisplay";
import AgeByParticipation from "@/components/AgeByParticipation";

// import appointment from "@/services/appointment";
import schedule from "@/services/schedule";

import moment from "moment";

export default {
  components: {
    DateDisplay,
    AgeByParticipation,
  },
  props: {
    Appointments: Array,
    studyTimeSlots: Array,
  },
  data() {
    return {
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
            await schedule.update(item.Schedule);
          } catch (error) {
            console.log(error.response);
          }
          break;

        default:
          item.Schedule.Status = status;

          if (status == "Cancelled") {
            this.$emit("alert");
          }

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
                appointment.Schedule = this.item.Schedule;
              }
            });

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
        this.editedItem = {
          Study: {
            MinAge: 6,
            MaxAge: 18,
          },
          Child: {
            Name: null,
            DoB: new Date(),
          },
        };
        this.editedIndex = -1;
        this.studyDate = null;
        this.studyTime = "09:00AM";
      }, 300);
    },

    async save() {
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

        this.close();
      } catch (error) {
        console.log(error.response);
      }
    },

    rowSelected(item, row) {
      row.select(true);
      this.$emit("rowSelected", item.FK_Family);
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
  },
  watch: {
    dialog(val) {
      val || this.close();
    },
  },
};
</script>

<style lang="scss" scoped>
</style>
