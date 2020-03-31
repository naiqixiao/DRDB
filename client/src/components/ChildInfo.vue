<template>
  <v-row dense>
    <v-col cols="6" v-for="(child, index) in Children" :key="child.id" dense>
      <div>
        <v-dialog v-model="dialog" max-width="760px" :retain-focus="false">
          <v-card>
            <v-card-title>
              <span class="headline">Edit child's information</span>
            </v-card-title>

            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.Name"
                      :rules="[rules.required, rules.name]"
                      label="Name"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.DoB"
                      :rules="[rules.required, rules.dob]"
                      label="Date of birth (YYYY-MM-DD)"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-select
                      v-model="editedItem.Sex"
                      :items="Sex"
                      filled
                      label="Sex"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.BirthWeight"
                      :rules="[rules.birthWeight]"
                      label="Birth weight"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="green darken-1" text @click="dialog = false"
                >Cancel</v-btn
              >
              <v-btn color="green darken-1" text @click="save">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>

      <div>
        <v-dialog
          v-model="dialogSchedule"
          max-width="1200px"
          :retain-focus="false"
        >
          <v-card>
            <v-card-title class="headline">Schedule a study</v-card-title>
            <template>
              <v-container fluid>
                <v-row
                  class="grey lighten-5"
                  style="height: 600px"
                  justify="space-around"
                >
                  <v-col cols="12" lg="5">
                    <v-card-title class="headline">{{
                      editedItem.Name
                    }}</v-card-title>
                    <AgeDisplay :DoB="editedItem.DoB" />

                    <v-select
                      :items="PotentialStudies[editedIndex]"
                      :item-value="'id'"
                      :item-text="'StudyName'"
                      v-model="selectedStudy"
                      return-object
                      filled
                      label="Elegible Studies"
                    ></v-select>
                    <v-select
                      :items="Responses"
                      v-model="response"
                      filled
                      label="Parents' response"
                    ></v-select>
                  </v-col>
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
                  </v-col>
                </v-row>
              </v-container>
            </template>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="green darken-1" text @click="closeSchedule"
                >Cancel</v-btn
              >
              <v-btn color="green darken-1" text @click="createAppointment"
                >Confirm</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>

      <v-card class="mx-auto" max-width="350px" max-height="300px">
        <v-card-title>{{ child.Name }}</v-card-title>

        <v-card-subtitle justify="start">
          <AgeDisplay :DoB="child.DoB" />
        </v-card-subtitle>
        <v-card-actions>
          <v-btn text @click.stop="editChild(child, index)">Edit</v-btn>
          <v-btn
            text
            :disabled="PotentialStudies[index].length < 1"
            @click.stop="Schedule(child, index)"
            >Schedule</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-col>

    <v-card class="mx-auto" max-width="350px" max-height="300px">
      <v-card-actions>
        <v-btn color="purple" text @click.stop="addChild" :disabled="!familyId"
          >Add</v-btn
        >
      </v-card-actions>
    </v-card>

    <div>
      <v-dialog
        v-model="dialogNewChild"
        max-width="760px"
        :retain-focus="false"
      >
        <v-card>
          <v-card-title>
            <span class="headline">Edit child's information</span>
          </v-card-title>

          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field
                    v-model="editedItem.Name"
                    :rules="[rules.required, rules.name]"
                    label="Name"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field
                    v-model="editedItem.DoB"
                    :rules="[rules.required, rules.dob]"
                    label="Date of birth (YYYY-MM-DD)"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-select
                    v-model="editedItem.Sex"
                    :items="Sex"
                    filled
                    label="Sex"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field
                    v-model="editedItem.BirthWeight"
                    :rules="[rules.birthWeight]"
                    label="Birth weight"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" text @click="dialog = false"
              >Cancel</v-btn
            >
            <v-btn color="green darken-1" text @click="save">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </v-row>
</template>

<script>
import AgeDisplay from "@/components/AgeDisplay";

import child from "@/services/child";
import store from "@/store";

import appointment from "@/services/appointment";
import moment from "moment";

export default {
  components: {
    AgeDisplay
  },
  props: {
    Children: Array,
    familyId: Number
  },
  data() {
    return {
      dialog: false,
      dialogSchedule: false,
      dialogNewChild: false,
      editedIndex: -1,
      selectedStudy: {
        MinAge: 6,
        MaxAge: 18
      },
      editedItem: {
        Name: null,
        Sex: null,
        DoB: new Date().toISOString(),
        FK_Family: this.familyId,
        Age: null,
        Hearingloss: 0,
        VisionLoss: 0,
        PrematureBirth: 0,
        Illness: 0,
        Note: null,
        BirthWeight: null,
        Appointments: []
      },
      defaultItem: {
        Name: null,
        Sex: null,
        DoB: null,
        FK_Family: this.familyId,
        Age: null,
        Hearingloss: 0,
        VisionLoss: 0,
        PrematureBirth: 0,
        Illness: 0,
        Note: null,
        BirthWeight: null,
        Appointments: []
      },
      Responses: ["Confirmed", "Interested", "Left a message", "Rejected"],
      response: null,
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
      Sex: ["F", "M"],
      rules: {
        required: value => !!value || "Required.",
        counter: value => value.length <= 30 || "Max 30 characters",
        dob: value => {
          var pattern = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
          return pattern.test(value) || "Invalid Date of Birth.";
        },
        birthWeight: value => {
          var pattern = /^[0-9]{1,2}[:.,-]?$/;
          return pattern.test(value) || "Invalid Birth Weight.";
        },
        name: value => {
          var pattern = /^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/;
          return pattern.test(value) || "Invalid Name.";
        }
      }
    };
  },
  methods: {
    addChild() {
      this.editedIndex = -1;
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedItem.FK_Family = this.familyId;
      this.dialogNewChild = true;
    },

    editChild(child, index) {
      this.editedIndex = index;
      this.editedItem = Object.assign({}, child);
      this.dialog = true;
    },

    async save() {
      try {
        if (this.editedIndex > -1) {
          this.editedItem.Age = Math.floor(
            (new Date() - new Date(this.editedItem.DoB)) / (24 * 3600 * 1000)
          );

          await child.update(this.editedItem);

          Object.assign(this.Children[this.editedIndex], this.editedItem);

          console.log("Child information updated!");

          this.close();
        } else {
          this.editedItem.Age = Math.floor(
            (new Date() - new Date(this.editedItem.DoB)) / (24 * 3600 * 1000)
          );

          await child.create(this.editedItem);

          this.Children.push(this.editedItem);

          console.log("Child is creted and siblings are updated!");

          this.closeNewChild();
        }
      } catch (error) {
        console.log(error.response);
      }
    },

    close() {
      this.dialog = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    },

    async Schedule(child, index) {
      this.editedIndex = index;
      this.editedItem = Object.assign({}, child);
      this.dialogSchedule = true;
    },

    async createAppointment() {
      var newAppointmentInfo = {};

      switch (this.response) {
        case "Comfirmed":
          newAppointmentInfo = {
            AppointmentTime: moment(this.studyDateTime).toISOString(true),
            Status: this.response,
            FK_Study: this.selectedStudy.id,
            summary:
              this.selectedStudy.StudyName +
              ", Family: " +
              this.editedItem.FK_Family +
              ", Child: " +
              this.editedItem.id,
            FK_Family: this.editedItem.FK_Family,
            FK_Child: this.editedItem.id,
            ScheduledBy: store.state.userID,
            location: "Psychology Building, McMaster University",
            start: {
              dateTime: moment(this.studyDateTime).toISOString(true),
              timeZone: "America/Toronto"
            },
            end: {
              dateTime: moment(this.studyDateTime)
                .add(1, "h")
                .toISOString(true),
              timeZone: "America/Toronto"
            },
            attendees: [
              {
                email: "g.jaeger0226@gmail.com" // will change to experiments' emails later.
              }
            ]
          };

          break;

        default:
          newAppointmentInfo = {
            AppointmentTime: null,
            Status: this.response,
            FK_Study: this.selectedStudy.id,
            FK_Family: this.editedItem.FK_Family,
            FK_Child: this.editedItem.id,
            ScheduledBy: store.state.userID
          };

          if (
            this.response === "Left a message" ||
            this.response === "Interested"
          ) {
            newAppointmentInfo.Status = "TBD";
          }
          break;
      }
      try {
        const newAppointment = await appointment.create(newAppointmentInfo);

        this.Children[this.editedIndex].Appointments.push({
          FK_Study: newAppointment.data.FK_Study
        });

        console.log("New appointment scheduled!");

        this.$emit("createAppointment");
      } catch (error) {
        console.log(error.response);
      }

      this.closeSchedule();
    },

    closeSchedule() {
      this.dialogSchedule = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        this.response = null;
        this.studyDate = null;
        this.studyTime = "09:00AM";
      }, 300);
    },

    closeNewChild() {
      this.dialogNewChild = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    }
  },
  computed: {
    ElegibleStudies: function() {
      var elegibleStudies = this.Children.map(child => {
        let studyIds = [];
        store.state.studies.forEach(study => {
          if (
            child.Age >= study.MinAge * 30.5 &&
            child.Age <= study.MaxAge * 30.5
          ) {
            studyIds.push(study.id);
          }
        });
        return studyIds;
      });

      return elegibleStudies;
    },

    UniquePreviousStudies: function() {
      return this.Children.map(child => {
        let studyIds = [];
        child.Appointments.forEach(appointment => {
          studyIds.push(appointment.FK_Study);
        });

        return studyIds;
      });
    },

    PotentialStudies: function() {
      var PotentialStudies = [];
      for (var i = 0; i < this.ElegibleStudies.length; i++) {
        var elegibleStudy = this.ElegibleStudies[i];
        var previousStudies = this.UniquePreviousStudies[i];

        previousStudies = Array.from(new Set(previousStudies));

        let potentialStudyIds = elegibleStudy.filter(
          study => !previousStudies.includes(study)
        );

        var PotentialStudyList = store.state.studies.filter(study =>
          potentialStudyIds.includes(study.id)
        );

        PotentialStudies.push(PotentialStudyList);
      }

      return PotentialStudies;
    },

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
            moment(this.editedItem.DoB).add(
              Math.floor(this.selectedStudy.MinAge * 30.5),
              "days"
            )
          )
      ) {
        return moment(new Date())
          .add(1, "days")
          .toISOString(true);
      } else {
        return moment(this.editedItem.DoB)
          .add(Math.floor(this.selectedStudy.MinAge * 30.5), "days")
          .toISOString(true);
      }
    },

    latestDate: function() {
      return moment(this.editedItem.DoB)
        .add(Math.floor(this.selectedStudy.MaxAge * 30.5), "days")
        .toISOString(true);
    }
  },
  watch: {
    dialog(val) {
      val || this.close();
    },

    dialogSchedule(val) {
      val || this.closeSchedule();
    },

    dialogNewChild(val) {
      val || this.closeNewChild();
    }
  }
};
</script>

<style lang="scss" scoped></style>
