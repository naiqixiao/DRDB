<template>
  <div>
    <!-- Active Experimenters -->
    <div v-if="activeExperimenters.length > 0" class="mb-4">
      <div class="d-flex align-center mb-3">
        <span class="text-caption font-weight-bold text-uppercase text-muted">Active</span>
        <v-chip size="x-small" variant="tonal" color="primary" class="ml-1">{{ activeExperimenters.length }}</v-chip>
      </div>
      <v-row dense>
        <v-col cols="12" md="6" v-for="experimenter in activeExperimenters" :key="experimenter.id" class="mb-2">
          <v-card class="experimenter-card pa-4 h-100" variant="outlined" role="button" tabindex="0"
            aria-label="View researcher project statistics" @click="openStatsDialog(experimenter)"
            @keydown.enter="openStatsDialog(experimenter)" @keydown.space.prevent="openStatsDialog(experimenter)">
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
                  <span class="text-truncate">{{ experimenter.Email }}</span>
                  <v-spacer></v-spacer>
                  <v-icon size="18" color="primary" class="ml-2">mdi-chart-box-outline</v-icon>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Retired Experimenters -->
    <div v-if="retiredExperimenters.length > 0" class="mb-4">
      <div class="d-flex align-center mb-3">
        <span class="text-caption font-weight-bold text-uppercase text-muted">Retired</span>
        <v-chip size="x-small" variant="tonal" color="grey" class="ml-1">{{ retiredExperimenters.length }}</v-chip>
      </div>
      <v-row dense>
        <v-col cols="12" md="6" v-for="experimenter in retiredExperimenters" :key="experimenter.id" class="mb-2">
          <v-card class="experimenter-card experimenter-card--retired pa-4 h-100" variant="outlined" role="button"
            tabindex="0" aria-label="View retired researcher project statistics" @click="openStatsDialog(experimenter)"
            @keydown.enter="openStatsDialog(experimenter)" @keydown.space.prevent="openStatsDialog(experimenter)">
            <div class="d-flex align-center">
              <v-avatar :color="getRoleColor(experimenter.Role)" variant="tonal" size="44" class="mr-3 font-weight-bold">
                {{ experimenter.Name ? experimenter.Name.charAt(0) : '?' }}
              </v-avatar>
              <div class="flex-grow-1" style="min-width: 0;">
                <div class="d-flex align-center justify-space-between">
                  <div class="text-subtitle-1 font-weight-bold text-truncate">
                    {{ experimenter.Name }} ({{ experimenter.Initial }})
                  </div>
                  <v-chip size="x-small" :color="getRoleColor(experimenter.Role)" variant="flat" class="text-white ml-2 font-weight-bold flex-shrink-0">{{ experimenter.Role }}</v-chip>
                </div>
                <div class="d-flex align-center mt-1 text-body-2 text-medium-emphasis">
                  <v-icon size="14" class="mr-1">mdi-email-outline</v-icon>
                  <span class="text-truncate">{{ experimenter.Email }}</span>
                  <v-spacer></v-spacer>
                  <v-icon size="18" color="primary" class="ml-2">mdi-chart-box-outline</v-icon>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- No experimenters assigned -->
    <div v-if="Experimenters.length === 0" class="text-center py-6">
      <v-icon size="40" color="grey-lighten-1">mdi-account-multiple-off</v-icon>
      <p class="text-body-2 text-muted mt-2">No experimenters assigned yet.</p>
    </div>

    <!-- Study-scoped personnel statistics -->
    <v-dialog v-model="statsDialog" max-width="680px">
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex align-center py-4 ds-header-gradient">
          <v-icon class="mr-2">mdi-chart-box-outline</v-icon>
          <span class="text-h6 font-weight-bold">Researcher Project Stats</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="closeStatsDialog"></v-btn>
        </v-card-title>

        <v-card-text class="pa-6">
          <div v-if="selectedExperimenter" class="d-flex align-center mb-5">
            <v-avatar :color="getRoleColor(selectedExperimenter.Role)" variant="tonal" size="56"
              class="mr-4 font-weight-bold text-h6">
              {{ selectedExperimenter.Name ? selectedExperimenter.Name.charAt(0) : '?' }}
            </v-avatar>
            <div class="flex-grow-1" style="min-width: 0;">
              <div class="d-flex flex-wrap align-center" style="gap: 8px;">
                <span class="text-h6 font-weight-bold text-truncate">{{ selectedExperimenter.Name }}</span>
                <v-chip size="x-small" :color="getRoleColor(selectedExperimenter.Role)" variant="tonal">
                  {{ selectedExperimenter.Role }}
                </v-chip>
                <v-chip v-if="selectedExperimenter.Retired" size="x-small" color="grey" variant="tonal">
                  Retired
                </v-chip>
              </div>
              <div class="text-body-2 text-medium-emphasis text-truncate">
                {{ studyName || 'Selected study' }}
              </div>
            </div>
          </div>

          <div v-if="statsLoading" class="d-flex flex-column align-center justify-center py-10">
            <v-progress-circular indeterminate color="primary" size="44"></v-progress-circular>
            <span class="text-body-2 text-medium-emphasis mt-3">Loading project statistics…</span>
          </div>

          <v-alert v-else-if="statsError" type="error" variant="tonal" density="comfortable">
            {{ statsError }}
          </v-alert>

          <template v-else>
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-card class="project-stat-card pa-4 text-center h-100" variant="outlined">
                  <v-icon color="primary" size="24" class="mb-2">mdi-account-star-outline</v-icon>
                  <div class="text-h4 font-weight-bold text-primary">{{ projectStats.e1Count }}</div>
                  <div class="project-stat-label">Sessions (E1)</div>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card class="project-stat-card pa-4 text-center h-100" variant="outlined">
                  <v-icon color="primary" size="24" class="mb-2">mdi-account-multiple-outline</v-icon>
                  <div class="text-h4 font-weight-bold text-primary">{{ projectStats.e2Count }}</div>
                  <div class="project-stat-label">Sessions (E2)</div>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card class="project-stat-card pa-4 text-center h-100" variant="outlined">
                  <v-icon color="success" size="24" class="mb-2">mdi-account-plus-outline</v-icon>
                  <div class="text-h4 font-weight-bold text-success">{{ projectStats.scheduledCount }}</div>
                  <div class="project-stat-label">Recruited</div>
                </v-card>
              </v-col>
            </v-row>

            <div class="d-flex align-center justify-center text-caption text-medium-emphasis mt-4">
              <v-icon size="15" class="mr-1">mdi-information-outline</v-icon>
              Counts shown here are scoped to this study only.
            </div>
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>

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
                :items="allMembers"
                item-title="Name"
                item-value="id"
                return-object
                label="Select experimenters..."
                multiple
                chips
                closable-chips
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
import personnelApi from "@/services/personnel";

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
    studyName: {
      type: String,
      default: ""
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
      statsDialog: false,
      statsLoading: false,
      statsError: "",
      selectedExperimenter: null,
      projectStats: { e1Count: 0, e2Count: 0, scheduledCount: 0 },
      statsCache: {},
    };
  },

  computed: {
    activeExperimenters() {
      return this.Experimenters.filter((e) => !e.Retired);
    },
    retiredExperimenters() {
      return this.Experimenters.filter((e) => e.Retired);
    },
    canManageExperimenters() {
      if (!this.studyId) return false;
      const role = this.store.role;
      return (
        this.PointofContactId == this.store.userID ||
        role === 'Admin' ||
        role === 'PI' ||
        role === 'Lab manager'
      );
    },
    allMembers() {
      // Combine labMembers with currently assigned experimenters
      // to ensure retired members are visible and correctly labeled
      const combined = [...this.labMembers];
      const activeIds = new Set(this.labMembers.map(m => m.id));
      
      this.Experimenters.forEach(exp => {
        if (!activeIds.has(exp.id)) {
          // Add retired member to the list so they can be seen/removed in the select
          combined.push({ 
            ...exp, 
            Name: exp.Name ? `${exp.Name} (Retired)` : 'Unknown (Retired)'
          });
        }
      });
      
      return combined;
    }
  },

  methods: {
    async openStatsDialog(experimenter) {
      this.selectedExperimenter = experimenter;
      this.projectStats = { e1Count: 0, e2Count: 0, scheduledCount: 0 };
      this.statsError = "";
      this.statsDialog = true;

      const cacheKey = `${experimenter.id}:${this.studyId}`;
      if (this.statsCache[cacheKey]) {
        this.projectStats = { ...this.statsCache[cacheKey] };
        return;
      }

      const personnelId = experimenter.id;
      const studyId = this.studyId;
      this.statsLoading = true;
      try {
        const response = await personnelApi.getStats(personnelId);
        if (this.selectedExperimenter?.id !== personnelId || this.studyId !== studyId) return;
        const studyStats = (response.data.byStudy || []).find(stats => Number(stats.studyId) === Number(studyId));
        const projectStats = {
          e1Count: Number(studyStats?.e1Count) || 0,
          e2Count: Number(studyStats?.e2Count) || 0,
          scheduledCount: Number(studyStats?.scheduledCount) || 0,
        };
        this.projectStats = projectStats;
        this.statsCache[cacheKey] = projectStats;
      } catch (error) {
        if (this.selectedExperimenter?.id === personnelId) {
          this.statsError = error.response?.data?.error || "Unable to load this researcher's project statistics.";
        }
      } finally {
        if (this.selectedExperimenter?.id === personnelId) this.statsLoading = false;
      }
    },

    closeStatsDialog() {
      this.statsDialog = false;
      this.statsLoading = false;
      this.statsError = "";
      this.selectedExperimenter = null;
    },

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
        studyId: this.studyId,
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

<style scoped>
.experimenter-card {
  border-color: #e2e8f0 !important;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.experimenter-card:hover,
.experimenter-card:focus-visible {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 5px 16px rgba(30, 64, 175, 0.12);
  outline: none;
  transform: translateY(-2px);
}

.experimenter-card--retired {
  opacity: 0.65;
  border-style: dashed !important;
}

.project-stat-card {
  border-color: #e2e8f0 !important;
  background: #f8fafc;
}

.project-stat-label {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
