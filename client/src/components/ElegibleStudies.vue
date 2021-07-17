<template>
  <v-select
    :items="PotentialStudies"
    :item-value="'id'"
    :item-text="'StudyName'"
    v-model="selectedStudy"
    return-object
    label="Studies"
    multiple
    chip
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

    studyElegibility(study, child) {
      if (child.DoB != null) {
        var age =
          child.Age >= study.MinAge * 30.5 - 1 &&
          child.Age <= study.MaxAge * 30.5 - 1;

        var asd = false;

        switch (study.ASDParticipant) {
          case "Only":
            child.Family.AutismHistory ? (asd = true) : (asd = false);
            break;

          case "Exclude":
            child.Family.AutismHistory ? (asd = false) : (asd = true);

            break;

          case "Include":
            asd = true;
            break;
        }

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

        return age && asd && hearing && vision && premature && illness;
      } else {
        return false;
      }
    },

    clear() {
      this.selectedStudy = [];
    },
  },
  computed: {
    PotentialStudies() {
      var ElegibleStudies = [];

      store.state.studies.forEach((study) => {
        if (this.studyElegibility(study, this.child)) {
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
