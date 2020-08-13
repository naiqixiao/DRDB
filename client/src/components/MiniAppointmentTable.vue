<template>
  <v-row dense style="background-color: rgba(0, 0, 0, 0)">
    <v-col
      cols="12"
      md="2"
      style="padding: 12px !important"
      v-for="(appointment, indexAppointments) in Appointments"
      :key="appointment.id"
    >
      <v-card class="child-card d-flex flex-column" height="150px">
        <v-card-title class="title" style="padding: 8px;">
          <span
            class="d-inline-block text-truncate"
            style="max-width: 90px; padding-right: 2px;"
          >{{ appointment.Child.Name }}</span>
          <span class="body-1" style="color: var(--v-primary); ">
            {{
            "(" +
            appointment.FK_Family +
            appointment.Child.IdWithinFamily +
            ")"
            }}
          </span>
          <v-spacer></v-spacer>
          <v-icon v-if="appointment.Child.Sex == 'M'" color="light-blue darken-4">mdi-human-male</v-icon>
          <v-icon v-else color="pink darken-1">mdi-human-female</v-icon>
        </v-card-title>

        <v-card-text class="body-1" align="start" style="padding: 8px; color: var(--v-primary)">
          {{
          appointment.Study.StudyName +
          " (" +
          appointment.Study.StudyType +
          ")"
          }}
        </v-card-text>
        <v-spacer></v-spacer>
        <v-card-actions>
          <v-icon
            color="primary"
            @click="updateExperimenters(appointment, indexAppointments)"
          >how_to_reg</v-icon>
          <v-spacer></v-spacer>
          <v-icon
            color="primary"
            @click="removeAppointment(indexAppointments)"
            :disabled="Appointments.length == 1"
          >delete</v-icon>
        </v-card-actions>
      </v-card>
    </v-col>
    <v-row align="end" justify="end">
      <v-col cols="12" md="2">
        <v-btn color="purple" fab large @click.stop="editNewAppointments">
          <v-icon>add</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <div>
      <v-dialog v-model="dialogAddAppointments" max-width="1200px">
        <v-card>
          <v-card-title class="title">Add study appointment(s) to the visit</v-card-title>
          <v-container fluid>
            <v-row>
              <v-col cols="12" md="2" v-for="child in Children" :key="child.id">
                <v-btn
                  class="text-capitalize"
                  rounded
                  color="primary"
                  @click="newAppointmentSlot(child)"
                  :disabled="
                    potentialStudies(child).selectableStudies.length < 1
                  "
                >{{ child.Name }}</v-btn>
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
            <v-row justify="space-between" style="height: 50px">
              <v-col md="4"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="closeNewAppointment">Cancel</v-btn>
              </v-col>
              <v-col md="2">
                <v-btn color="primary" @click="saveNewAppointments">Confirm</v-btn>
              </v-col>
              <v-col md="4"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <div>
      <v-dialog v-model="dialogUpdateExperimenters" max-width="800px">
        <v-card height="300px" class="d-flex flex-column">
          <v-card-title class="title">Update experimenters for the current study appointments</v-card-title>
          <v-row justify="center">
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
                chip
              ></v-select>
            </v-col>
          </v-row>
          <v-spacer></v-spacer>
          <v-card-actions>
            <v-row justify="space-between" style="height: 50px">
              <v-col md="4"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="dialogUpdateExperimenters = false">Cancel</v-btn>
              </v-col>
              <v-col md="2">
                <v-btn color="primay" @click="saveExperimenters">Save</v-btn>
              </v-col>
              <v-col md="4"></v-col>
            </v-row>
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
    NewAppointments,
  },
  props: {
    Appointments: Array,
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
      Experimenters: [],
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

    studyElegibility(study, child) {
      var age =
        child.Age >= study.MinAge * 30.5 - 5 &&
        child.Age <= study.MaxAge * 30.5 - 5;

      var hearing = false;

      switch (study.HearingLossParticipant) {
        case "Only":
          child.HearingLoss ? (hearing = true) : (hearing = false);
          break;

        case "Exclude":
          child.HearingLoss ? (hearing = false) : (hearing = true);

          break;

        case "Include":
          hearing = true;
          break;
      }

      var vision = false;
      switch (study.VisionLossParticipant) {
        case "Only":
          child.VisionLoss ? (vision = true) : (vision = false);
          break;

        case "Exclude":
          child.VisionLoss ? (vision = false) : (vision = true);

          break;

        case "Include":
          vision = true;
          break;
      }

      var premature = false;
      switch (study.PrematureParticipant) {
        case "Only":
          child.PrematureBirth ? (premature = true) : (premature = false);
          break;

        case "Exclude":
          child.PrematureBirth ? (premature = false) : (premature = true);

          break;

        case "Include":
          premature = true;
          break;
      }

      var illness = false;
      switch (study.IllParticipant) {
        case "Only":
          child.Illness ? (illness = true) : (illness = false);
          break;

        case "Exclude":
          child.Illness ? (illness = false) : (illness = true);

          break;

        case "Include":
          illness = true;
          break;
      }

      return age && hearing && vision && premature && illness;
    },

    potentialStudies(child) {
      var ElegibleStudies = [];

      store.state.studies.forEach((study) => {
        if (this.studyElegibility(study, child)) {
          ElegibleStudies.push(study.id);
        }
      });

      var uniquePreviousStudies = [];

      if (child.Appointments) {
        child.Appointments.forEach((appointment) => {
          uniquePreviousStudies.push(appointment.FK_Study);
        });
        uniquePreviousStudies = Array.from(new Set(uniquePreviousStudies));
      }

      var potentialStudies = ElegibleStudies.filter(
        (study) => !uniquePreviousStudies.includes(study)
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
        (study) => !currentSelectedStudies.includes(study)
      );

      var potentialStudyList = store.state.studies.filter((study) =>
        potentialStudies.includes(study.id)
      );

      return {
        potentialStudyList: potentialStudyList,
        selectableStudies: selectableStudies,
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
        extraAppointments.attendees.forEach((experimenter) => {
          this.Experimenters.push(experimenter);
        });
      }
    },

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

        this.newAppointments.forEach((appointment) => {
          this.Appointments.push(appointment);
        });

        console.log(this.Appointments);

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
        (experimenter) => {
          return {
            FK_Appointment: this.editedAppointment.id,
            FK_Experimenter: experimenter.id,
          };
        }
      );

      try {
        await appointment.update({
          updatedExperimenters: updatedExperimenters,
          scheduleId: this.editedAppointment.FK_Schedule,
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
    },
  },

  computed: {},

  asyncComputed: {
    async potentialExperimenters() {
      if (this.editedAppointment.FK_Study) {
        try {
          var queryString = {
            study: this.editedAppointment.FK_Study,
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
    },
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
    },
  },
};
</script>

<style lang="scss" scoped>
.v-card-title {
  vertical-align: bottom;
}
</style>
