<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-select
        :items="PotentialStudies"
        :item-value="'id'"
        :item-text="'StudyName'"
        v-model="selectedStudy"
        return-object
        label="Studies"
        multiple
      ></v-select>
    </v-col>
    <v-col cols="12" md="6">
      <v-select
        :items="PotentialExperimenters"
        :item-value="'id'"
        :item-text="'Name'"
        v-model="selectedExperimenters"
        return-object
        label="Experimenters"
        multiple
      ></v-select>
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
  },
  data() {
    return {
      selectedStudy: [],
      selectedExperimenters: [],
    };
  },
  methods: {
    selectStudy() {
      this.$emit("selectStudy", {
        child: this.child,
        studies: this.selectedStudy,
      });
    },

    clear() {
      this.selectedStudy = [];
    },

    selectExperimenters() {
      const experimenters = this.selectedExperimenters.map((experimenter) => {
        return { displayName: experimenter.Name, email: experimenter.Calendar };
      });
      this.$emit("selectExperimenters", experimenters);
    },

    clearExperimenter() {
      this.selectedExperimenters = [];
    },
  },
  computed: {
    PotentialStudies() {
      var ElegibleStudies = [];

      store.state.studies.forEach((study) => {
        if (
          this.child.Age >= study.MinAge * 30.5 &&
          this.child.Age <= study.MaxAge * 30.5
        ) {
          ElegibleStudies.push(study.id);
        }
      });

      var UniquePreviousStudies = [];

      this.child.Appointments.forEach((appointment) => {
        UniquePreviousStudies.push(appointment.FK_Study);
      });

      UniquePreviousStudies = Array.from(new Set(UniquePreviousStudies));

      UniquePreviousStudies.push(this.currentStudy.id);

      var PotentialStudies = ElegibleStudies.filter(
        (study) => !UniquePreviousStudies.includes(study)
      );

      var PotentialStudyList = store.state.studies.filter((study) =>
        PotentialStudies.includes(study.id)
      );

      return PotentialStudyList;
    },
  },

  asyncComputed: {
    async PotentialExperimenters() {
      var studyIds = this.selectedStudy.map((study) => {
        return study.id;
      });

      try {
        var queryString = {
          study: studyIds,
        };

        const results = await personnel.search(queryString);

        return results.data;
      } catch (error) {
        console.log(error.response);
      }
    },
  },
};
</script>
<style lang="scss" scoped></style>
