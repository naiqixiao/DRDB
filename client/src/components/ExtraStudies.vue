<template>
  <v-row>
    <v-col cols="12" md="1"></v-col>
    <h3>{{ child.Name }}</h3>
    <v-col cols="12" md="2">
      <v-select
        v-if="index > 0"
        :items="potentialStudies"
        :item-value="'id'"
        :item-text="'StudyName'"
        v-model="selectedStudy"
        return-object
        label="Studies"
        dense
      ></v-select>
      <v-select
        v-else
        :items="potentialStudies"
        :item-value="'id'"
        :item-text="'StudyName'"
        v-model="defaultSelected"
        return-object
        label="Studies"
        disabled
        dense
      ></v-select>
    </v-col>
    <v-col cols="12" md="2">
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
    <v-col cols="12" md="2" v-if="index > 0">
      <v-btn color="green darken-2" text @click="deleteAppointment">
        delete</v-btn
      >
    </v-col>
  </v-row>
</template>

<script>
import store from "@/store";
import personnel from "@/services/personnel";

export default {
  props: {
    child: Object,
    currentStudy: Object,
    participationDate: Date,
    index: Number
  },
  data() {
    return {
      selectedStudy: this.currentStudy,
      selectedExperimenters: [],
      defaultSelected: {
        id: this.currentStudy.id,
        StudyName: this.currentStudy.StudyName
      }
    };
  },
  methods: {
    selectStudy() {
      const experimenterIds = this.selectedExperimenters.map(experimenter => {
        return experimenter.id;
      });

      const appointment = {
        FK_Child: this.child.id,
        FK_Family: this.child.FK_Family,
        FK_Study: this.selectedStudy.id,
        Child: {
          Name: this.child.Name,
          DoB: this.child.DoB
        },
        Study: {
          StudyName: this.selectedStudy.StudyName,
          MinAge: this.selectedStudy.MinAge,
          MaxAge: this.selectedStudy.MaxAge
        },
        Experimenters: experimenterIds
      };

      const attendees = this.selectedExperimenters.map(experimenter => {
        return { displayName: experimenter.Name, email: experimenter.Calendar };
      });

      this.$emit("selectStudy", {
        appointment: appointment,
        attendees: attendees
      });
    },

    clear() {
      this.selectedStudy = [];
    },

    deleteAppointment() {
      this.$emit("deleteAppointment", this.index);
    }
  },
  computed: {
    potentialStudies() {
      var ElegibleStudies = [];

      store.state.studies.forEach(study => {
        if (
          this.child.Age >= study.MinAge * 30.5 &&
          this.child.Age <= study.MaxAge * 30.5
        ) {
          ElegibleStudies.push(study.id);
        }
      });

      var uniquePreviousStudies = [];

      this.child.Appointments.forEach(appointment => {
        uniquePreviousStudies.push(appointment.FK_Study);
      });

      uniquePreviousStudies = Array.from(new Set(uniquePreviousStudies));

      if (this.index > 0) {
        uniquePreviousStudies.push(this.currentStudy.id);
      }

      var potentialStudies = ElegibleStudies.filter(
        study => !uniquePreviousStudies.includes(study)
      );

      var potentialStudyList = store.state.studies.filter(study =>
        potentialStudies.includes(study.id)
      );

      return potentialStudyList;
    }
  },

  asyncComputed: {
    async potentialExperimenters() {

      var studyId = null;
      if (this.index > 0) {
        studyId = this.selectedStudy.id;
      } else {
        studyId = this.currentStudy.id;
      }

      try {
        var queryString = {
          study: studyId
        };

        const results = await personnel.search(queryString);

        // filter the output based on experimenters' availability on the participation date.
        // this.participationDate

        return results.data;
      } catch (error) {
        console.log(error.response);
      }
    }
  }
};
</script>
<style lang="scss" scoped></style>
