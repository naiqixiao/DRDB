<template>
  <div>
    <div>
      <v-row dense>
        <v-col cols="12" md="6" v-for="experimenter in Experimenters" :key="experimenter.id" class="mb-2">
          <v-card class="experimenter-card pa-4 h-100" variant="outlined" style="border-color: #E2E8F0 !important; transition: all 0.2s ease;">
            <div class="d-flex align-center">
              <v-avatar color="primary" variant="tonal" size="44" class="mr-3 font-weight-bold">
                {{ experimenter.Name ? experimenter.Name.charAt(0) : '?' }}
              </v-avatar>
              <div class="flex-grow-1" style="min-width: 0;">
                <div class="d-flex align-center justify-space-between">
                  <div class="text-subtitle-1 font-weight-bold text-truncate" style="color: var(--color-primary);">
                    {{ experimenter.Name }} ({{ experimenter.Initial }})
                  </div>
                  <v-chip size="x-small" variant="tonal" color="secondary" class="ml-2 font-weight-bold flex-shrink-0">{{ experimenter.Role }}</v-chip>
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
    <v-dialog v-model="dialogExperimenter" max-width="800px">
      <v-card>
        <v-card-title class="text-h6 py-4">
          Assign this study to
        </v-card-title>

        <v-card-text class="py-6">
          <v-row justify="center">
            <v-col cols="12" md="10">
              <v-select
                v-model="editedExperimenter"
                :items="labMembers"
                item-title="Name"
                item-value="id"
                return-object
                label="Experimenters"
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

    <v-row align="start" justify="end" class="mt-4">
      <v-col cols="auto">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              color="primary"
              icon="mdi-account-multiple-plus"
              size="large"
              v-bind="props"
              @click.stop="updateExperimenters"
              :disabled="!canManageExperimenters"
            ></v-btn>
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
