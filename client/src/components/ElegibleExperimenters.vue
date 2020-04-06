<template>
  <v-select
    :items="PotentialExperimenters"
    :item-value="'id'"
    :item-text="'Name'"
    v-model="selectedExperimenters"
    @change="selectExperimenters"
    return-object
    label="Experimenters"
    multiple
  ></v-select>
</template>

<script>
// import store from "@/store";
// import personnel from "@/services/personnel";
import study from "@/services/study";

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
      this.$emit("selectExperimenters", this.selectedExperimenters);
    },
    clear() {
      this.selectedExperimenters = [];
    },
  },

  asyncComputed: {
    async PotentialExperimenters() {
      try {
        var queryString = {
          id: this.study.id,
        };

        const results = await study.search(queryString);

        return results.data.Personnels;
      } catch (error) {
        console.log(JSON.stringify(error.response));
      }
    },
  },
};
</script>
<style lang="scss" scoped></style>
