<template>
  <div class="pagination-container" >
    <v-btn class="ma-0" text icon @click="previousPage" :disabled="page <= 1">
      <v-icon large>navigate_before </v-icon></v-btn
    >

    <span class="title">{{ page + " / " + NofPages }}</span>

    <v-btn
      class="ma-0"
      text
      icon
      @click="nextPage"
      :disabled="page >= NofPages || page == 0"
      ><v-icon large>navigate_next </v-icon></v-btn
    >
  </div>
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
  text-align: end;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
</style>
