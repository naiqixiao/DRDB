<template>
  <v-row align="end" justify="start" style="height: 60px; margin: 0px" dense>
    <v-col cols="12" md="2" class="d-flex align-end">
      <h3 class="name">{{ child.Name + ":" }}</h3>
    </v-col>
    <v-col cols="12" md="2">
      <v-select ref="currentSelected" :items="potentialStudies" :item-value="'id'" :item-text="'StudyName'"
        v-model="selectedStudy" return-object label="Studies" @change="emitSelectedStudy"
        :disabled="index == 0 && !!currentStudy.id > 0 && type == 'newSchedule'" dense hide-details></v-select>
      <!-- <v-select
        v-else
        :items="potentialExtraStudies"
        :item-value="'id'"
        :item-text="'StudyName'"
        @change="emitSelectedStudy"
        v-model="selectedStudy"
        return-object
        label="Studies"
        hide-details
        dense
      ></v-select> -->
    </v-col>
    <v-col cols="12" md="3" v-if="response == 'Confirmed'">
      <v-select style="margin-left: 10px" :items="selectedStudy.Experimenters" :item-value="'id'" :item-text="'Name'"
        v-model="selectedExperimenters" return-object label="Experimenter (Primary)" hide-details dense></v-select>
    </v-col>
    <v-col cols="12" md="4" v-if="response == 'Confirmed'">
      <v-select :items="secondaryExperimenterList" :item-value="'id'" :item-text="'Name'"
        v-model="selectedExperimenters_2nd" return-object label="Experimenters (Secondary)" multiple hide-details
        dense></v-select>
    </v-col>
    <v-col cols="12" md="1">
      <v-btn text icon color="primary" @click="deleteAppointment" :disabled="nOfAppointments < 2">
        <v-icon>delete</v-icon>
      </v-btn>
    </v-col>
    <!-- <v-col cols="12" md="2" v-else></v-col> -->
    <!-- <v-col cols="12" md="2"></v-col> -->
  </v-row>
</template>

<script>
// import store from "@/store";
// import personnel from "@/services/personnel";

export default {
  props: {
    child: Object,
    targetChild: Object,
    potentialStudies: Array,
    currentStudy: Object,
    participationDate: Date,
    index: Number,
    response: String,
    type: String,
    nOfAppointments: Number,
  },
  data() {
    return {
      selectedStudy: this.currentStudy,
      // ? this.currentStudy
      // : this.studyPlaceHolder,
      selectedExperimenters: {},
      selectedExperimenters_2nd: [],
    };
  },
  methods: {
    selectStudy() {
      const experimenterIds = [];
      experimenterIds.push(this.selectedExperimenters.id);

      const experimenterIds_2nd = this.selectedExperimenters_2nd.map((experimenter) => {
        return experimenter.id;
      });

      const experimenterNames_2nd = this.selectedExperimenters_2nd.map((experimenter) => {
        return experimenter.Name + " (" + experimenter.Email + ")";
      });

      const secondaryExperimenters = this.selectedExperimenters_2nd.map(
        (experimenter) => {
          return {
            Initial: experimenter.Initial,
            ZoomLink: experimenter.ZoomLink,
          };
        }
      );

      const testingRoom = this.$store.state.testingRooms.find(room => room.id === this.selectedStudy.FK_TestingRoom);
      let calendarId;
      if (testingRoom) {
        calendarId = testingRoom.calendarId;
      } else {
        calendarId = 'primary';
      }

      let appointment = {
        FK_Child: this.child.id,
        FK_Family: this.child.FK_Family,
        FK_Study: this.selectedStudy.id,
        Child: this.child,
        Study: this.selectedStudy,
        calendarId: calendarId,
        Experimenters: experimenterIds,
        Experimenters_2nd: experimenterIds_2nd,
        PrimaryExperimenter: [
          {
            ZoomLink: this.selectedExperimenters.ZoomLink,
            Initial: this.selectedExperimenters.Initial,
          },
        ],
        SecondaryExperimenter: secondaryExperimenters,
        E1:
          this.selectedExperimenters.Name + " (" + this.selectedExperimenters.Email + ")",
        E2: experimenterNames_2nd.join(", "),
        // ZoomLink: this.selectedExperimenters.ZoomLink,
      };

      const attendees = [];

      attendees.push({
        displayName: this.selectedExperimenters.Name,
        email: this.selectedExperimenters.Calendar,
        // EMAIL: experimenter.Email,
        // zoomLink: experimenter.ZoomLink,
      });

      this.selectedExperimenters_2nd.map((experimenter) => {
        attendees.push({
          displayName: experimenter.Name,
          email: experimenter.Calendar,
          // EMAIL: experimenter.Email,
          // zoomLink: experimenter.ZoomLink,
        });
      });
      appointment.attendees = attendees;

      this.$emit("selectStudy", {
        index: this.index,
        appointment: appointment,
        // attendees: attendees,
      });
    },

    primaryExperimenterStatus() {
      this.$emit(
        "primaryExperimenterStatus",
        Object.keys(this.selectedExperimenters).length
      );
    },

    resetExperimenters() {
      this.selectedExperimenters = {};
      this.selectedExperimenters_2nd = [];
    },

    emitSelectedStudy() {
      const selectedStudy = {
        studyId: this.selectedStudy.id,
        childId: this.child.id,
        index: this.index,
      };
      this.$emit("emitSelectedStudy", selectedStudy);

      if (this.index == 0) {
        this.$emit("emitEmailTemplate", this.selectedStudy.EmailTemplate);
      }

    },

    clear() {
      this.selectedStudy = [];
    },

    deleteAppointment() {
      this.$emit("deleteAppointment", this.index);
    },
  },

  computed: {
    potentialExtraStudies() {
      if (this.currentStudy && this.targetChild.id == this.child.id) {
        return this.potentialStudies.filter((study) => this.currentStudy.id != study.id);
      } else {
        return this.potentialStudies;
      }
    },

    defaultSelected() {
      return this.currentStudy
        ? {
          id: this.currentStudy.id,
          StudyName: this.currentStudy.StudyName,
        }
        : {};
    },

    secondaryExperimenterList() {
      var secondaryExperimenterList = [];
      this.selectedStudy.Experimenters.forEach((experimenter) => {
        if (experimenter.id !== this.selectedExperimenters.id) {
          secondaryExperimenterList.push(experimenter);
        }
      });

      return secondaryExperimenterList;
    },
  },

  // asyncComputed: {
  //   async potentialExperimenters() {
  //     if (this.selectedStudy) {
  //       var studyId = null;

  //       if (this.index == 0 && this.currentStudy) {
  //         studyId = this.currentStudy.id;
  //       } else {
  //         studyId = this.selectedStudy.id;
  //       }

  //       try {
  //         var queryString = {
  //           study: studyId,
  //         };

  //         const results = await personnel.search(queryString);

  //         // filter the output based on experimenters' availability on the participation date.
  //         // this.participationDate

  //         return results.data;
  //       } catch (error) {
  //         console.log(error.response);
  //       }
  //     } else {
  //       return [];
  //     }
  //   },
  // },

  watch: {
    selectedStudy() {
      this.selectedExperimenters = {};
      this.selectedExperimenters_2nd = [];
    },
  },
};
</script>
<style scoped>
.name {
  height: 30px;
  display: flex;
  align-items: flex-end;
  padding-left: 20px;
}
</style>
