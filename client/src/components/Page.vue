<template>
  <v-container class="pagination-container">
    <!-- <v-row no-gutters justify="end" align = "center">
      <v-col cols="12" md="12" class=".align-self-center"> -->
    <v-btn class="ma-0" text icon @click="previousPage" :disabled="page <= 1">
      <v-icon large>navigate_before </v-icon></v-btn
    >

    <span class="title">{{ page + " / " + NofPages }}</span>

    <v-btn class="ma-0" text icon @click="nextPage" :disabled="page >= NofPages || page == 0"
      ><v-icon large>navigate_next </v-icon></v-btn
    >
    <!-- </v-col>
    </v-row> -->
  </v-container>
</template>

<script>
export default {
  props: {
    page: Number,
    NofPages: Number,
  },

  methods: {
    nextPage() {
      this.$emit("nextPage");
    },

    previousPage() {
      this.$emit("previousPage");
    },
  },
};
</script>

<style lang="scss">
.pagination-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
}
</style>
