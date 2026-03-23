<template>
  <v-container fluid class="pa-0">
    <v-row dense justify="start">
      <v-col cols="12" md="4" v-for="study in enrichedStudies" :key="study.id" class="mb-2">
        <v-card class="ds-card d-flex flex-column h-100 bg-white transition-all duration-200 border-slate-200 hover:border-primary cursor-pointer hover:-translate-y-1 hover:shadow-md" variant="outlined">
          <v-card-title class="d-flex align-center py-2 text-subtitle-1 font-weight-bold" style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">
            {{ study.StudyName }}
            <v-spacer></v-spacer>
            <span class="text-caption text-medium-emphasis mr-2">({{ study.StudyType }})</span>
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-open-in-new"
                  variant="text"
                  size="x-small"
                  color="grey"
                  class="transition-transform duration-200 hover-scale"
                  :to="`/study/${study.id}`"
                  target="_blank"
                ></v-btn>
              </template>
              <span>Manage study</span>
            </v-tooltip>
          </v-card-title>

          <v-card-text class="py-2 text-body-2 text-primary">
            <template v-if="study.AgeGroups && study.AgeGroups.length > 0">
              <span v-for="(group, i) in study.AgeGroups" :key="i">
                {{ AgeFormated(group.MinAge) }} to {{ AgeFormated(group.MaxAge) }}<span v-if="i < study.AgeGroups.length - 1"> &middot; </span>
              </span>
            </template>
            <template v-else>Age range not set</template>
          </v-card-text>
          
          <v-card-text class="py-2 text-caption font-weight-bold text-uppercase text-right" :class="study.Completed ? 'text-success' : 'text-primary'">
            <v-icon start size="14" class="mr-1">{{ study.Completed ? 'mdi-check-circle' : 'mdi-progress-clock' }}</v-icon>
            {{ study.Completed ? "Completed" : "In progress" }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Assign Studies Dialog -->
    <v-dialog v-model="dialogStudy" max-width="800px" persistent>
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">
            Assign studies to {{ personnelName }}
          </span>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="close"></v-btn>
        </v-card-title>

        <v-card-text class="pt-6">
          <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Study Selection</div>
          <v-row justify="center">
            <v-col cols="12">
              <v-select
                v-model="editedStudies"
                :items="activeLabStudies"
                item-title="StudyName"
                item-value="id"
                return-object
                label="Select studies..."
                multiple
                chips
                hide-details
                variant="outlined"
                density="compact"
                bg-color="white"
                color="primary"
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions class="px-6 pb-6 pt-0 d-flex justify-end">
          <v-btn color="error" variant="text" @click="close" class="mr-2">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="save" prepend-icon="mdi-content-save">Save Assignments</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-row align="center" justify="end" class="mt-4">
      <v-col cols="auto">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-book-plus-multiple"
              class="text-none font-weight-bold"
              v-bind="props"
              @click.stop="updateStudies"
              :disabled="!canManageStudies"
            >
              Assign Studies
            </v-btn>
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
    enrichedStudies() {
      return this.Studies.map(study => {
        const fullStudy = this.labStudies.find(ls => ls.id === study.id) || {};
        return {
          ...study,
          AgeGroups: fullStudy.AgeGroups || study.AgeGroups || []
        };
      });
    },
    
    activeLabStudies() {
      // Only show active (non-completed) studies in the assign dialog
      return this.labStudies.filter(study => !study.Completed);
    },
    
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
      if (Age === null || Age === undefined || Age < 0) return "Not born yet.";
      
      const years = Math.floor(Age / 12);
      const months = Age % 12;
      
      let formatted = "";
      if (years > 0) formatted += `${years} y `;
      if (months > 0 || years === 0) formatted += `${months} m`;
      
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
