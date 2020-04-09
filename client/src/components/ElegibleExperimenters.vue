<template>
  <v-select
    :items="PotentialExperimenters"
    :item-value="'id'"
    :item-text="'Name'"
    v-model="selectedExperimenters"
    return-object
    label="Experimenters"
    multiple
  ></v-select>
</template>

<script>
// import store from "@/store";
import personnel from "@/services/personnel";
// import study from "@/services/study";

export default {
  props: {
    study: Object,
  },
  data() {
    return {
      selectedExperimenters: [],
    };
  },
  methods: {
    selectExperimenters() {
      
      const experimenters = this.selectedExperimenters.map((experimenter) => {
        return { displayName: experimenter.Name, email: experimenter.Calendar };
      });

      this.$emit("selectExperimenters", experimenters);
    },
    clear() {
      this.selectedExperimenters = [];
    },
  },

  asyncComputed: {
    async PotentialExperimenters() {
      try {
        var queryString = {
          study: this.study.id,
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
