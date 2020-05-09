<template>
  <v-row dense>
    <v-col
      cols="12"
      md="2"
      v-for="(appointment, indexAppointments) in Appointments"
      :key="appointment.id"
      dense
    >
      <v-card class="mx-auto" width="360px" height="160px">
        <v-card-title>{{ appointment.Child.Name }}</v-card-title>

        <v-card-text align="start">{{
          appointment.Study.StudyName
        }}</v-card-text>
        <v-card-actions>
          <v-icon @click="updateExperimenters(appointment, indexAppointments)"
            >how_to_reg</v-icon
          >
          <v-icon
            @click="removeAppointment(indexAppointments)"
            :disabled="Appointments.length == 1"
            >delete</v-icon
          >
        </v-card-actions>
      </v-card>
    </v-col>
    <v-row align="end" justify="end">
      <v-col cols="12" md="2" >
        <v-btn color="purple" fab large @click.stop="editNewAppointments"
          ><v-icon>add</v-icon></v-btn
        >
      </v-col>
    </v-row>

    <div>
      <v-dialog v-model="dialogAddAppointments" max-width="1200px">
        <v-card>
          <v-card-title class="headline"
            >Add appointments to the current schedule</v-card-title
          >
          <v-container fluid>
            <v-row>
              <v-col cols="12" md="2" v-for="child in Children" :key="child.id">
                <v-btn
                  color="green darken-2"
                  text
                  @click="newAppointmentSlot(child)"
                  :disabled="
                    potentialStudies(child).selectableStudies.length < 1
                  "
                >
                  {{ child.Name }}</v-btn
                >
              </v-col>
            </v-row>
            <v-row>
              <v-col
                cols="12"
                md="12"
                v-for="(appointment, indexNewAppointment) in newAppointments"
                :key="appointment.index"
              >
                <NewAppointments
                  ref="newAppointments"
                  :child="appointment.Child"
                  :scheduleId="appointment.FK_Schedule"
                  :potentialStudies="
                    potentialStudies(appointment.Child).potentialStudyList
                  "
                  :index="indexNewAppointment"
                  @selectStudy="selectStudy"
                  @deleteAppointment="deleteAppointment"
                  @emitSelectedStudy="receiveSelectedStudy"
                  align="start"
                />
              </v-col>
            </v-row>
          </v-container>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" text @click="closeNewAppointment"
              >Cancel</v-btn
            >
            <v-btn color="green darken-1" text @click="saveNewAppointments"
              >Confirm</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <div>
      <v-dialog v-model="dialogUpdateExperimenters" max-width="1200px">
        <v-card>
          <h2>Update experimenters for the current appointment</h2>
          <v-col cols="12" md="3">
            <v-select
              :items="potentialExperimenters"
              :item-value="'id'"
              :item-text="'Name'"
              v-model="selectedExperimenters"
              return-object
              label="Experimenters"
              multiple
              dense
            ></v-select>
          </v-col>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" text @click="saveExperimenters"
              >Save</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

  </v-row>
</template>

<script>
import NewAppointments from "@/components/NewAppointments";
import personnel from "@/services/personnel";

import family from "@/services/family";
import appointment from "@/services/appointment";
import store from "@/store";

export default {
  components: {
    NewAppointments
  },
  props: {
    Appointments: Array
  },

  data() {
    return {
      Children: [],
      dialogAppointment: false,
      dialogUpdateExperimenters: false,
      dialogAddAppointments: false,
      newAppointments: [],
      newAppointment: {},
      editedAppointment: {},
      selectedExperimenters: [],
      index: -1,
      Experimenters: []
    };
  },
  methods: {
    newAppointmentSlot(child) {
      var newAppointment = Object.assign({}, this.defaultAppointment);

      newAppointment.FK_Child = child.id;
      newAppointment.Child = child;
      newAppointment.FK_Schedule = this.Appointments[0].FK_Schedule;
      newAppointment.FK_Family = child.FK_Family;
      newAppointment.index = this.newAppointments.length;

      this.newAppointments.push(newAppointment);
    },

    async editNewAppointments() {
      var queryString = { id: this.Appointments[0].FK_Family };
      var Results = await family.search(queryString);
      this.Children = Results.data[0].Children;
      this.dialogAddAppointments = true;
    },

    potentialStudies(child) {
      var ElegibleStudies = [];

      store.state.studies.forEach(study => {
        if (
          child.Age >= study.MinAge * 30.5 - 5 &&
          child.Age <= study.MaxAge * 30.5 - 5
        ) {
          ElegibleStudies.push(study.id);
        }
      });

      var uniquePreviousStudies = [];

      if (child.Appointments) {
        child.Appointments.forEach(appointment => {
          uniquePreviousStudies.push(appointment.FK_Study);
        });
        uniquePreviousStudies = Array.from(new Set(uniquePreviousStudies));
      }

      var potentialStudies = ElegibleStudies.filter(
        study => !uniquePreviousStudies.includes(study)
      );

      // check the selected studies.
      var currentSelectedStudies = [];
      if (this.newAppointments.length > 0) {
        for (var i = 0; i < this.newAppointments.length; i++) {
          if (this.newAppointments[i].FK_Child == child.id) {
            currentSelectedStudies.push(this.newAppointments[i].FK_Study);
          }
        }
      }

      var selectableStudies = potentialStudies.filter(
        study => !currentSelectedStudies.includes(study)
      );

      var potentialStudyList = store.state.studies.filter(study =>
        potentialStudies.includes(study.id)
      );

      return {
        potentialStudyList: potentialStudyList,
        selectableStudies: selectableStudies
      };
    },

    receiveSelectedStudy(selectedStudy) {
      this.newAppointments[selectedStudy.index].FK_Study =
        selectedStudy.studyId;
      this.newAppointments[selectedStudy.index].FK_Child =
        selectedStudy.childId;
    },

    deleteAppointment(index) {
      this.newAppointments.splice(index, 1);
    },

    selectStudy(extraAppointments) {
      Object.assign(
        this.newAppointments[extraAppointments.index],
        extraAppointments.appointment
      );

      if (this.Experimenters.lenth < 1) {
        this.Experimenters = extraAppointments.attendees;
      } else {
        extraAppointments.attendees.forEach(experimenter => {
          this.Experimenters.push(experimenter);
        });
      }
    },

    // show() {
    //   this.Experimenters = [];

    //   for (var i = 0; i < this.newAppointments.length; i++) {
    //     this.$refs.newAppointments[i].selectStudy();
    //   }
    //   console.log(this.newAppointments);
    //   console.log(this.Experimenters);
    // },

    async saveNewAppointments() {
      this.Experimenters = [];

      for (var i = 0; i < this.newAppointments.length; i++) {
        this.$refs.newAppointments[i].selectStudy();
      }

      try {
        const createdAppointments = await appointment.create(
          this.newAppointments
        );

        for (i = 0; i < this.newAppointments.length; i++) {
          this.newAppointments[i].id = createdAppointments.data[i].id;
        }

        this.newAppointments.forEach(appointment => {
          this.Appointments.push(appointment);
        });

        this.closeNewAppointment();
        console.log("Appointments updated.");
      } catch (error) {
        console.error(error.response);
      }

    },

    closeNewAppointment() {
      this.dialogAddAppointments = false;
      setTimeout(() => {
        this.newAppointments = [];
      }, 300);
    },

    save() {
      this.$refs.siblingTable.saveAppointment();
    },

    async removeAppointment(index) {
      try {
        if (this.Appointments[index].id) {
          await appointment.delete(this.Appointments[index]);

          this.Appointments.splice(index, 1);

          console.log("Appointment deleted.");
        }
      } catch (error) {
        console.error(error.response);
      }
    },

    updateExperimenters(appointment, index) {
      // used to change experimenters of a given appointment
      this.editedAppointment = appointment;
      this.selectedExperimenters = appointment.Personnels;
      this.index = index;
      this.dialogUpdateExperimenters = true;
    },

    async saveExperimenters() {
      this.editedAppointment.Personnels = this.selectedExperimenters;

      var updatedExperimenters = this.selectedExperimenters.map(
        experimenter => {
          return {
            FK_Appointment: this.editedAppointment.id,
            FK_Experimenter: experimenter.id
          };
        }
      );

      try {
        await appointment.update({
          updatedExperimenters: updatedExperimenters,
          scheduleId: this.editedAppointment.FK_Schedule
        });

        this.Appointments[this.index] = this.editedAppointment;
      } catch (error) {
        console.log(error.response);
      }

      this.closeUpdateExperimenter();
    },

    closeUpdateExperimenter() {
      this.editedAppointment = {};
      this.selectedExperimenters = [];
      this.index = -1;
      this.dialogUpdateExperimenters = false;
    }
  },

  computed: {},

  asyncComputed: {
    async potentialExperimenters() {
      if (this.editedAppointment.FK_Study) {
        try {
          var queryString = {
            study: this.editedAppointment.FK_Study
          };

          const results = await personnel.search(queryString);

          // filter the output based on experimenters' availability on the participation date.
          // this.participationDate

          return results.data;
        } catch (error) {
          console.log(error.response);
        }
      } else {
        return [];
      }
    }
  },

  watch: {
    dialog(val) {
      val || this.close();
    },

    dialogUpdateExperimenters(val) {
      val || this.closeUpdateExperimenter();
    },

    dialogAddAppointments(val) {
      val || this.closeNewAppointment();
    }
  }
};
</script>

<style lang="scss" scoped></style>
