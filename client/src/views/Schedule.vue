<template>
  <!-- <v-container fluid> -->
  <v-row class="grey lighten-5" style="height: 400px;" justify="space-around">
    <v-col cols="12" md="4">
      <v-select
        :items="studies"
        :item-value="'id'"
        :item-text="'StudyName'"
        v-model="selectedStudy"
        return-object
        label="Studies"
        @change="searchChild"
      ></v-select>

      <h4>{{ selectedStudy.StudyName }}</h4>
      <h4>{{ selectedStudy.MinAge }}</h4>
      <h4>{{ selectedStudy.MaxAge }}</h4>
      <h4>{{ selectedStudy.Summary }}</h4>
    </v-col>

    <v-col cols="12" md="4">
      <v-row justify="space-around">
        <v-col cols="12" md="3">
          <v-btn
            color="purple"
            text
            @click.stop="editChild"
            :disabled="!currentChild.id"
            >Edit</v-btn
          >
        </v-col>
        <v-col cols="12" md="3">
          <h5>{{ page + " / " + NofChildren }}</h5>
        </v-col>
        <v-col cols="12" md="3">
          <v-pagination
            @next="nextPage"
            @previous="previousPage"
            circle
            v-model="page"
            :length="NofChildren"
            total-visible="1"
          ></v-pagination>
        </v-col>
      </v-row>
      <v-row justify="space-around">
        <v-col cols="12" md="5" v-for="field in familyField" :key="field.label">
          <v-text-field
            :label="field.label"
            v-model="currentFamily[field.field]"
            readonly
            dense
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row justify="space-around">
        <v-col cols="12" md="5" v-for="field in childField" :key="field.label">
          <v-text-field
            :label="field.label"
            v-model="currentChild[field.field]"
            readonly
            dense
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="5">
          <AgeDisplay :DoB="currentChild.DoB" />
        </v-col>
      </v-row>

      <v-row justify="space-around">
        <v-col cols="12" md="9">
          <v-select
            :items="Responses"
            v-model="response"
            label="Parents' response"
            @change="chooseResponse"
            :disabled="!currentChild"
          ></v-select>
        </v-col>

        <v-col cols="12" md="3">
          <v-btn
            color="purple"
            text
            @click.stop="scheduleChild"
            :disabled="!currentChild.id"
            >{{ scheduleButtonText }}</v-btn
          >
        </v-col>

        <v-dialog v-model="dobPicker" max-width="360px">
          <v-card>
            <v-row align="center">
              <v-col cols="12" lg="12">
                <v-date-picker
                  v-model="editedItem.DoB"
                  show-current
                  :max="new Date().toISOString()"
                  @click:date="dobPicker = false"
                ></v-date-picker>
              </v-col>
            </v-row>
          </v-card>
        </v-dialog>

        <v-dialog v-model="dialogEdit" max-width="760px" :retain-focus="false">
          <v-card>
            <v-card-title>
              <span class="headline">Child's information</span>
            </v-card-title>

            <v-form ref="formChild" v-model="validChild" lazy-validation>
              <v-container>
                <v-row>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.Name"
                      :rules="rules.name"
                      label="Name"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.DoB"
                      append-icon="event"
                      @click:append="dobPicker = true"
                      :rules="rules.dob"
                      label="Date of birth (YYYY-MM-DD)"
                    ></v-text-field
                    >flffdjjdfa;kfjdsf
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
                      :rules="rules.birthWeight"
                      label="Birth weight"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-container>
            </v-form>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="green darken-1" text @click="dialogChild = false"
                >Cancel</v-btn
              >
              <v-btn color="green darken-1" text @click="save">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog
          v-model="dialogSchedule"
          max-width="1200px"
          :retain-focus="false"
        >
          <v-card>
            <v-card-title class="headline"
              >Schedule {{ selectedStudy.StudyName }} for
              {{ currentChild.Name }}</v-card-title
            >
            <template>
              <v-container fluid>
                <v-row
                  class="grey lighten-5"
                  style="height: 100px;"
                  justify="space-around"
                >
                  <v-col cols="12" md="3">
                    <v-text-field
                      ref="studyDate"
                      label="Study date"
                      v-model="studyDate"
                      append-icon="event"
                      @click:append="datePicker = true"
                      :disabled="this.response != 'Confirmed'"
                      dense
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-combobox
                      v-model="studyTime"
                      :items="studyTimeSlots"
                      label="Study time"
                      :disabled="this.response != 'Confirmed'"
                      dense
                    ></v-combobox>
                  </v-col>
                
                </v-row>
                <v-row>
                  <v-col
                    cols="12"
                    md="12"
                    v-for="(appointment, index) in appointments"
                    :key="appointment.index"
                  >
                    <ExtraStudies
                      ref="extraStudies"
                      :child="appointment.Child"
                      :currentStudy="selectedStudy"
                      :index="index"
                      @selectStudy="selectStudy"
                      @deleteAppointment="deleteAppointment"
                      align="start"
                    ></ExtraStudies>
                    <v-row v-if="index === 0">
                      <div class="title">
                        Additional appointment(s) for:
                      </div>
                      <v-col cols="12" md="2">
                        <v-btn
                          color="green darken-2"
                          text
                          @click="newAppointment(currentChild)"
                          >{{ currentChild.Name }}</v-btn
                        >
                      </v-col>
                      <v-col
                        cols="12"
                        md="2"
                        v-for="child in currentChild.sibling"
                        :key="child.id"
                      >
                        <v-btn
                          color="green darken-2"
                          text
                          @click="newAppointment(child)"
                        >
                          {{ child.Name }}</v-btn
                        >
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-container>
            </template>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="green darken-4" text @click="show">Show</v-btn>
              <v-btn color="green darken-1" text @click="closeSchedule"
                >Cancel</v-btn
              >
              <v-btn color="green darken-1" text @click="createSchedule"
                >Confirm</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog v-model="datePicker" max-width="360px">
          <v-card>
            <v-row align="center">
              <v-col cols="12" lg="12">
                <v-date-picker
                  v-model="studyDate"
                  show-current
                  @click:date="datePick"
                  :min="earliestDate"
                  :max="latestDate"
                ></v-date-picker>
              </v-col>
            </v-row>
          </v-card>
        </v-dialog>
      </v-row>
    </v-col>
    <v-col cols="12" md="4" dense>
      <Conversation
        :Conversation="currentFamily.Conversations"
        :familyId="parseInt(currentFamily.id)"
      ></Conversation>
    </v-col>
  </v-row>
  <!-- </v-container> -->
</template>

<script>
import store from "@/store";
import child from "@/services/child";
import study from "@/services/study";

import schedule from "@/services/schedule";
import moment from "moment";

import AgeDisplay from "@/components/AgeDisplay";
import ExtraStudies from "@/components/ExtraStudies";

import Conversation from "@/components/Conversation";

export default {
  components: {
    AgeDisplay,
    Conversation,
    ExtraStudies,
  },
  props: {},
  data() {
    return {
      dialogEdit: false,
      dialogSchedule: false,
      dobPicker: false,
      datePicker: false,
      validChild: true,
      studies: [],
      selectedStudy: {},
      Children: [],
      elegibleExperimenters: [],
      scheduleButtonText: "Schedule",
      appointments: [],
      defaultAppointment: {
        index: null,
        FK_Family: null,
        FK_Child: null,
        FK_Study: null,
        Experimenters: []
      },
      experimenters: [],
      currentChild: {
        Name: null,
        Sex: null,
        DoB: null,
        Family: {
          NameMom: null,
          NameDad: null,
          Phone: null,
          Email: null
        }
      },
      editedItem: {
        Name: null,
        Sex: null,
        DoB: null,
        Family: {
          NameMom: null,
          NameDad: null,
          Phone: null,
          Email: null
        }
      },
      defaultItem: {
        Name: null,
        Sex: null,
        DoB: null,
        Family: {
          NameMom: null,
          NameDad: null,
          Phone: null,
          Email: null
        }
      },
      Sex: ["F", "M"],
      editedIndex: null,
      childField: [
        { label: "Name", field: "Name" },
        { label: "Sex", field: "Sex" },
        { label: "DoB", field: "DoB" }
      ],
      familyField: [
        { label: "Phone", field: "Phone", rules: "phone" },
        { label: "Email", field: "Email", rules: "email" },
        { label: "Mother's Name", field: "NameMom", rules: "name" },
        { label: "Father's Name", field: "NameDad", rules: "name" }
      ],
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
      rules: {
        name: [
          value => !!value || "Required.",
          value => {
            var pattern = /^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/;
            return pattern.test(value) || "Invalid Name.";
          },
          value => (value && value.length <= 30) || "Max 30 characters"
        ],
        email: [
          value => !!value || "Required.",
          value => {
            const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return pattern.test(value) || "Invalid e-mail.";
          },
          value => (value && value.length <= 30) || "Max 30 characters"
        ],
        phone: [
          value => {
            const pattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            return pattern.test(value) || "Invalid phone.";
          },
          value => !!value || "Required.",
          value => (value && value.length == 10) || "Have to be 10 digits"
        ],
        dob: [
          value => !!value || "Required.",
          value => {
            var pattern = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
            return pattern.test(value) || "Invalid Date of Birth.";
          }
        ],
        birthWeight: [
          value => {
            var pattern = /^[0-9]{1,2}[:.,-]?$/;
            return pattern.test(value) || "Invalid Birth Weight.";
          }
        ]
      },
      page: 0
    };
  },

  methods: {
    async searchStudies() {
      var queryString = {
        FK_Lab: store.state.lab,
        Completed: 0
      };

      try {
        const Result = await study.search(queryString);

        this.studies = Result.data;
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login"
          });
        }
      }
    },

    async searchChild() {
      var studyQuery = {
        id: this.selectedStudy.id
      };
      try {
        const studyInfo = await study.search(studyQuery);
        var pastParticipants = studyInfo.data.Appointments.map(appointment => {
          return appointment.FK_Child;
        });
      } catch (error) {
        console.log(error.response);
      }

      var queryString = {};

      queryString.pastParticipants = pastParticipants;
      queryString.minAge = this.selectedStudy.MinAge;
      queryString.maxAge = this.selectedStudy.MaxAge;

      try {
        const Results = await child.search(queryString);

        if (Results.data.length > 0) {
          this.page = 1;
          this.Children = Results.data;
          this.currentChild = this.Children[this.page - 1];
        } else {
          alert("no child is elegible for the selected study. :(");
          this.page = 0;
          this.currentChild = {};
        }
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login"
          });
        } else {
          console.log(error.response);
        }
      }
    },

    editChild() {
      this.editedIndex = this.Children.indexOf(this.currentChild);
      this.editedItem = Object.assign({}, this.currentChild);
      this.dialogEdit = true;
    },

    async save() {
      try {
        var validationResults = false;

        validationResults = this.$refs.formChild.validate();

        if (validationResults) {
          this.editedItem.Age = Math.floor(
            (new Date() - new Date(this.editedItem.DoB)) / (24 * 3600 * 1000)
          );

          await child.update(this.editedItem);

          Object.assign(this.Children[this.editedIndex], this.editedItem);

          console.log("Child information updated!");

          this.close();
        }
      } catch (error) {
        console.log(error.response);
      }
    },

    close() {
      this.dialogEdit = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    },

    scheduleChild() {
      this.editedIndex = this.Children.indexOf(this.currentChild);
      this.editedItem = Object.assign({}, this.currentChild);

      var newAppointment = Object.assign({}, this.defaultAppointment);
      newAppointment.FK_Child = this.currentChild.id;
      newAppointment.FK_Family = this.currentChild.FK_Family;
      newAppointment.Child = this.currentChild;
      newAppointment.index = this.appointments.length;
      this.appointments.push(newAppointment);

      this.dialogSchedule = true;
    },

    newAppointment(child) {
      var newAppointment = Object.assign({}, this.defaultAppointment);

      newAppointment.FK_Child = child.id;
      newAppointment.Child = child;
      newAppointment.FK_Family = child.FK_Family;
      newAppointment.index = this.appointments.length;

      this.appointments.push(newAppointment);
    },

    deleteAppointment(index) {
      this.appointments.splice(index, 1);
    },

    selectStudy(extraAppointments) {
      console.log(extraAppointments);
      //  a lot of things to do here.
    },

    show() {
      for (var i = 0; i < this.appointments.length; i++) {
        this.$refs.extraStudies[i].selectStudy();
      }
    },

    selectedExperimenters(experimenters) {
      if (this.Experimenters.length == 0) {
        this.Experimenters = experimenters;
      } else {
        experimenters.forEach(experimenter => {
          this.Experimenters.push(experimenter);
        });
      }

      this.appointments[0].Experimenters = experimenters.map(experimenter => {
        return experimenter.id;
      });
    },

    async createSchedule() {
      this.appointments = [];
      this.Experimenters = [];

      this.appointments.push({
        FK_Family: this.currentChild.FK_Family,
        FK_Study: this.selectedStudy.id,
        FK_Child: this.currentChild.id,
        Child: {
          Name: this.currentChild.Name,
          DoB: this.currentChild.DoB
        },
        Study: {
          StudyName: this.selectedStudy.StudyName,
          MinAge: this.selectedStudy.MinAge,
          MaxAge: this.selectedStudy.MaxAge
        }
      });

      this.$refs.elegibleExperimenter.selectExperimenters();

      // this.$refs.siblingTable.saveAppointment();
      this.$refs.extraStudies.selectStudy();

      // console.log(this.appointments);
      var newAppointmentInfo = {};

      switch (this.response) {
        case "Confirmed":
          var studyNames = this.appointments.map(appointment => {
            return appointment.Study.StudyName;
          });

          var childNames = this.appointments.map(appointment => {
            return appointment.FK_Child;
          });

          studyNames = Array.from(new Set(studyNames));
          childNames = Array.from(new Set(childNames));

          newAppointmentInfo = {
            AppointmentTime: moment(this.studyDateTime).toISOString(true),
            Status: this.response,
            summary:
              studyNames.join(" + ") +
              ", Family: " +
              this.currentChild.FK_Family +
              ", Child: " +
              childNames.join(" + "),
            Appointments: this.appointments,
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
            attendees: this.Experimenters
          };

          break;

        default:
          newAppointmentInfo = {
            AppointmentTime: null,
            Status: this.response,
            Appointments: this.appointments,
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
        await schedule.create(newAppointmentInfo);

        console.log("New appointment scheduled!");
      } catch (error) {
        console.log(error.response);
      }

      this.closeSchedule();
    },

    closeSchedule() {
      this.dialogSchedule = false;
      setTimeout(() => {
        this.appointments = [];
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        this.response = null;
        this.studyDate = null;
        this.studyTime = "09:00AM";
        this.$refs.elegibleExperimenter.clear();
      }, 300);
    },

    nextPage() {
      this.currentChild = this.Children[this.page - 1];
      this.response = "";
    },

    previousPage() {
      this.currentChild = this.Children[this.page - 1];
      this.response = "";
    },

    datePick() {
      this.datePicker = false;
      setTimeout(() => {
        this.$refs.studyDate.focus();
      }, 100);
    },

    chooseResponse() {
      switch (this.response) {
        case "Confirmed": {
          this.scheduleButtonText = "Schedule";
          break;
        }
        case "Left a Message":
        case "Interested": {
          this.scheduleButtonText = "Confirm";
          break;
        }

        case "Rejected": {
          this.scheduleButtonText = "Confirm";
          break;
        }
      }
    }
  },

  computed: {
    NofChildren() {
      return this.Children.length;
    },

    currentFamily() {
      return this.currentChild.Family;
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
  mounted: function() {
    this.searchStudies();
  },

  watch: {
    dialogEdit(val) {
      val || this.close();
    },

    dialogSchedule(val) {
      val || this.closeSchedule();
    }
  }
};
</script>

<style scoped>
/deep/ .v-pagination__item {
  display: none;
}
/deep/ .v-pagination__more {
  display: none;
}

/deep/ .v-text-field .v-input__control .v-input__slot {
  width: "150px";
  dense: true;
  clearable: true;
  color: "primary";
  autocomplete: "off";
  outlined: true;
}

/deep/ .v-container {
  display: flex; /* or inline-flex */
  flex-direction: row;
}
</style>
