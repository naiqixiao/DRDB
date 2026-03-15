<template>
  <v-container fluid>
    <AlertBanner :showAdminEmail="true" />
    <ConfirmDlg ref="confirmD" />

    <v-row>
      <!-- Left Column: Study List -->
      <v-col cols="12" md="4">
        <v-card class="ds-card" variant="flat">
          <v-card-title class="d-flex align-center py-2">
            <v-text-field v-model="search" label="Search by Study Name" class="mx-4" density="compact"
              variant="underlined" hide-details></v-text-field>
            <v-spacer></v-spacer>
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <div v-bind="props">
                  <v-checkbox v-model="inProgressStudyFilter" label="In progress" hide-details
                    density="compact"></v-checkbox>
                </div>
              </template>
              <span>Show on-going studies</span>
            </v-tooltip>
          </v-card-title>

          <v-data-table v-model="selectedStudies" :headers="headersStudy" :items="filteredStudies" fixed-header height="600" hover
            :class="['elevation-1', 'study-table']" @click:row="rowSelected" item-value="id" select-strategy="single" return-object>
            <template #item.Completed="{ item }">
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <div v-bind="props" @click.stop>
                    <v-checkbox-btn :model-value="!!item.Completed" @update:model-value="changeStudyStatus(item)"
                      :disabled="!canManageStudyStatus(item)" density="compact" color="primary"></v-checkbox-btn>
                  </div>
                </template>
                <span>Mark whether this study is still on going</span>
              </v-tooltip>
            </template>
          </v-data-table>
        </v-card>

        <v-row dense justify="end" class="mt-4">
          <v-col cols="auto">
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn color="primary" icon="mdi-plus" size="large" v-bind="props" @click.stop="createStudy"
                  :disabled="!canCreateStudy"></v-btn>
              </template>
              <span>Add a new study</span>
            </v-tooltip>
          </v-col>
        </v-row>
      </v-col>

      <!-- Right Column: Study Details -->
      <v-col cols="12" md="8">
        <SectionHeader title="Study Information" icon="mdi-book-open-variant" />
        <div class="info-grid info-grid--2 mb-4">
          <InfoField label="Study Name" :value="currentStudy.StudyName" icon="mdi-clipboard-text" highlight />
          <InfoField label="Study Type" :value="currentStudy.StudyType" icon="mdi-flask" />
        </div>

        <v-row>
          <v-col md="6" class="py-1">
            <v-textarea label="Study summary" variant="outlined" no-resize rows="8"
              :model-value="currentStudy.Description" readonly hide-details></v-textarea>
          </v-col>
          <v-col md="6" class="py-1">
            <v-textarea label="Phone Script" variant="outlined" no-resize rows="8"
              :model-value="currentStudy.PhoneScript" readonly hide-details></v-textarea>
          </v-col>
        </v-row>

        <SectionHeader title="Point of Contact" icon="mdi-account-star" />
        <div class="info-grid info-grid--3">
          <InfoField label="Name" :value="currentStudy.PointofContact?.Name" icon="mdi-account" />
          <InfoField label="Email" :value="currentStudy.PointofContact?.Email" type="email" icon="mdi-email-outline" />
          <InfoField label="Phone" :value="currentStudy.PointofContact?.Phone" type="phone" icon="mdi-phone-outline" />
        </div>

        <SectionHeader title="Recruitment Criteria" icon="mdi-filter-variant" />
        <div class="mb-3">
          <div class="text-caption text-medium-emphasis mb-1">Age Groups</div>
          <div v-if="currentStudy.AgeGroups && currentStudy.AgeGroups.length > 0">
            <v-chip
              v-for="(group, i) in currentStudy.AgeGroups"
              :key="i"
              class="mr-1 mb-1"
              size="small"
              color="primary"
              variant="tonal"
            >
              {{ AgeFormated(group.MinAge) }} – {{ AgeFormated(group.MaxAge) }}
            </v-chip>
          </div>
          <span v-else class="text-body-2 text-medium-emphasis">—</span>
        </div>
        <div v-if="currentStudy.Prerequisites && currentStudy.Prerequisites.length > 0" class="mb-3">
          <div class="text-caption text-medium-emphasis mb-1">Prerequisites</div>
          <v-chip
            v-for="p in currentStudy.Prerequisites"
            :key="p.id"
            class="mr-1 mb-1"
            size="small"
            color="success"
            variant="tonal"
          >{{ p.StudyName }}</v-chip>
        </div>
        <div v-if="currentStudy.Exclusions && currentStudy.Exclusions.length > 0" class="mb-3">
          <div class="text-caption text-medium-emphasis mb-1">Exclusions</div>
          <v-chip
            v-for="e in currentStudy.Exclusions"
            :key="e.id"
            class="mr-1 mb-1"
            size="small"
            color="error"
            variant="tonal"
          >{{ e.StudyName }}</v-chip>
        </div>
        <div class="info-grid info-grid--4">
          <InfoField label="ASD" :value="currentStudy.ASDParticipant" />
          <InfoField label="Premature" :value="currentStudy.PrematureParticipant" />
          <InfoField label="Ill" :value="currentStudy.IllParticipant" />
          <InfoField label="Vision Loss" :value="currentStudy.VisionLossParticipant" />
          <InfoField label="Hearing Loss" :value="currentStudy.HearingLossParticipant" />
        </div>

        <v-row align="center" class="mt-6">
          <v-col md="12" class="pa-0 mb-2">
            <v-divider class="mb-2"></v-divider>
            <h2 class="text-left font-weight-medium" :class="{ 'text-error': !currentStudy.FK_TestingRoom }">
              {{ currentStudy.FK_TestingRoom ? 'Testing room:' : 'Testing room has not been assigned to this study.' }}
            </h2>
          </v-col>

          <v-col md="4" class="py-1">
            <v-select variant="outlined" density="compact" :items="currentTestingRooms" v-model="selectedRoomId"
              item-value="id" :item-title="(item) => `${item.name} =>> ${item.location}`"
              @update:model-value="optionChangedTestingRoom" hide-details></v-select>
          </v-col>

          <v-col md="4" class="py-1">
            <v-btn color="primary" variant="elevated" @click.stop="dialogStudyProgress = true"
              :disabled="!canViewProgress">
              Study progress
            </v-btn>

            <!-- Study Progress Dialog -->
            <v-dialog fullscreen v-model="dialogStudyProgress" transition="dialog-bottom-transition">
              <v-card class="ds-card" variant="flat">
                <v-toolbar color="primary" dark>
                  <v-btn icon @click="dialogStudyProgress = false">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                  <v-toolbar-title>Study progress</v-toolbar-title>
                </v-toolbar>

                <v-card-text class="pt-6">
                  <!-- Charts embedded here -->
                  <v-row>
                    <v-col lg="4" md="12">
                      <h2 class="text-h6 mb-4">Study progress</h2>
                      <studyProgressChart v-if="dialogStudyProgress" :stats="studyStats.totalNperStatus" />
                    </v-col>
                    <v-col lg="8" md="12" style="overflow-x: auto;">
                      <h2 class="text-h6 mb-4">Study history</h2>
                      <studyHistoryChart v-if="dialogStudyProgress" :stats="studyStats.totalNWeeklyRecrtuiment" />
                    </v-col>
                  </v-row>
                  <v-row class="mt-6">
                    <v-col lg="4" md="12" style="overflow-x: auto;">
                      <h2 class="text-h6 mb-4">Experimenter stats</h2>
                      <experimenterStatsChart v-if="dialogStudyProgress"
                        :stats="[...(studyStats.totalNperPersonnelPriExp || []), ...(studyStats.totalNperPersonnelAssistExp || [])]" />
                    </v-col>
                    <v-col lg="8" md="12" style="overflow-x: auto;">
                      <h2 class="text-h6 mb-4">Recruitment by researcher</h2>
                      <recruitmentProgressChart v-if="dialogStudyProgress"
                        :stats="studyStats.totalNperPersonnelStatus" />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-dialog>
          </v-col>
        </v-row>

        <v-divider class="my-6"></v-divider>
        <v-row>
          <v-col cols="auto">
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn color="primary" v-bind="props" @click.stop="editStudy" :disabled="!canEditStudy"
                  prepend-icon="mdi-pencil">
                  Edit study info
                </v-btn>
              </template>
              <span>Edit study information</span>
            </v-tooltip>
          </v-col>
          <v-col cols="auto">
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn color="primary" v-bind="props" @click.stop="dialogShowEmailPreviews = true"
                  :disabled="!currentStudy.id" prepend-icon="mdi-email">
                  Preview emails
                </v-btn>
              </template>
              <span>Preview emails</span>
            </v-tooltip>
          </v-col>
          <v-col cols="auto">
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn color="error" v-bind="props" @click.stop="deleteStudy" :disabled="!canEditStudy"
                  prepend-icon="mdi-delete">
                  Delete
                </v-btn>
              </template>
              <span>Delete this study</span>
            </v-tooltip>
          </v-col>
        </v-row>

        <v-row class="mt-6">
          <v-col class="pa-0">
            <v-divider class="mb-2"></v-divider>
            <h2 class="text-left font-weight-medium">Experimenters:</h2>
            <AssignedExperimenters v-if="currentStudy.id" :Experimenters="currentStudy.Experimenters"
              :labMembers="labMembers" :studyId="currentStudy.id" :PointofContactId="currentStudy.PointofContact?.id"
              @updatedExperimenters="updateExperimenters"></AssignedExperimenters>
          </v-col>
        </v-row>

        <!-- Edit/Add Study Dialog -->
        <v-dialog v-model="dialog" fullscreen transition="dialog-bottom-transition">
          <v-card class="ds-card" variant="flat">
            <v-toolbar color="primary" dark>
              <v-btn icon @click="close">
                <v-icon>mdi-close</v-icon>
              </v-btn>
              <v-toolbar-title>Study information</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="save">Save</v-btn>
            </v-toolbar>

            <v-card-text class="pt-6">
              <v-form ref="form" v-model="valid" lazy-validation>
                <!-- Basic Info -->
                <h2 class="text-h6 mb-4">Basic information:</h2>
                <v-row dense>
                  <v-col cols="12" sm="3" md="2">
                    <v-text-field v-model="editedStudy.StudyName" label="Study Name" variant="outlined"
                      density="compact" :rules="[v => !!v || 'Required']"></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="3" md="2">
                    <v-select v-model="editedStudy.StudyType"
                      :items="['Behavioural', 'EEG/ERP', 'EyeTracking', 'fNIRS', 'Online']" label="Study Type"
                      variant="outlined" density="compact"></v-select>
                  </v-col>
                  <v-col cols="12" sm="3" md="3">
                    <v-select v-model="PointofContact" :items="labMembers" item-title="Name" item-value="id"
                      return-object label="Point of Contact" variant="outlined" density="compact"></v-select>
                  </v-col>
                </v-row>

                <!-- Criteria -->
                <v-divider class="my-4"></v-divider>
                <h2 class="text-h6 mb-4">Age Groups:</h2>
                <v-row v-for="(group, index) in editedStudy.AgeGroups" :key="index" dense align="center">
                  <v-col cols="5">
                    <v-text-field v-model.number="group.MinAge" label="Min Age (months)" type="number" variant="outlined" density="compact"></v-text-field>
                  </v-col>
                  <v-col cols="5">
                    <v-text-field v-model.number="group.MaxAge" label="Max Age (months)" type="number" variant="outlined" density="compact"></v-text-field>
                  </v-col>
                  <v-col cols="2">
                    <v-btn icon="mdi-delete" color="error" variant="text" @click="editedStudy.AgeGroups.splice(index, 1)"></v-btn>
                  </v-col>
                </v-row>
                <v-btn variant="tonal" color="primary" prepend-icon="mdi-plus" @click="editedStudy.AgeGroups.push({ MinAge: null, MaxAge: null })">
                  Add Age Group
                </v-btn>

                <v-divider class="my-4"></v-divider>
                <h2 class="text-h6 mb-4">Study Requirements:</h2>
                <v-row dense>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="editedStudy.PrerequisiteIds"
                      :items="Studies.filter(s => s.id !== editedStudy.id)"
                      item-title="StudyName"
                      item-value="id"
                      label="Prerequisite Studies (Must have completed)"
                      multiple
                      chips
                      variant="outlined"
                      density="compact"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="editedStudy.ExclusionIds"
                      :items="Studies.filter(s => s.id !== editedStudy.id)"
                      item-title="StudyName"
                      item-value="id"
                      label="Excluded Studies (Must NOT have participated)"
                      multiple
                      chips
                      variant="outlined"
                      density="compact"
                    ></v-select>
                  </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>
                <h2 class="text-h6 mb-4">Participant criteria:</h2>
                <v-row dense>
                  <v-col cols="12" sm="2"><v-select v-model="editedStudy.ASDParticipant" :items="inclusionOptions"
                      label="ASD Participants" variant="outlined" density="compact"></v-select></v-col>
                  <v-col cols="12" sm="2"><v-select v-model="editedStudy.PrematureParticipant" :items="inclusionOptions"
                      label="Premature Participants" variant="outlined" density="compact"></v-select></v-col>
                  <v-col cols="12" sm="2"><v-select v-model="editedStudy.IllParticipant" :items="inclusionOptions"
                      label="Ill Participants" variant="outlined" density="compact"></v-select></v-col>
                  <v-col cols="12" sm="2"><v-select v-model="editedStudy.VisionLossParticipant"
                      :items="inclusionOptions" label="Vision Loss Participants" variant="outlined"
                      density="compact"></v-select></v-col>
                  <v-col cols="12" sm="2"><v-select v-model="editedStudy.HearingLossParticipant"
                      :items="inclusionOptions" label="Hearing Loss Participants" variant="outlined"
                      density="compact"></v-select></v-col>
                </v-row>

                <!-- Summaries -->
                <v-divider class="my-4"></v-divider>
                <h2 class="text-h6 mb-4">Study summary & Phone script:</h2>
                <v-row dense>
                  <v-col cols="12" md="6">
                    <v-textarea v-model="editedStudy.Description" label="Study summary" variant="outlined"
                      rows="6"></v-textarea>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-textarea v-model="editedStudy.PhoneScript" label="Phone Script" variant="outlined"
                      rows="6"></v-textarea>
                  </v-col>
                </v-row>

                <!-- Emails -->
                <v-divider class="my-4"></v-divider>
                <h2 class="text-h6 mb-2">Email Snippets:</h2>
                <v-tabs v-model="tab" color="primary">
                  <v-tab value="one">Study Info Template</v-tab>
                  <v-tab value="two">Reminder Template</v-tab>
                  <v-tab value="three">Follow-up Template</v-tab>
                </v-tabs>

                <v-window v-model="tab" class="mt-4">
                  <v-window-item value="one">
                    <h3 class="mb-2">Email template:</h3>
                    <ckeditor :editor="editor" v-model="editedStudy.EmailTemplate" :config="editorConfig"></ckeditor>
                  </v-window-item>
                  <v-window-item value="two">
                    <h3 class="mb-2">Reminder template:</h3>
                    <ckeditor :editor="editor" v-model="editedStudy.ReminderTemplate" :config="editorConfig"></ckeditor>
                  </v-window-item>
                  <v-window-item value="three">
                    <h3 class="mb-2">Follow up email snippet:</h3>
                    <ckeditor :editor="editor" v-model="editedStudy.FollowUPEmailSnippet" :config="editorConfig">
                    </ckeditor>
                  </v-window-item>
                </v-window>
              </v-form>
            </v-card-text>
          </v-card>
        </v-dialog>

        <!-- Email Previews Dialog -->
        <v-dialog v-model="dialogShowEmailPreviews" fullscreen transition="dialog-bottom-transition">
          <v-card class="ds-card" variant="flat">
            <v-toolbar color="primary" dark>
              <v-btn icon @click="dialogShowEmailPreviews = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
              <v-toolbar-title>Study email previews</v-toolbar-title>
            </v-toolbar>

            <v-card-text class="pt-6">
              <!-- Confirmation -->
              <h3 class="mb-2">Schedule confirmation email preview:</h3>
              <div class="template-preview pa-4 rounded border" v-html="confirmationPreview"
                style="max-height: 350px; overflow-y: auto; background-color: #f5f5f5;"></div>

              <!-- Reminder -->
              <v-divider class="my-6"></v-divider>
              <h3 class="mb-2">Reminder email preview:</h3>
              <div class="template-preview pa-4 rounded border" v-html="reminderPreview"
                style="max-height: 350px; overflow-y: auto; background-color: #f5f5f5;"></div>

              <!-- Followup -->
              <v-divider class="my-6"></v-divider>
              <h3 class="mb-2">Follow-up email preview:</h3>
              <div class="template-preview pa-4 rounded border" v-html="followupPreview"
                style="max-height: 350px; overflow-y: auto; background-color: #f5f5f5;"></div>
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import moment from "moment";
import { Ckeditor as ckeditor } from '@ckeditor/ckeditor5-vue';
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

import AssignedExperimenters from "@/components/AssignedExperimenters.vue";
import AlertBanner from "@/components/AlertBanner.vue";
import InfoField from "@/components/InfoField.vue";
import SectionHeader from "@/components/SectionHeader.vue";
import studyProgressChart from "@/components/studyProgressChart.vue";
import recruitmentProgressChart from "@/components/recruitmentProgressChart.vue";
import experimenterStatsChart from "@/components/experimenterStatsChart.vue";
import studyHistoryChart from "@/components/studyHistoryChart.vue";

import studyApi from "@/services/study";
import personnelApi from "@/services/personnel";
import testingRoomApi from "@/services/testingRoom";
import ConfirmDlg from "@/components/ConfirmDialog.vue";

export default {
  name: "Study",
  components: {
    AssignedExperimenters,
    AlertBanner,
    InfoField,
    SectionHeader,
    ckeditor,
    studyProgressChart,
    recruitmentProgressChart,
    experimenterStatsChart,
    studyHistoryChart,
    ConfirmDlg,
  },

  data() {
    return {
      search: "",
      inProgressStudyFilter: true,
      headersStudy: [
        { title: "Study Name", align: "start", key: "StudyName", sortable: true, width: "70%" },
        { title: "Completed?", align: "center", key: "Completed", sortable: false, width: "30%" }
      ],
      Studies: [],
      selectedStudies: [],
      currentStudy: {
        StudyName: null,
        Completed: false,
        PointofContact: {}
      },
      editedStudy: {},
      PointofContact: null,
      dialog: false,
      dialogShowEmailPreviews: false,
      dialogStudyProgress: false,
      valid: true,
      editedIndex: -1,
      labMembers: [],
      currentTestingRooms: [],
      selectedRoomId: null,
      tab: 'one',
      studyStats: {
        totalNperStatus: [],
        totalNWeeklyRecrtuiment: [],
        totalNperPersonnelStatus: [],
        totalNperPersonnelPriExp: [],
        totalNperPersonnelAssistExp: []
      },
      inclusionOptions: ["Include", "Exclude", "Only"],

      editor: ClassicEditor,
      editorConfig: {
        toolbar: {
          items: [
            "undo", "redo", "|",
            "heading", "|",
            "bold", "italic", "|",
            "link", "insertTable", "|",
            "bulletedList", "numberedList", "outdent", "indent",
          ],
        },
      }
    };
  },

  computed: {
    filteredStudies() {
      let result = this.Studies;
      if (this.inProgressStudyFilter) {
        result = result.filter(s => !s.Completed);
      }
      if (this.search) {
        const lowerSearch = this.search.toLowerCase();
        result = result.filter(s =>
          s.StudyName && s.StudyName.toLowerCase().includes(lowerSearch)
        );
      }
      return result;
    },

    canCreateStudy() {
      const role = this.$store.state.role;
      return ['Admin', 'PI', 'PostDoc', 'GradStudent', 'Lab manager'].includes(role);
    },

    canEditStudy() {
      if (!this.currentStudy.id || !this.currentStudy.PointofContact) return false;
      const role = this.$store.state.role;
      return (
        this.currentStudy.PointofContact.id == this.$store.state.userID ||
        ['Admin', 'PI', 'Lab manager'].includes(role)
      );
    },

    canViewProgress() {
      const role = this.$store.state.role;
      return ['Admin', 'PI', 'PostDoc', 'GradStudent', 'Lab manager'].includes(role);
    },

    // Mock preview logic (identical text manipulation as vue2)
    confirmationPreview() {
      if (!this.currentStudy.EmailTemplate) return "<p>Email template not set.</p>";
      let email = this.currentStudy.EmailTemplate.replace(/\${{childName}}/g, "Emma");
      return `<p>Dear Lisa,</p><div>${email}</div>`;
    },
    reminderPreview() {
      if (!this.currentStudy.ReminderTemplate) return "<p>Reminder template not set.</p>";
      let email = this.currentStudy.ReminderTemplate.replace(/\${{childName}}/g, "Emma");
      return `<p>Dear Lisa,</p><div>${email}</div>`;
    },
    followupPreview() {
      if (!this.currentStudy.FollowUPEmailSnippet) return "<p>Followup snippet not set.</p>";
      let email = this.currentStudy.FollowUPEmailSnippet.replace(/\${{childName}}/g, "Emma");
      return `<p>Dear Lisa,</p><div>${email}</div>`;
    }
  },

  methods: {
    canManageStudyStatus(item) {
      if (!item.PointofContact) return false;
      const role = this.$store.state.role;
      return (
        item.PointofContact.id == this.$store.state.userID ||
        ['Admin', 'PI', 'Lab manager'].includes(role)
      );
    },

    async fetchStudyProgress() {
      try {
        const Result = await studyApi.studyStats({ studyID: this.currentStudy.id });
        this.studyStats = Result.data;
      } catch (error) {
        console.error(error);
      }
    },

    async optionChangedTestingRoom() {
      if (!this.currentStudy.id) return;
      try {
        await studyApi.update({ id: this.currentStudy.id, FK_TestingRoom: this.selectedRoomId });
        this.currentStudy.FK_TestingRoom = this.selectedRoomId;
      } catch (error) {
        console.error(error);
      }
    },

    async searchStudies() {
      try {
        const Result = await studyApi.search({ FK_Lab: this.$store.state.lab, includeScheules: false });
        this.Studies = Result.data || [];

        // Check if there's a pre-selected study ID in the route on initial load
        if (this.$route.params.id) {
          const targetStudy = this.Studies.find(s => s.id == this.$route.params.id);
          if (targetStudy) {
            this.selectedStudies = [targetStudy.id];
            this.rowSelected(null, { item: targetStudy });
          }
        } else if (this.Studies.length > 0) {
          // Default selection if no route param
          this.selectedStudies = [this.Studies[0].id];
          this.rowSelected(null, { item: this.Studies[0] });
        }
      } catch (error) {
        console.error(error);
      }
    },

    async searchLabMembers() {
      try {
        const Result = await personnelApi.search({ FK_Lab: this.$store.state.lab, Active: 1 });
        this.labMembers = Result.data || [];
      } catch (error) {
        console.error(error);
      }
    },

    async changeStudyStatus(item) {
      try {
        this.editedIndex = this.Studies.findIndex(s => s.id === item.id);
        item.Completed = !item.Completed;
        await studyApi.update(item);
        Object.assign(this.Studies[this.editedIndex], item);
        this.$store.dispatch("setStudies", this.Studies);
      } catch (error) {
        if (error.response?.status === 401) {
          this.$refs.confirmD.open('Authentication Error', 'Authentication failed, please login.', { color: 'error', noconfirm: true });
          this.$router.push({ name: "Login" });
        } else {
          item.Completed = !item.Completed; // revert
        }
      }
    },

    rowSelected(event, { item }) {
      this.currentStudy = item;
      this.selectedStudies = [item.id];
      this.editedIndex = this.Studies.findIndex(s => s.id === item.id);
      this.selectedRoomId = this.currentStudy.FK_TestingRoom || null;
      
      // Update the URL without reloading to reflect the active study
      if (this.$route.params.id != item.id) {
          this.$router.replace({ name: 'Study management', params: { id: item.id } });
      }
    },

    editStudy() {
      this.editedStudy = {
        ...this.currentStudy,
        AgeGroups: (this.currentStudy.AgeGroups || []).map(g => ({ MinAge: g.MinAge, MaxAge: g.MaxAge })),
        PrerequisiteIds: (this.currentStudy.Prerequisites || []).map(p => p.id),
        ExclusionIds: (this.currentStudy.Exclusions || []).map(e => e.id),
      };
      this.PointofContact = this.currentStudy.PointofContact;
      this.dialog = true;
    },

    async createStudy() {
      try {
        const testingRooms = await testingRoomApi.search(this.$store.state.lab);
        this.$store.dispatch("setTestingRooms", testingRooms.data);
        this.currentTestingRooms = testingRooms.data;
      } catch (e) { console.error(e) }

      this.editedStudy = {
        FK_Lab: this.$store.state.lab,
        StudyType: 'Behavioural',
        Completed: false,
        AgeGroups: [],
        PrerequisiteIds: [],
        ExclusionIds: [],
      };
      this.PointofContact = null;
      this.editedIndex = -1;
      this.dialog = true;
    },

    async save() {
      if (!this.PointofContact) {
        this.$refs.confirmD.open('Validation Error', 'Please select a Point of Contact.', { color: 'warning', noconfirm: true });
        return;
      }
      this.editedStudy.FK_Personnel = this.PointofContact.id;

      if (this.editedIndex === -1) {
        // Create
        try {
          const Result = await studyApi.create(this.editedStudy);
          this.Studies.push(Result.data);
          this.$store.dispatch("setStudies", this.Studies);
          this.currentStudy = Result.data;
          this.close();
        } catch (error) { console.error(error); }
      } else {
        // Update
        try {
          const Result = await studyApi.update(this.editedStudy);
          Object.assign(this.Studies[this.editedIndex], Result.data);
          this.$store.dispatch("setStudies", this.Studies);
          this.currentStudy = { ...Result.data };
          this.close();
        } catch (error) { console.error(error); }
      }
    },

    close() {
      this.dialog = false;
    },

    async deleteStudy() {
      if (!(await this.$refs.confirmD.open('Confirm Delete', 'Are you sure you want to delete this study? The deletion will also remove all related study appointments.'))) {
        return;
      }
      try {
        await studyApi.delete({ id: this.currentStudy.id });
        this.Studies = this.Studies.filter(s => s.id !== this.currentStudy.id);
        this.$store.dispatch("setStudies", this.Studies);
        this.currentStudy = { StudyName: null, PointofContact: {} };
      } catch (error) {
        console.error(error);
      }
    },

    updateExperimenters(updatedExperimenters) {
      this.currentStudy.Experimenters = updatedExperimenters;
      if (this.editedIndex !== -1) {
        Object.assign(this.Studies[this.editedIndex], this.currentStudy);
      }
    },

    AgeFormated(Age) {
      if (!Age || Age <= 0) return "Not applicable";
      const years = Math.floor(Age / 12);
      const months = Age % 12;
      return `${years > 0 ? years + 'y ' : ''}${months}m`.trim();
    },

    PhoneFormated(Phone) {
      if (Phone) {
        var cleaned = ("" + Phone).replace(/\D/g, "");
        var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) return "(" + match[1] + ") " + match[2] + "-" + match[3];
      }
      return Phone || "";
    },
  },

  watch: {
    dialogStudyProgress(val) {
      if (val) {
        this.fetchStudyProgress();
      } else {
        this.studyStats = {
          totalNperStatus: [],
          totalNWeeklyRecrtuiment: [],
          totalNperPersonnelStatus: [],
          totalNperPersonnelPriExp: [],
          totalNperPersonnelAssistExp: []
        };
      }
    },
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        if (newId && this.Studies.length > 0) {
          const targetStudy = this.Studies.find(s => s.id == newId);
          if (targetStudy) {
            this.selectedStudies = [targetStudy.id];
            this.rowSelected(null, { item: targetStudy });
          }
        }
      }
    }
  },

  mounted() {
    this.searchLabMembers();
    this.currentTestingRooms = this.$store.state.testingRooms || [];
    this.searchStudies();
  },
};
</script>

<style scoped>
.study-table :deep(tr.v-data-table__selected) {
  background-color: rgb(var(--v-theme-secondary), 0.1) !important;
}

.ck-editor__editable_inline {
  min-height: 300px !important;
}
</style>
