<template>
  <v-data-table
    hide-default-footer
    height="380px"
    dense
    fixed-header
    single-select
    no-data-text="The family hasn't participated in any study."
    :headers="headersAppointments"
    :items="Appointments"
    class="elevation-1"
  >
    <template v-slot:top>
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

    <template #item.AppointmentTime="{ value }">
      <DateDisplay :date="value" :format="'long'" />
    </template>
    <template #item.updatedAt="{ value }">
      <DateDisplay :date="value" :format="'short'" />
    </template>
    <template #item.AgeByParticipation="{ item }">
      <AgeByParticipation :item="item" />
    </template>

    <template v-slot:item.actions="{ item }">
      <v-icon @click="updateAppointment(item, 'Confirmed')">event</v-icon>
      <v-icon @click="updateAppointment(item, 'Rescheduling')">update</v-icon>
      <v-icon @click="updateAppointment(item, 'No Show')"
        >sentiment_dissatisfied</v-icon
      >
      <v-icon @click="updateAppointment(item, 'Cancelled')"
        >not_interested</v-icon
      >
    </template>

    <template v-slot:item.Completed="{ item }">
      <v-checkbox
        dense
        class="mr-0 pa-0"
        v-model="item.Completed"
        @change="updateAppointment(item, 'Completed')"
      ></v-checkbox>
    </template>
  </v-data-table>
</template>

<script>
import DateDisplay from "@/components/DateDisplay";
import AgeByParticipation from "@/components/AgeByParticipation";

import appointment from "@/services/appointment";
import moment from "moment";

export default {
  components: {
    DateDisplay,
    AgeByParticipation
  },
  props: {
    Appointments: Array
  },
  data() {
    return {
      dialog: false,
      editedIndex: -1,
      editedItem: {
        Study: {
          MinAge: 6,
          MaxAge: 18
        },
        Child: {
          Name: null,
          DoB: new Date()
        }
      },
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
        "06:00PM"
      ],
      headersAppointments: [
        { text: "Child", align: "center", value: "Child.Name" },
        { text: "Study", align: "center", value: "Study.StudyName" },
        { text: "Study Time", align: "center", value: "AppointmentTime" },
        {
          text: "Age by Participation",
          align: "center",
          value: "AgeByParticipation"
        },
        { text: "Status", align: "center", value: "Status" },
        { text: "Updated Time", align: "center", value: "updatedAt" },

        { text: "Actions", align: "center", value: "actions", sortable: false },
        { text: "Completion", align: "center", value: "Completed" }
      ]
    };
  },
  methods: {
    async updateAppointment(item, status) {
      switch (status) {
        case "Confirmed":
          this.editedIndex = this.Appointments.indexOf(item);
          this.editedItem = Object.assign({}, item);
          this.dialog = true;
          break;

        case "Completed":
          try {
            await appointment.update(item);
            console.log("study completed!");
          } catch (error) {
            console.log(error.response);
          }
          break;

        default:
          item.Status = status;
          try {
            await appointment.update(item);
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
        this.editedItem = {
          Study: {
            MinAge: 6,
            MaxAge: 18
          },
          Child: {
            Name: null,
            DoB: new Date()
          }
        };
        this.editedIndex = -1;
        studyDate = null;
        studyTime = "09:00AM";
      }, 300);
    },

    async save() {
      try {
        if (this.editedIndex > -1) {
          this.editedItem.Status = "Confirmed";
          this.editedItem.AppointmentTime = moment(
            this.studyDateTime
          ).toISOString(true);
          this.editedItem.start = {
            dateTime: moment(this.studyDateTime).toISOString(true),
            timeZone: "America/Toronto"
          };
          this.editedItem.end = {
            dateTime: moment(this.studyDateTime)
              .add(1, "h")
              .toISOString(true),
            timeZone: "America/Toronto"
          };

          await appointment.update(this.editedItem);

          this.editedItem.updatedAt = new Date().toISOString();

          Object.assign(this.Appointments[this.editedIndex], this.editedItem);
        }

        this.close();
      } catch (error) {
        console.log(error.response);
      }
    }
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
    }
  },
  watch: {
    dialog(val) {
      val || this.close();
    }
  }
};
</script>

<style lang="scss" scoped></style>
