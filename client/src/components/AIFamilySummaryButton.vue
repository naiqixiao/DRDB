<template>
  <v-btn
    :color="color"
    :variant="variant"
    :size="size"
    :width="width"
    prepend-icon="mdi-auto-fix"
    :loading="summaryLoading"
    :disabled="!family?.id"
    @click="openSummaryDialog"
  >
    {{ label }}
  </v-btn>

  <v-dialog v-model="summaryDialog" max-width="480px">
    <v-card class="ds-card" variant="flat">
      <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
        <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">
          AI Participation Summary
        </span>
        <v-btn icon="mdi-close" variant="text" density="comfortable" @click="summaryDialog = false"></v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pt-4 pb-6 px-5">
        <div v-if="summaryLoading" class="d-flex align-center justify-center py-6">
          <v-progress-circular indeterminate color="primary" class="mr-3"></v-progress-circular>
          Generating summary…
        </div>

        <v-alert v-else-if="summaryError" type="warning" variant="tonal" density="compact">
          {{ summaryError }}
        </v-alert>

        <div v-else-if="summaryResult">
          <div class="d-flex align-center flex-wrap ga-2 mb-3">
            <v-chip size="small" :color="intentionColor(summaryResult.intentionAssessment)" variant="flat">
              {{ summaryResult.intentionAssessment || 'Uncertain' }} to participate
            </v-chip>
            <v-chip size="small" variant="outlined">{{ summaryResult.tone }} family</v-chip>
          </div>

          <p class="text-body-1 mb-2" style="line-height: 1.6;">{{ summaryResult.participationSummary }}</p>
          <p v-if="summaryResult.intentionRationale" class="text-caption text-muted mb-3" style="line-height: 1.4;">
            {{ summaryResult.intentionRationale }}
          </p>

          <div v-if="summaryResult.stats" class="ai-summary-stats text-caption text-muted">
            {{ summaryResult.stats.completedSessionCount }} completed session(s) ·
            {{ summaryResult.stats.recentNoShowCount }} recent no-show(s) ·
            {{ summaryResult.stats.recentCancellationCount }} recent cancellation(s) ·
            {{ summaryResult.stats.contactAttemptCount }} contact attempt(s)
            <span v-if="summaryResult.stats.studyTypes && summaryResult.stats.studyTypes.length">
              · Study types: {{ summaryResult.stats.studyTypes.join(', ') }}
            </span>
          </div>

          <v-alert type="info" variant="text" density="compact" class="mt-3 pa-0 text-caption" style="font-size: 0.7rem !important;">
            Advisory only, generated from scheduling history — not stored. Review before acting on it.
          </v-alert>
        </div>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="px-5 py-3">
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          size="small"
          prepend-icon="mdi-refresh"
          :loading="summaryLoading"
          @click="generateFamilySummary"
        >
          Regenerate
        </v-btn>
        <v-btn variant="flat" color="primary" size="small" @click="summaryDialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import ai from "@/services/ai";

export default {
  name: "AIFamilySummaryButton",
  props: {
    family: {
      type: Object,
      default: () => ({}),
    },
    label: {
      type: String,
      default: "AI Summary",
    },
    color: {
      type: String,
      default: "primary",
    },
    variant: {
      type: String,
      default: "tonal",
    },
    size: {
      type: String,
      default: "small",
    },
    width: {
      type: [String, Number],
      default: null,
    },
  },
  data() {
    return {
      summaryDialog: false,
      summaryLoading: false,
      summaryError: "",
      summaryResult: null,
    };
  },
  watch: {
    "family.id"() {
      this.summaryDialog = false;
      this.summaryError = "";
      this.summaryResult = null;
    },
  },
  methods: {
    openSummaryDialog() {
      this.summaryDialog = true;
      if (!this.summaryResult && !this.summaryLoading) {
        this.generateFamilySummary();
      }
    },
    intentionColor(assessment) {
      if (assessment === "Likely") return "success";
      if (assessment === "Unlikely") return "error";
      return "warning";
    },
    async generateFamilySummary() {
      if (!this.family?.id) return;
      this.summaryLoading = true;
      this.summaryError = "";
      this.summaryResult = null;
      try {
        const result = await ai.familySummary({ familyId: this.family.id });
        this.summaryResult = result.data;
      } catch (error) {
        this.summaryError = error.response?.data?.error ||
          "AI participation summary is unavailable right now.";
      } finally {
        this.summaryLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.ai-summary-stats {
  line-height: 1.5;
}
</style>
