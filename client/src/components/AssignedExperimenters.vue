<template>
  <div>
    <div>
      <v-row dense>
        <v-col cols="12" md="6" v-for="experimenter in Experimenters" :key="experimenter.id" class="mb-2">
          <v-card class="experimenter-card pa-4 h-100" variant="outlined" style="border-color: #E2E8F0 !important; transition: all 0.2s ease;">
            <div class="d-flex align-center">
              <v-avatar :color="getRoleColor(experimenter.Role)" variant="tonal" size="44" class="mr-3 font-weight-bold">
                {{ experimenter.Name ? experimenter.Name.charAt(0) : '?' }}
              </v-avatar>
              <div class="flex-grow-1" style="min-width: 0;">
                <div class="d-flex align-center justify-space-between">
                  <div class="text-subtitle-1 font-weight-bold text-truncate" style="color: var(--color-primary);">
                    {{ experimenter.Name }} ({{ experimenter.Initial }})
                  </div>
                  <v-chip size="x-small" :color="getRoleColor(experimenter.Role)" variant="flat" class="text-white ml-2 font-weight-bold flex-shrink-0">{{ experimenter.Role }}</v-chip>
                </div>
                <div class="d-flex align-center mt-1 text-body-2 text-medium-emphasis">
                  <v-icon size="14" class="mr-1">mdi-email-outline</v-icon>
                  {{ experimenter.Email }}
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Assign Experimenters Dialog -->
    <v-dialog v-model="dialogExperimenter" max-width="800px" persistent>
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">
            Assign experimenters to study
          </span>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="close"></v-btn>
        </v-card-title>

        <v-card-text class="pt-6">
          <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Team Selection</div>
          <v-row justify="center">
            <v-col cols="12">
              <v-select
                v-model="editedExperimenter"
                :items="labMembers"
                item-title="Name"
                item-value="id"
                return-object
                label="Select experimenters..."
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

    <v-row align="start" justify="end" class="mt-4">
      <v-col cols="auto">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-account-multiple-plus"
              class="text-none font-weight-bold"
              v-bind="props"
              @click.stop="updateExperimenters"
              :disabled="!canManageExperimenters"
            >
              Assign Experimenters
            </v-btn>
          </template>
          <span>Assign experimenters to this study</span>
        </v-tooltip>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import experimenterApi from "@/services/experimenter";

import { useMainStore } from "@/stores/mainStore";

export default {
  setup() {
    const store = useMainStore();
    return { store };
  },
  name: "AssignedExperimenters",
  props: {
    Experimenters: {
      type: Array,
      default: () => []
    },
    labMembers: {
      type: Array,
      default: () => []
    },
    studyId: {
      type: Number,
      required: true
    },
    PointofContactId: {
      type: Number,
      default: null
    },
  },

  data() {
    return {
      dialogExperimenter: false,
      editedExperimenter: [],
    };
  },

  computed: {
    canManageExperimenters() {
      if (!this.studyId) return false;
      const role = this.store.role;
      return (
        this.PointofContactId == this.store.userID ||
        role === 'Admin' ||
        role === 'PI' ||
        role === 'Lab manager'
      );
    }
  },

  methods: {
    getRoleColor(role) {
      const colors = {
        'PI': '#8B5CF6',           // Purple
        'Admin': '#EF4444',        // Red
        'Lab manager': '#F59E0B',  // Amber
        'PostDoc': '#3B82F6',      // Blue
        'GradStudent': '#10B981',  // Green
        'Undergrad': '#EC4899',    // Pink
        'RA': '#06B6D4',           // Cyan
        'Staff': '#64748B'         // Slate
      };
      return colors[role] || '#94A3B8';
    },

    updateExperimenters() {
      // Create a shallow copy to edit so we don't mutate props directly
      this.editedExperimenter = [...this.Experimenters];
      this.dialogExperimenter = true;
    },

    async save() {
      const newExperimenters = {
        experimenters: this.editedExperimenter.map((experimenter) => ({
          FK_Study: this.studyId,
          FK_Experimenter: experimenter.id,
        }))
      };

      try {
        await experimenterApi.postExperimenters(newExperimenters);
        this.$emit("updatedExperimenters", this.editedExperimenter);
        this.close();
      } catch (error) {
        console.error("Error assigning experimenters:", error);
      }
    },

    close() {
      this.dialogExperimenter = false;
      this.editedExperimenter = [];
    },
  },
  
  watch: {
    dialogExperimenter(val) {
      val || this.close();
    },
  },
};
</script>
