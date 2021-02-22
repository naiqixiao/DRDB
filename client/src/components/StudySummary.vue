<template>
  <v-card outlined>
    <v-tabs
      v-model="tabs"
      fixed-tabs
      color="var(--v-secondary-base)"
      background-color="var(--v-primary-base)"
    >
      <v-tab href="#tabs-1">
        <v-icon style="padding-right: 8px">record_voice_over </v-icon>
        Phone Script
      </v-tab>

      <v-tab href="#tabs-2">
        <v-icon style="padding-right: 8px">view_list</v-icon>
        Study Infomation
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="tabs">
      <v-tab-item value="tabs-1" class="tabs-items">
        <v-row dense>
          <v-col md="12" class="subtitle">
            <v-textarea
              label=""
              background-color="textbackground"
              outlined
              no-resize
              :value="
                selectedStudy.PhoneScript
                  ? selectedStudy.PhoneScript
                  : 'No phone script is available.'
              "
              rows="20"
              readonly
              hide-details
            ></v-textarea>
          </v-col>
        </v-row>
      </v-tab-item>

      <v-tab-item value="tabs-2" class="tabs-items">
        <v-row dense>
        <v-row>
          <v-col md="12" class="subtitle">
            <v-divider></v-divider>
            <h4 class="text-left"></h4>
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
            v-for="item in this.$studyBasicFields"
            :key="item.label"
          >
            <v-text-field
              class="textfield-family"
              background-color="textbackground"
              hide-details
              :label="item.label"
              :value="selectedStudy[item.field]"
              placeholder="  "
              outlined
              dense
              readonly
            ></v-text-field>
          </v-col>
          <v-col md="12" class="subtitle">
            <v-textarea
              label="Study summary"
              background-color="textbackground"
              outlined
              no-resize
              rows="5"
              :value="selectedStudy.Description"
              readonly
              hide-details
            ></v-textarea>
          </v-col>
        </v-row>

        <v-row justify="space-around">
          <v-col md="12">
            <v-divider></v-divider>
            <h4 class="text-left">Point of contact:</h4>
          </v-col>
          <v-col
            cols="12"
            sm="4"
            v-for="item in this.$studyPointofContact"
            :key="item.label"
          >
            <v-text-field
              class="textfield-family"
              background-color="textbackground"
              hide-details
              :label="item.label"
              :value="selectedStudy.PointofContact[item.field]"
              placeholder="  "
              readonly
              outlined
              dense
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col md="12" class="subtitle">
            <v-divider></v-divider>
            <h4 class="text-left">Study criteria:</h4>
          </v-col>

          <v-col
            cols="12"
            sm="6"
            :md="item.width"
            v-for="item in this.$studyCriteriaFields"
            :key="item.label"
          >
            <v-text-field
              class="textfield-family"
              background-color="textbackground"
              hide-details
              :label="item.label"
              :value="
                item.field == 'MinAge' || item.field == 'MaxAge'
                  ? AgeFormated2(selectedStudy[item.field])
                  : selectedStudy[item.field]
              "
              placeholder="  "
              outlined
              dense
              readonly
            ></v-text-field>
          </v-col>
        </v-row>
        </v-row>
      </v-tab-item>
    </v-tabs-items>
  </v-card>
</template>

<script>
export default {
  props: {
    selectedStudy: Object,
  },
  data() {
    return {
      tabs: null,
    };
  },
  methods: {
    AgeFormated2(Age) {
      var formated = "Not born yet.";
      if (Age > 0) {
        var years = Math.floor(Age / 12);
        var months = Age % 12;
        // months = months.toFixed(1);
        var Y = years > 0 ? years + " year" : "";
        Y = years > 1 ? Y + "s " : Y + " ";

        var M = "";

        if (months > 0) {
          M = months + " month";
          M = months !== 1 ? M + "s" : M;
        }

        formated = Y + M;
      }
      return formated;
    },
  },
};
</script>

<style lang="scss" scoped>
.noPadding {
  padding: 8px 8px 4px 8px !important;
}

.tabs-items {
  background-color: rgba($color: #000000, $alpha: 0);
  height: 430px;
}

.v-tab {
  max-width: 50%;
}
</style>
