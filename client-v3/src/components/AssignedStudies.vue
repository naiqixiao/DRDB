<template>
  <v-container fluid class="pa-0">
    <v-row dense justify="start">
      <v-col cols="12" md="4" v-for="study in Studies" :key="study.id" class="mb-2">
        <v-card class="d-flex flex-column h-100" variant="elevated">
          <v-card-title class="d-flex align-center py-2 text-subtitle-1 font-weight-bold">
            {{ study.StudyName }}
            <v-spacer></v-spacer>
            <span class="text-body-2 text-medium-emphasis">({{ study.StudyType }})</span>
          </v-card-title>

          <v-card-text class="py-2 text-body-2 text-primary">
            <template v-if="study.AgeGroups && study.AgeGroups.length > 0">
              <span v-for="(group, i) in study.AgeGroups" :key="i">
                {{ AgeFormated(group.MinAge) }} to {{ AgeFormated(group.MaxAge) }}<span v-if="i < study.AgeGroups.length - 1"> &middot; </span>
              </span>
            </template>
            <template v-else>Age range not set</template>
          </v-card-text>
          
          <v-card-text class="py-2 text-body-2 font-weight-medium text-error text-right">
            {{ study.Completed ? "Completed" : "In progress" }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Assing Studies Dialog -->
    <v-dialog v-model="dialogStudy" max-width="800px">
      <v-card>
        <v-card-title class="text-h6 py-4">
          Assign studies to {{ personnelName }}
        </v-card-title>

        <v-card-text class="py-6">
          <v-row justify="center">
            <v-col cols="12" md="10">
              <v-select
                v-model="editedStudies"
                :items="labStudies"
                item-title="StudyName"
                item-value="id"
                return-object
                label="Studies"
                multiple
                chips
                hide-details
                variant="outlined"
                density="compact"
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="close">Cancel</v-btn>
          <v-btn color="primary" variant="text" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-row align="center" justify="end" class="mt-4">
      <v-col cols="auto">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              color="primary"
              icon="mdi-badge-account"
              size="large"
              v-bind="props"
              @click.stop="updateStudies"
              :disabled="!canManageStudies"
            ></v-btn>
          </template>
          <span>Assign studies to this person</span>
        </v-tooltip>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import api from "@/services/api";

import { useMainStore } from "@/stores/mainStore";

export default {
  setup() {
    const store = useMainStore();
    return { store };
  },
  name: "AssignedStudies",
  props: {
    Studies: {
      type: Array,
      default: () => []
    },
    labStudies: {
      type: Array,
      default: () => []
    },
    personnelId: {
      type: Number,
      required: true
    },
    personnelName: {
      type: String,
      default: ""
    },
  },

  data() {
    return {
      dialogStudy: false,
      editedStudies: [],
    };
  },

  computed: {
    canManageStudies() {
      const role = this.store.role;
      return (
        this.personnelId == this.store.userID ||
        role === 'Admin' ||
        role === 'PI' ||
        role === 'Lab manager'
      );
    }
  },

  methods: {
    updateStudies() {
      // Create a shallow copy to edit so we don't mutate props directly
      this.editedStudies = [...this.Studies];
      this.dialogStudy = true;
    },

    async save() {
      const newStudies = {
        studies: this.editedStudies.map((study) => ({
          FK_Experimenter: this.personnelId,
          FK_Study: study.id,
        }))
      };

      try {
        await api().post('/experimenter/studies', newStudies);
        this.$emit("updatedStudies", this.editedStudies);
        this.close();
      } catch (error) {
        console.error("Error assigning studies:", error);
      }
    },

    close() {
      this.dialogStudy = false;
      this.editedStudies = [];
    },

    AgeFormated(Age) {
      if (!Age || Age <= 0) return "Not born yet.";
      
      const years = Math.floor(Age / 12);
      const months = Age % 12;
      
      let formatted = "";
      if (years > 0) formatted += `${years} y `;
      formatted += `${months} m`;
      
      return formatted.trim();
    },
  },
  
  watch: {
    dialogStudy(val) {
      val || this.close();
    },
  },
};
</script>
