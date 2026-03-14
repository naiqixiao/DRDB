<template>
  <v-card class="ds-card position-relative" variant="flat">
    <!-- Quick Manage / Shortcut Button -->
    <v-tooltip location="top" max-width="250">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          icon="mdi-open-in-new"
          size="small"
          color="white"
          variant="text"
          class="position-absolute"
          style="right: 8px; top: 8px; z-index: 10;"
          @click="goToStudyPage"
        ></v-btn>
      </template>
      <span>Shortcut to the Study Management page. Users with proper permissions can update study info here.</span>
    </v-tooltip>

    <v-tabs v-model="tab" color="secondary" bg-color="primary" align-tabs="center">
      <v-tab value="phone-script">
        <v-icon class="pe-2">mdi-record-voice-over</v-icon>
        Phone Script
      </v-tab>
      <v-tab value="study-info">
        <v-icon class="pe-2">mdi-view-list</v-icon>
        Study Info
      </v-tab>
    </v-tabs>

    <v-window v-model="tab" class="tabs-items">
      <v-window-item value="phone-script">
        <v-container>
          <v-row dense>
            <v-col cols="12" class="subtitle">
              <v-textarea
                :model-value="selectedStudy?.PhoneScript ? selectedStudy.PhoneScript : 'No phone script is available.'"
                variant="outlined" no-resize rows="16" readonly hide-details></v-textarea>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>

      <v-window-item value="study-info">
        <v-container style="height: 480px; overflow-y: auto;">
          <SectionHeader title="Basic Information" icon="mdi-book-open-variant" />
          <div class="info-grid info-grid--3">
            <InfoField v-for="item in $studyBasicFields" :key="item.label" :label="item.label"
              :value="selectedStudy ? selectedStudy[item.field] : ''" />
          </div>

          <div class="info-grid__full mt-3">
            <v-textarea label="Study summary" variant="outlined" no-resize rows="4"
              :model-value="selectedStudy?.Description" readonly hide-details></v-textarea>
          </div>

          <SectionHeader title="Point of Contact" icon="mdi-account-star" />
          <div class="info-grid info-grid--3">
            <InfoField v-for="item in $studyPointofContact" :key="item.label" :label="item.label"
              :value="selectedStudy && selectedStudy.PointofContact ? selectedStudy.PointofContact[item.field] : ''"
              :type="item.label === 'Email' ? 'email' : (item.label === 'Phone' ? 'phone' : null)" />
          </div>

          <SectionHeader title="Study Criteria" icon="mdi-filter-variant" />
          <div class="info-grid info-grid--3">
            <InfoField v-for="item in $studyCriteriaFields" :key="item.label" :label="item.label" :value="item.field === 'MinAge' || item.field === 'MaxAge'
              ? AgeFormated2(selectedStudy ? selectedStudy[item.field] : null)
              : (selectedStudy ? selectedStudy[item.field] : '')" />
          </div>
        </v-container>
      </v-window-item>
    </v-window>
  </v-card>
</template>

<script>
import InfoField from "@/components/InfoField.vue";
import SectionHeader from "@/components/SectionHeader.vue";

export default {
  name: "StudySummary",
  components: {
    InfoField,
    SectionHeader,
  },
  props: {
    selectedStudy: {
      type: Object,
      default: () => ({})
    },
  },
  data() {
    return {
      tab: 'phone-script',
    };
  },
  methods: {
    AgeFormated2(Age) {
      let formated = "Not born yet.";
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
    goToStudyPage() {
      // Directs the user to the Study Management page, passing the specific study ID if selected
      if (this.selectedStudy && this.selectedStudy.id) {
        this.$router.push({ name: 'Study management', params: { id: this.selectedStudy.id } });
      } else {
        this.$router.push({ name: 'Study management' });
      }
    }
  },
};
</script>

<style scoped>
.tabs-items {
  background-color: transparent;
}

.textfield-family {
  margin-bottom: 8px;
}
</style>
