<template>
  <v-row dense>
    <v-col
      cols="12"
      md="2"
      v-for="(appointment, index) in Appointments"
      :key="appointment.id"
      dense
    >
      <v-card class="mx-auto" width="360px" height="160px">
        <v-card-title>{{ appointment.Child.Name }}</v-card-title>

        <v-card-text align="start">{{
          appointment.Study.StudyName
        }}</v-card-text>
        <v-card-actions>
          <v-icon @click="updateExperimenters(appointment, index)"
            >how_to_reg</v-icon
          >
          <v-icon
            @click="removeAppointment(index)"
            :disabled="Appointments.length == 1"
            >delete</v-icon
          >
        </v-card-actions>
      </v-card>
    </v-col>
    <v-row align="center" justify="center">
      <v-col cols="12" md="2" dense>
        <v-btn color="purple" fab large @click.stop="addAppointments">+</v-btn>
      </v-col>
    </v-row>

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

    <div>
      <v-dialog v-model="dialogAppointment" max-width="1200px">
        <v-card>
          <v-row align="center">
            <v-col cols="12" lg="12">
              <SiblingInfo
                ref="siblingTable"
                :Children="Children"
                :ScheduleID="Appointments[0].FK_Schedule"
                @updateSiblingStudies="saveNewAppointments"
              ></SiblingInfo>
            </v-col>
          </v-row>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" text @click="save">Confirm</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </v-row>
</template>

<script>
// import SiblingInfo from "@/components/SiblingInfo";
import personnel from "@/services/personnel";

import family from "@/services/family";
import appointment from "@/services/appointment";
// import schedule from "@/services/schedule";

// import moment from "moment";

export default {
  components: {
    // SiblingInfo
  },
  props: {
    Appointments: Array
  },

  data() {
    return {
      Children: [],
      dialogAppointment: false,
      dialogUpdateExperimenters: false,
      editedAppointment: {},
      selectedExperimenters: [],
      index: -1
    };
  },
  methods: {
    async addAppointments() {
      var queryString = { id: this.Appointments[0].FK_Family };
      var Results = await family.search(queryString);
      this.Children = Results.data[0].Children;
      this.dialogAppointment = true;
    },

    async saveNewAppointments(newAppointments) {
      try {
        const createdAppointments = await appointment.create(newAppointments);

        for (var i = 0; i < newAppointments.length; i++) {
          newAppointments[i].id = createdAppointments.data[i].id;
        }

        newAppointments.forEach(appointment => {
          this.Appointments.push(appointment);
        });

        this.dialogAppointment = false;

        console.log("Appointments updated.");
      } catch (error) {
        console.error(error.response);
      }
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

      // console.log({
      //   updatedExperimenters: updatedExperimenters,
      //   scheduleId: this.editedAppointment.FK_Schedule
      // });

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
    }
  }
};
</script>

<style lang="scss" scoped></style>
