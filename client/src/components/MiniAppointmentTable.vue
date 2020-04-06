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
          <v-btn
            text
            @click="removeAppointment(index)"
            :disabled="Appointments.length == 1"
            >Delete</v-btn
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
      <v-dialog v-model="dialogAppointment" max-width="1200px">
        <v-card>
          <v-row align="center">
            <v-col cols="12" lg="12">
              <SiblingInfo
                ref="siblingTable"
                :Children="Children"
                :ScheduleID="Appointments[0].FK_Schedule"
                @updateSiblingStudies="addNewAppointments"
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
import SiblingInfo from "@/components/SiblingInfo";

import family from "@/services/family";
import appointment from "@/services/appointment";
// import schedule from "@/services/schedule";

// import moment from "moment";

export default {
  components: {
    SiblingInfo,
  },
  props: {
    Appointments: Array,
  },

  data() {
    return {
      Children: [],
      dialogAppointment: false,
    };
  },
  methods: {
    async addAppointments() {
      var queryString = { id: this.Appointments[0].FK_Family };
      var Results = await family.search(queryString);
      this.Children = Results.data[0].Children;
      this.dialogAppointment = true;
    },

    async removeAppointment(index) {
      try {
        if (this.Appointments[index].id) {
          await appointment.delete(this.Appointments[index].id);
          this.Appointments.splice(index, 1);

          console.log("Appointment deleted.");
        }
      } catch (error) {
        console.error(error.response);
      }
    },

    async addNewAppointments(newAppointments) {
      try {
        const createdAppointments = await appointment.create(newAppointments);

        for (var i = 0; i < newAppointments.length; i++) {
          newAppointments[i].id = createdAppointments.data[i].id;
        }

        newAppointments.forEach((appointment) => {
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
  },
  computed: {},
  watch: {
    dialog(val) {
      val || this.close();
    },
  },
};
</script>

<style lang="scss" scoped></style>
