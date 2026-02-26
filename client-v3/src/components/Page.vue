<template>
  <div class="pagination-container">
    <v-btn class="ma-0" variant="text" icon="mdi-chevron-left" size="large" @click="previousPage" :disabled="page <= 1">
    </v-btn>

    <div class="text-h6" style="width:45px">{{ page }}</div>
    <div class="text-h6 px-2">{{ " / " }}</div>
    <div class="text-h6 text-left" style="width:45px">{{ NofPages }}</div>

    <v-btn class="ma-0" variant="text" icon="mdi-chevron-right" size="large" @click="nextPage"
      :disabled="page >= NofPages || page === 0">
    </v-btn>
  </div>
</template>

<script>
export default {
  name: "Page",
  props: {
    page: Number,
    NofPages: Number,
  },
  emits: ["nextPage", "previousPage"],
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

<style scoped>
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
</style>
