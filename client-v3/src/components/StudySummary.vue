<template>
  <v-card class="ds-card" variant="flat" style="position: relative; overflow: hidden;">

    <!-- Background Study Type Watermark -->
    <div v-if="selectedStudy?.StudyType"
      style="position: absolute; right: 10px; bottom: -10px; font-size: 80px; font-weight: 900; color: rgba(0,0,0,0.06); z-index: 0; line-height: 0.8; pointer-events: none; user-select: none;">
      {{ selectedStudy.StudyType }}
    </div>

    <v-card-text class="pt-5 pb-4" style="position: relative; z-index: 1;">
      <!-- Header: Study Name + Shortcut -->
      <div class="d-flex align-center mb-4">
        <v-avatar color="primary" size="48" class="mr-3">
          <v-icon size="24" color="white">mdi-flask-outline</v-icon>
        </v-avatar>
        <div class="flex-grow-1">
          <h2 class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading); line-height: 1.3;">
            {{ selectedStudy?.StudyName || 'Select a study' }}
          </h2>
          <div class="text-caption text-muted" v-if="selectedStudy?.StudyType">
            {{ selectedStudy.StudyType }}
          </div>
        </div>
        <v-tooltip location="top" max-width="250">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon="mdi-open-in-new" size="small" variant="text" color="primary"
              @click="goToStudyPage"></v-btn>
          </template>
          <span>Shortcut to the Study Management page</span>
        </v-tooltip>
      </div>

      <!-- Age Range -->
      <div class="mb-3" v-if="selectedStudy?.MinAge || selectedStudy?.MaxAge">
        <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-human-child">
          {{ AgeFormated2(selectedStudy?.MinAge) }} — {{ AgeFormated2(selectedStudy?.MaxAge) }}
        </v-chip>
      </div>

      <!-- Exclusion / Inclusion Criteria -->
      <div class="d-flex flex-wrap mb-4" style="gap: 6px;" v-if="hasCriteriaChips">
        <v-chip size="x-small" variant="tonal" :color="criteriaColor(selectedStudy?.ASDParticipant)"
          v-if="selectedStudy?.ASDParticipant && selectedStudy?.ASDParticipant !== 'Include'">
          ASD: {{ selectedStudy.ASDParticipant }}
        </v-chip>
        <v-chip size="x-small" variant="tonal" :color="criteriaColor(selectedStudy?.PrematureParticipant)"
          v-if="selectedStudy?.PrematureParticipant && selectedStudy?.PrematureParticipant !== 'Include'">
          Premature: {{ selectedStudy.PrematureParticipant }}
        </v-chip>
        <v-chip size="x-small" variant="tonal" :color="criteriaColor(selectedStudy?.IllParticipant)"
          v-if="selectedStudy?.IllParticipant && selectedStudy?.IllParticipant !== 'Include'">
          Illness: {{ selectedStudy.IllParticipant }}
        </v-chip>
        <v-chip size="x-small" variant="tonal" :color="criteriaColor(selectedStudy?.VisionLossParticipant)"
          v-if="selectedStudy?.VisionLossParticipant && selectedStudy?.VisionLossParticipant !== 'Include'">
          Vision: {{ selectedStudy.VisionLossParticipant }}
        </v-chip>
        <v-chip size="x-small" variant="tonal" :color="criteriaColor(selectedStudy?.HearingLossParticipant)"
          v-if="selectedStudy?.HearingLossParticipant && selectedStudy?.HearingLossParticipant !== 'Include'">
          Hearing: {{ selectedStudy.HearingLossParticipant }}
        </v-chip>
      </div>

      <!-- Point of Contact -->
      <div v-if="selectedStudy?.PointofContact?.Name" class="mb-3">
        <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Point of Contact</div>
        <v-list density="compact" class="text-left px-0 py-0" style="background: transparent;">
          <v-list-item prepend-icon="mdi-account-star" :title="selectedStudy.PointofContact.Name"
            class="px-0" density="compact"></v-list-item>
          <v-list-item v-if="selectedStudy.PointofContact.Email" prepend-icon="mdi-email-outline"
            class="px-0" density="compact">
            <v-list-item-title class="d-flex align-center">
              <a :href="'mailto:' + selectedStudy.PointofContact.Email" class="text-primary">{{ selectedStudy.PointofContact.Email }}</a>
              <v-btn icon="mdi-content-copy" variant="text" size="x-small" density="compact" class="ml-2" @click="copyToClipboard(selectedStudy.PointofContact.Email)"></v-btn>
            </v-list-item-title>
          </v-list-item>
          <v-list-item v-if="selectedStudy.PointofContact.Phone" prepend-icon="mdi-phone-outline"
            class="px-0" density="compact">
            <v-list-item-title class="d-flex align-center">
              {{ PhoneFormated(selectedStudy.PointofContact.Phone) }}
              <v-btn icon="mdi-content-copy" variant="text" size="x-small" density="compact" class="ml-2" @click="copyToClipboard(selectedStudy.PointofContact.Phone)"></v-btn>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <v-divider class="my-3"></v-divider>

      <!-- Study Description (collapsible) -->
      <div v-if="selectedStudy?.Description">
        <div class="d-flex align-center cursor-pointer" @click="showDescription = !showDescription">
          <v-icon size="small" class="mr-1">{{ showDescription ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
          <span class="text-caption font-weight-bold text-uppercase text-muted">Study Description</span>
        </div>
        <div v-if="showDescription" class="text-body-2 mt-2 px-1" style="line-height: 1.5; white-space: pre-wrap;">{{ selectedStudy.Description }}</div>
      </div>

      <!-- Phone Script (collapsible) -->
      <div class="mt-3" v-if="selectedStudy?.StudyName">
        <div class="d-flex align-center cursor-pointer" @click="showPhoneScript = !showPhoneScript">
          <v-icon size="small" class="mr-1">{{ showPhoneScript ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
          <span class="text-caption font-weight-bold text-uppercase text-muted">Phone Script</span>
        </div>
        <v-textarea v-if="showPhoneScript"
          :model-value="selectedStudy?.PhoneScript ? selectedStudy.PhoneScript : 'No phone script is available.'"
          variant="outlined" no-resize rows="12" readonly hide-details class="mt-2"></v-textarea>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: "StudySummary",
  props: {
    selectedStudy: {
      type: Object,
      default: () => ({})
    },
  },
  data() {
    return {
      showPhoneScript: true,
      showDescription: false,
    };
  },
  computed: {
    hasCriteriaChips() {
      const s = this.selectedStudy;
      if (!s) return false;
      return [s.ASDParticipant, s.PrematureParticipant, s.IllParticipant, s.VisionLossParticipant, s.HearingLossParticipant]
        .some(v => v && v !== 'Include');
    },
  },
  methods: {
    AgeFormated2(Age) {
      let formated = "N/A";
      if (Age > 0) {
        const years = Math.floor(Age / 12);
        const months = Age % 12;
        let Y = years > 0 ? years + " year" : "";
        Y = years > 1 ? Y + "s " : Y + " ";

        let M = "";
        if (months > 0) {
          M = months + " month";
          M = months !== 1 ? M + "s" : M;
        }

        formated = (Y + M).trim();
      }
      return formated;
    },
    criteriaColor(value) {
      if (value === 'Exclude') return 'error';
      if (value === 'Only') return 'warning';
      return 'grey';
    },
    goToStudyPage() {
      if (this.selectedStudy && this.selectedStudy.id) {
        this.$router.push({ name: 'Study management', params: { id: this.selectedStudy.id } });
      } else {
        this.$router.push({ name: 'Study management' });
      }
    },
    PhoneFormated(Phone) {
      if (!Phone) return '';
      var cleaned = ('' + Phone).replace(/\D/g, '');
      var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) return '(' + match[1] + ') ' + match[2] + '-' + match[3];
      return Phone;
    },
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard:', text);
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
