<template>
  <v-card variant="outlined">
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
                variant="outlined" 
                no-resize 
                rows="16" 
                readonly 
                hide-details
              ></v-textarea>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>

      <v-window-item value="study-info">
        <v-container style="height: 480px; overflow-y: auto;">
          <v-row dense>
            <v-col cols="12" class="subtitle">
              <v-divider></v-divider>
            </v-col>
            <v-col cols="12" sm="6" md="4" v-for="item in $studyBasicFields" :key="item.label">
              <v-text-field 
                class="textfield-family" 
                hide-details 
                :label="item.label"
                :model-value="selectedStudy ? selectedStudy[item.field] : ''" 
                variant="outlined" 
                density="compact" 
                readonly
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="subtitle mt-3">
              <v-textarea 
                label="Study summary" 
                variant="outlined" 
                no-resize 
                rows="5"
                :model-value="selectedStudy?.Description" 
                readonly 
                hide-details
              ></v-textarea>
            </v-col>
          </v-row>

          <v-row justify="space-around" dense class="mt-4">
            <v-col cols="12">
              <v-divider></v-divider>
              <h4 class="text-left py-2">Point of contact:</h4>
            </v-col>
            <v-col cols="12" sm="4" v-for="item in $studyPointofContact" :key="item.label">
              <v-text-field 
                class="textfield-family" 
                hide-details 
                :label="item.label"
                :model-value="selectedStudy && selectedStudy.PointofContact ? selectedStudy.PointofContact[item.field] : ''" 
                readonly 
                variant="outlined" 
                density="compact"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-row dense class="mt-4">
            <v-col cols="12" class="subtitle">
              <v-divider></v-divider>
              <h4 class="text-left py-2">Study criteria:</h4>
            </v-col>

            <v-col cols="12" sm="6" :md="item.width" v-for="item in $studyCriteriaFields" :key="item.label">
              <v-text-field 
                class="textfield-family" 
                hide-details 
                :label="item.label"
                :model-value="item.field === 'MinAge' || item.field === 'MaxAge'
                  ? AgeFormated2(selectedStudy ? selectedStudy[item.field] : null)
                  : (selectedStudy ? selectedStudy[item.field] : '')" 
                variant="outlined" 
                density="compact" 
                readonly
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>
    </v-window>
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
