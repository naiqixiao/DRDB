<template>
  <v-select
    :items="PotentialStudies"
    :item-value="'id'"
    :item-text="'StudyName'"
    v-model="selectedStudy"
    return-object
    label="Studies"
    multiple
  ></v-select>
</template>

<script>
import store from "@/store";

export default {
  props: {
    child: Object,
  },
  data() {
    return {
      selectedStudy: [],
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

      var PotentialStudies = ElegibleStudies.filter(
        (study) => !UniquePreviousStudies.includes(study)
      );

      var PotentialStudyList = store.state.studies.filter((study) =>
        PotentialStudies.includes(study.id)
      ); // If an study object needs to be returned.
      // console.log(PotentialStudies);
      return PotentialStudyList;
    },
  },
};
</script>
<style lang="scss" scoped></style>
