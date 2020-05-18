<template>
  <div class="pagination-container">
    <v-btn class="ma-0" text icon @click="previousPage" :disabled="page <= 1">
      <v-icon large>navigate_before </v-icon></v-btn
    >

    <div class="title" style="width:45px">{{ page }}</div>
    <div class="title" style="padding-left: 8px; padding-right: 8px;">{{" / " }}</div>
    <div class="title" style="width:45px; text-align: left">{{ NofPages }}</div>

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

<style>
.pagination-container {
  text-align: end;
  display: flex;
  align-items: center;
}
</style>
