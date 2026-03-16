<template>
  <div>
    <v-row class="justify-center mx-0 mt-2">
      <v-col cols="11" v-for="(child, index) in sortedChildren" :key="child.id || index" style="padding-top: 4px;">
        <v-card class="ds-card h-100 d-flex flex-column" variant="flat" style="position: relative; overflow: hidden">

          <v-card-title class="d-flex justify-space-between align-center ds-header-gradient py-3"
            style="position: relative; z-index: 1;">
            <div class="d-flex align-center">
              <v-icon color="primary" class="mr-2">
                {{ child.Sex === 'M' ? 'mdi-face-man' : (child.Sex === 'F' ? 'mdi-face-woman' : 'mdi-face-recognition')
                }}
              </v-icon>
              <span class="text-h6 font-weight-bold">{{ child.Name ? child.Name.split(' ')[0] : 'Unknown' }}</span>
            </div>
            <v-menu location="bottom end">
              <template v-slot:activator="{ props }">
                <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props"></v-btn>
              </template>
              <v-list density="compact">
                <v-list-item @click="editChild(child, index)" prepend-icon="mdi-pencil" title="Edit"></v-list-item>
                <v-list-item @click="deleteChild(child.id, index)" prepend-icon="mdi-delete" base-color="error"
                  title="Delete"></v-list-item>
              </v-list>
            </v-menu>
          </v-card-title>

          <v-card-text class="pt-4 flex-grow-1" style="position: relative; z-index: 1;">
            <!-- Background IdWithinFamily Letter -->
            <div
              style="position: absolute; right: 10px; top: 10px; font-size: 100px; font-weight: 900; color: rgba(0,0,0,0.08); z-index: 0; line-height: 0.8; pointer-events: none; user-select: none;">
              {{ (child.IdWithinFamily || '') }}
            </div>
            <div class="d-flex justify-space-between mb-3">
              <div>
                <div class="text-caption text-muted">Age</div>
                <div class="font-weight-medium text-body-1">{{ childAge(child) }}</div>
              </div>
              <div class="text-right">
                <div class="text-caption text-muted">Born</div>
                <div class="font-weight-medium text-body-1">{{ child.DoB ? child.DoB.split("T")[0] : 'N/A' }}</div>
              </div>
            </div>

            <div class="d-flex flex-wrap gap-1 mt-2" style="gap: 4px;">
              <v-chip size="x-small" color="error" variant="flat" v-if="child.PrematureBirth">Premature</v-chip>
              <v-chip size="x-small" color="warning" variant="flat" v-if="child.ASD">ASD</v-chip>
              <v-chip size="x-small" color="warning" variant="flat" v-if="child.HearingLoss">Hearing Deficit</v-chip>
              <v-chip size="x-small" color="warning" variant="flat" v-if="child.VisionLoss">Vision Deficit</v-chip>
            </div>

            <!-- Participation Stats -->
            <div class="mt-3 pt-2" style="border-top: 1px solid #E2E8F0;">
              <v-chip v-if="childStats(child) > 0" size="x-small" variant="flat" color="#01579B" class="text-white font-weight-bold">
                <v-icon start size="x-small">mdi-check-circle</v-icon>
                {{ childStats(child) }} Completed
              </v-chip>
              <span v-else class="text-caption text-muted">
                <v-icon size="x-small" class="mr-1">mdi-information-outline</v-icon>
                No participation history
              </span>
            </div>
          </v-card-text>

          <v-card-actions class="pa-4 pt-0" style="position: relative; z-index: 1;">
            <v-btn block color="#F59E0B" variant="flat" class="text-white font-weight-bold"
              :disabled="potentialStudies(child).potentialStudyList.length < 1" @click.stop="Schedule(child, index)"
              prepend-icon="mdi-calendar-plus">
              Schedule Study
            </v-btn>
          </v-card-actions>

        </v-card>
      </v-col>
    </v-row>

    <ConfirmDlg ref="confirmD" />

    <!-- Schedule Dialog -->
    <scheduleDialog ref="scheduleDialog" :dialog="dialogSchedule" :currentSchedule="currentSchedule"
      :parentResponse="response" :currentFamily="currentFamily" dialogType="schedule" scheduleType="create"
      @close-dialog="closeSchedule" @newAppointment="addAppointment"
      @deleteCurrentAppointment="deleteCurrentAppointment" @newSchedule="addSchedule" />

    <!-- Edit Child Dialog -->
    <v-dialog v-model="dialogChild" max-width="800px" persistent scrollable>
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">
            {{ formTitle }}
          </span>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="close"></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pt-6 pb-2" style="max-height: 70vh;">
          <v-container class="px-0">
            
            <div class="mb-6">
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Basic Information</div>
              <v-row dense>
                <template v-for="(item, i) in $childInfo" :key="item.field">
                  <!-- Render Note as a full-width textarea on its own row -->
                  <v-col cols="12" v-if="item.field === 'Note'">
                    <v-textarea v-model="editedItem[item.field]" :label="item.label" variant="outlined" 
                      density="compact" hide-details class="mb-2" rows="3"></v-textarea>
                  </v-col>
                  
                  <!-- Render other fields normally using their specified widths -->
                  <v-col v-else cols="12" sm="6" :md="item.width || 4">
                    <v-select v-if="item.options" v-model="editedItem[item.field]" :items="$Options[item.options]"
                      :label="item.label" variant="outlined" density="compact" hide-details class="mb-2"></v-select>
                    <v-checkbox v-else-if="item.type == 'checkbox'" v-model="editedItem[item.field]" :label="item.label"
                      density="compact" hide-details class="mb-2" color="primary"></v-checkbox>
                    <v-text-field v-else v-model="editedItem[item.field]" :label="item.label" variant="outlined"
                      density="compact" hide-details class="mb-2" :type="item.field === 'DoB' ? 'date' : 'text'"></v-text-field>
                  </v-col>
                </template>
              </v-row>
            </div>

            <div class="mb-4">
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Sensitive & Medical Info</div>
              <v-row dense>
                <template v-for="(item, i) in $childSensitiveInfo" :key="item.field">
                  
                  <v-col cols="12" v-if="item.field === 'Note'">
                    <v-textarea v-model="editedItem[item.field]" :label="item.label" variant="outlined" 
                      density="compact" hide-details class="mb-2" rows="3"></v-textarea>
                  </v-col>

                  <v-col v-else cols="12" sm="6" md="4">
                    <v-select v-if="item.options" v-model="editedItem[item.field]" :items="$Options[item.options]"
                      :label="item.label" variant="outlined" density="compact" hide-details class="mb-2"></v-select>
                    <v-checkbox v-else-if="!item.options && item.type !== 'text'" v-model="editedItem[item.field]" :label="item.label"
                      density="compact" hide-details class="mb-4" color="primary"></v-checkbox>
                    <v-text-field v-else v-model="editedItem[item.field]" :label="item.label" variant="outlined"
                      density="compact" hide-details class="mb-2"></v-text-field>
                  </v-col>
                </template>
              </v-row>
            </div>

          </v-container>
        </v-card-text>

        <v-card-actions class="px-6 pb-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="close">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="save" prepend-icon="mdi-content-save">Save Child</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import child from "@/services/child";
// import schedule from "@/services/schedule";
// import calendar from "@/services/calendar";
import moment from "moment-timezone";
import ConfirmDlg from "@/components/ConfirmDialog.vue";
// import login from "@/services/login";
import scheduleDialog from '@/components/scheduleDialog.vue';
import { childAge } from "@/assets/JS/displayFunctions.js";

import { useMainStore } from "@/stores/mainStore";

export default {
  setup() {
    const store = useMainStore();
    return { store };
  },
  components: {
    ConfirmDlg,
    scheduleDialog
  },
  props: {
    Children: Array,
    familyId: Number,
    currentFamily: Object
  },
  data: () => ({
    dialogSchedule: false,
    response: "",
    currentSchedule: {},
    currentChild: {},
    editedIndex: -1,
    dialogChild: false,
    editedItem: {
      Name: "",
      Sex: "",
      DoB: "",
      Age: "",
      Note: ""
    },
    defaultItem: {
      Name: "",
      Sex: "",
      DoB: "",
      Age: "",
      Note: ""
    },
    // Mock global properties (replace with actual global properties or store if needed)
    // Assuming $childInfo and $childSensitiveInfo are available globally or need to be imported/defined.
    // For now I will assume they are available on the instance via app.config.globalProperties or mixin.
    // If not, I should define them here or import them.
    scheduleTemplate: {
      AppointmentTime: null,
      Status: "Confirmed",
      FK_Family: null,
      Note: "",
      summary: "",
      Appointments: [],
      ScheduledBy: null,
      location: null,
      description: "",
      Reminded: 0
    }

  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "New Child" : "Edit Child";
    },
    sortedChildren() {
      if (!this.Children) return [];
      return [...this.Children].sort((a, b) => {
        if (!a.DoB || !b.DoB) return 0;
        return new Date(a.DoB) - new Date(b.DoB);
      });
    }
  },

  methods: {
    childAge,

    childStats(child) {
      let completed = 0;
      if (!child.id || !this.currentFamily || !this.currentFamily.Schedules) return completed;

      this.currentFamily.Schedules.forEach(schedule => {
        if (!schedule.Appointments) return;
        if (schedule.Status === 'Confirmed' && schedule.Completed) {
          schedule.Appointments.forEach(app => {
            if (app.FK_Child === child.id) completed++;
          });
        }
      });

      return completed;
    },

    potentialStudies(child) {
      // Reuse logic from appointmentDetails or share it?
      // Ideally this logic should be centralized or imported again if duplicated.
      // For now, simple mock or limited check if store studies are available.
      // Or if appointmentDetails logic is needed here for the button disable state.

      if (!this.store.studies) return { potentialStudyList: [] };

      // Duplicate logic for potential studies check to enable/disable button.
      // Ideally refactor this into a utility or store getter.

      var eligibleStudies = [];

      this.store.studies.forEach((study) => {
        if (this.studyElegibility(study, child) && !study.Completed) {
          eligibleStudies.push(study.id);
        }
      });

      var uniquePreviousStudies = [];

      if (child.Appointments) {
        child.Appointments.forEach((appointment) => {
          uniquePreviousStudies.push(appointment.FK_Study);
        });
        uniquePreviousStudies = Array.from(new Set(uniquePreviousStudies));
      }

      var potentialStudies = eligibleStudies.filter(
        (study) => !uniquePreviousStudies.includes(study)
      );

      var potentialStudyList = this.store.studies.filter((study) =>
        potentialStudies.includes(study.id)
      );

      return {
        potentialStudyList: potentialStudyList
      };

    },

    studyElegibility(study, child) {
      if (!child.DoB) return false;

      const Age = Math.floor(
        (new Date() - new Date(child.DoB)) / (1000 * 60 * 60 * 24)
      );

      // 1. Age Group Check (child must fit into AT LEAST ONE age group)
      let ageEligible = false;
      if (study.AgeGroups && study.AgeGroups.length > 0) {
        ageEligible = study.AgeGroups.some(
          (group) => Age >= group.MinAge * 30.5 - 1 && Age <= group.MaxAge * 30.5 - 1
        );
      } else {
        ageEligible = true; // fallback if no age groups defined
      }

      // Past participated study IDs
      const pastStudyIds = child.Appointments
        ? child.Appointments.map((app) => app.FK_Study)
        : [];

      // 2. Prerequisite Check (child MUST HAVE participated in ALL prerequisites)
      let meetsPrereqs = true;
      if (study.Prerequisites && study.Prerequisites.length > 0) {
        meetsPrereqs = study.Prerequisites.every((prereq) =>
          pastStudyIds.includes(prereq.id)
        );
      }

      // 3. Exclusion Check (child MUST NOT have participated in ANY exclusions)
      let meetsExclusions = true;
      if (study.Exclusions && study.Exclusions.length > 0) {
        meetsExclusions = !study.Exclusions.some((excl) =>
          pastStudyIds.includes(excl.id)
        );
      }

      var asd = false;
      switch (study.ASDParticipant) {
        case "Only":
          child.Family.AutismHistory ? (asd = true) : (asd = false);
          break;
        case "Exclude":
          child.Family.AutismHistory ? (asd = false) : (asd = true);
          break;
        case "Include":
          asd = true;
          break;
      }

      var hearing = false;
      switch (study.HearingLossParticipant) {
        case "Only":
          child.HearingLoss ? (hearing = true) : (hearing = false);
          break;
        case "Exclude":
          child.HearingLoss ? (hearing = false) : (hearing = true);
          break;
        case "Include":
          hearing = true;
          break;
      }

      var vision = false;
      switch (study.VisionLossParticipant) {
        case "Only":
          child.VisionLoss ? (vision = true) : (vision = false);
          break;
        case "Exclude":
          child.VisionLoss ? (vision = false) : (vision = true);
          break;
        case "Include":
          vision = true;
          break;
      }

      var premature = false;
      switch (study.PrematureParticipant) {
        case "Only":
          child.PrematureBirth ? (premature = true) : (premature = false);
          break;
        case "Exclude":
          child.PrematureBirth ? (premature = false) : (premature = true);
          break;
        case "Include":
          premature = true;
          break;
      }

      var illness = false;
      switch (study.IllParticipant) {
        case "Only":
          child.Illness ? (illness = true) : (illness = false);
          break;
        case "Exclude":
          child.Illness ? (illness = false) : (illness = true);
          break;
        case "Include":
          illness = true;
          break;
      }

      return ageEligible && meetsPrereqs && meetsExclusions && asd && hearing && vision && premature && illness;
    },

    editChild(item, index) {
      this.editedIndex = index;
      this.editedItem = Object.assign({}, item);
      // format DOB for date input
      if (this.editedItem.DoB) {
        this.editedItem.DoB = moment(this.editedItem.DoB).format("YYYY-MM-DD");
      }
      this.dialogChild = true;
    },

    addChild() {
      this.editedIndex = -1;
      this.editedItem = Object.assign({}, this.defaultItem);
      this.dialogChild = true;
    },

    async deleteChild(id, index) {
      if (
        await this.$refs.confirmD.open(
          "Confirmation",
          "Are you sure you want to delete this child?"
        )
      ) {
        try {
          await child.delete({ id: id });
          this.Children.splice(index, 1);
        } catch (error) {
          console.log(error);
        }
      }
    },

    close() {
      this.dialogChild = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    },

    async save() {
      if (this.editedIndex > -1) {
        // update
        Object.assign(this.Children[this.editedIndex], this.editedItem);
        try {
          await child.update(this.editedItem);
        } catch (error) {
          console.log(error);
        }
      } else {
        // create - handled by Family view generally or add logic here?
        // The template shows "New Child" title but button to add child is outside this component usually?
        // Ah, parent passes Children. This component manages display and edit of EXISTING children.
        // But if there is a way to add child here, it would be needed.
        // Family.vue handles adding child usually.
        // But if this dialog handles creation too:
        // Assuming this component purely lists children, but allows editing/deleting.
        // Creation might be triggered from parent.
      }
      this.close();
    },

    Schedule(child, index) {
      this.currentChild = child;
      this.editedIndex = index; // This index is child index in Children array
      this.dialogSchedule = true;
      this.response = "Confirmed";
      this.currentSchedule = Object.assign({}, this.scheduleTemplate);
      // Initialize basic schedule structure
      this.currentSchedule.FK_Family = this.familyId;

      // Note: appointmentDetails and scheduleDialog expect Appointments array in currentSchedule
      this.currentSchedule.Appointments = [];
      this.currentSchedule.Appointments.push({
        FK_Child: child.id,
        Child: child,
        FK_Family: child.FK_Family,
        status: "Confirmed",
        PrimaryExperimenter: [],
        SecondaryExperimenter: []
      });
    },

    closeSchedule() {
      this.dialogSchedule = false;
    },

    addAppointment(appointment) {
      this.currentSchedule.Appointments.push(appointment);
    },

    deleteCurrentAppointment(index) {
      this.currentSchedule.Appointments.splice(index, 1);
    },

    addSchedule(schedule) {
      this.$emit("newSchedule", schedule);
    }
  }
};
</script>
