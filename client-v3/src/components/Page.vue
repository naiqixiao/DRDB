<template>
  <div class="pagination-container">
    <v-btn class="ma-0" variant="text" icon="mdi-chevron-left" size="large" @click="previousPage" :disabled="page <= 1">
    </v-btn>

    <span class="text-h6" style="min-width: 20px; text-align: right">{{ page }}</span>
    <span class="text-h6 mx-1" style="opacity: 0.5">/</span>
    <span class="text-h6" style="min-width: 20px; text-align: left">{{ NofPages }}</span>

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
