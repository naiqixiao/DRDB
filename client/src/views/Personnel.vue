<template>
  <v-container fluid style="max-width: 1440px;">
    <AlertBanner :showAdminEmail="true" />
    <ConfirmDialog ref="confirmDialog"></ConfirmDialog>

    <v-row>
      <v-col cols="12" md="4" lg="3" class="d-flex flex-column" style="height: calc(100vh - 120px);">
        <v-card class="ds-card d-flex flex-column h-100" variant="flat">

          <div class="pa-4 pb-2 bg-slate-50 border-b border-slate-200">
            <div class="d-flex justify-space-between align-center mb-3">
              <span class="text-subtitle-1 font-weight-bold"
                style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">
                Team Directory
              </span>
              <v-btn color="primary" size="small" variant="flat" @click="createPersonnel" :disabled="!canAddPersonnel"
                prepend-icon="mdi-account-plus">
                Add Member
              </v-btn>
            </div>

            <v-text-field v-model="search" placeholder="Search directory..." density="compact" variant="outlined"
              hide-details prepend-inner-icon="mdi-magnify" bg-color="white" class="mb-3 transition-colors duration-200"
              color="primary"></v-text-field>

            <v-switch v-model="activeMemberFilter" label="Show Active Only" color="primary" hide-details
              density="compact" class="mt-n2"></v-switch>
          </div>

          <v-list class="flex-grow-1" style="overflow-y: auto; background: transparent;" lines="two">
            <v-list-item v-for="person in filteredPersonnels" :key="person.id" :value="person.id"
              :active="currentPersonnel.id === person.id" @click="rowSelected(person)"
              class="py-3 ds-interactive border-b border-slate-100 transition-all duration-200" color="primary">
              <template v-slot:prepend>
                <v-badge :color="person.Active ? 'success' : 'grey-lighten-1'" dot location="bottom right" offset-x="3"
                  offset-y="3">
                  <v-avatar :color="getRoleColor(person.Role)" variant="tonal" class="font-weight-bold">
                    {{ person.Initial || person.Name.charAt(0) }}
                  </v-avatar>
                </v-badge>
              </template>

              <v-list-item-title class="font-weight-bold text-body-1" style="color: var(--color-text)">
                {{ person.Name }}
              </v-list-item-title>

              <v-list-item-subtitle class="mt-1 d-flex align-center">
                <v-chip size="x-small" :color="getRoleColor(person.Role)" variant="flat"
                  class="text-white font-weight-bold px-2 mr-2 transition-all duration-200">
                  {{ person.Role }}
                </v-chip>
                <span class="text-truncate" style="max-width: 120px; transition: color 0.2s;">{{ person.Email }}</span>
              </v-list-item-subtitle>
            </v-list-item>

            <div v-if="filteredPersonnels.length === 0" class="text-center pa-6 text-muted">
              <v-icon size="48" color="grey-lighten-2" class="mb-2">mdi-account-search-outline</v-icon>
              <div>No team members found</div>
            </div>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="8" lg="9">
        <div v-if="currentPersonnel.id">

          <v-card class="ds-card mb-6" variant="flat">
            <v-toolbar color="transparent" class="px-4 border-b border-slate-200">
              <v-spacer></v-spacer>
              <v-btn :color="currentPersonnel.Active ? 'warning' : 'success'" variant="outlined"
                :prepend-icon="currentPersonnel.Active ? 'mdi-account-off' : 'mdi-account-check'"
                class="mr-3 text-none font-weight-bold" @click.stop="changePersonnelStatus(currentPersonnel)"
                :disabled="!canManageStatus(currentPersonnel)">
                {{ currentPersonnel.Active ? 'Deactivate Account' : 'Activate Account' }}
              </v-btn>
              <v-btn color="error" variant="outlined" prepend-icon="mdi-archive-outline"
                class="mr-3 text-none font-weight-bold" @click.stop="deletePersonnel" :disabled="!canDeletePersonnel">
                Retire
              </v-btn>
              <v-btn color="primary" variant="flat" prepend-icon="mdi-pencil" class="text-none font-weight-bold"
                @click.stop="editPersonnel" :disabled="!canEditPersonnel">
                Edit Profile
              </v-btn>
            </v-toolbar>

            <v-card-text class="pa-6">
              <v-row>
                <v-col cols="12" sm="auto" class="text-center pr-sm-6">
                  <v-avatar :color="getRoleColor(currentPersonnel.Role)" size="96"
                    class="text-white font-weight-bold text-h3 mb-2 elevation-2">
                    {{ currentPersonnel.Initial || currentPersonnel.Name.charAt(0) }}
                  </v-avatar>
                  <div>
                    <v-chip :color="currentPersonnel.Active ? 'success' : 'grey'" size="small" variant="tonal"
                      class="font-weight-bold mt-1">
                      <v-icon start size="14">{{ currentPersonnel.Active ? 'mdi-check-circle' : 'mdi-minus-circle'
                        }}</v-icon>
                      {{ currentPersonnel.Active ? 'Active' : 'Inactive' }}
                    </v-chip>
                  </div>
                </v-col>

                <v-col cols="12" sm="8">
                  <h1 class="text-h4 font-weight-bold mb-1"
                    style="color: var(--color-primary); font-family: var(--ds-font-family-heading);">
                    {{ currentPersonnel.Name }}
                  </h1>
                  <div class="text-subtitle-1 text-muted font-weight-medium mb-4">
                    {{ currentPersonnel.Role }}
                  </div>

                  <v-list density="compact" class="pa-0 bg-transparent">
                    <v-list-item prepend-icon="mdi-email-outline" class="px-0 mb-1" density="compact">
                      <v-list-item-title class="d-flex align-center font-weight-medium">
                        {{ currentPersonnel.Email }}
                        <v-btn icon="mdi-content-copy" variant="text" size="x-small" color="grey"
                          class="ml-2 transition-transform duration-200 hover-scale"
                          @click="copyToClipboard(currentPersonnel.Email)"></v-btn>
                      </v-list-item-title>
                    </v-list-item>

                    <v-list-item prepend-icon="mdi-phone-outline" class="px-0 mb-1" density="compact">
                      <v-list-item-title class="d-flex align-center font-weight-medium text-muted">
                        {{ PhoneFormated(currentPersonnel.Phone) || 'No phone provided' }}
                      </v-list-item-title>
                    </v-list-item>

                    <v-list-item prepend-icon="mdi-calendar-blank-outline" class="px-0 mb-1" density="compact">
                      <v-list-item-title class="d-flex align-center text-muted">
                        <span class="mr-2">Calendar ID:</span> {{ currentPersonnel.Calendar || 'Not linked' }}
                      </v-list-item-title>
                    </v-list-item>

                    <v-list-item prepend-icon="mdi-account-clock-outline" class="px-0 mb-1" density="compact">
                      <v-list-item-title class="d-flex align-center text-muted">
                        <span class="mr-2">Joined lab:</span> {{ formatHistoryDate(personnelJoinedDate) || 'Not recorded' }}
                      </v-list-item-title>
                    </v-list-item>

                    <v-list-item prepend-icon="mdi-video-outline" class="px-0" density="compact"
                      v-if="currentPersonnel.ZoomLink">
                      <v-list-item-title class="d-flex align-center font-weight-medium">
                        <a :href="currentPersonnel.ZoomLink" target="_blank"
                          class="text-decoration-none text-primary transition-opacity duration-200 hover:opacity-80">Personal
                          Zoom Room ↗</a>
                        <v-btn icon="mdi-content-copy" variant="text" size="x-small" color="grey"
                          class="ml-2 transition-transform duration-200 hover-scale"
                          @click="copyToClipboard(currentPersonnel.ZoomLink)"></v-btn>
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>

                  <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-timeline-text-outline"
                    class="mt-3" @click="openHistoryViewer">
                    View History &amp; Achievements
                  </v-btn>

                  <div v-if="currentPersonnel.StudyinCharge && currentPersonnel.StudyinCharge.length > 0"
                    class="mt-4 mb-2">
                    <div class="text-caption font-weight-bold text-uppercase text-muted mb-2">Project Leadership</div>
                    <div class="d-flex flex-wrap gap-2" style="gap: 8px;">
                      <v-chip v-for="study in currentPersonnel.StudyinCharge" :key="study.id" size="small"
                        variant="tonal" color="success" prepend-icon="mdi-star-circle-outline">
                        {{ study.StudyName }} (PoC)
                      </v-chip>
                    </div>
                  </div>

                  <div v-if="canViewStats" class="mt-6">
                    <div class="text-caption font-weight-bold text-uppercase text-muted mb-2">All-Time Performance</div>
                    <v-row dense>
                      <v-col cols="4">
                        <v-card
                          class="ds-card pa-3 text-center transition-all duration-200 border-slate-200 hover:border-primary cursor-pointer hover:-translate-y-1 hover:shadow-sm"
                          variant="outlined">
                          <div class="text-h5 font-weight-bold text-primary">{{ personnelStats.e1Count || 0 }}</div>
                          <div class="text-caption text-muted font-weight-bold text-uppercase"
                            style="font-size: 0.65rem !important;">Sessions (E1)</div>
                        </v-card>
                      </v-col>
                      <v-col cols="4">
                        <v-card
                          class="ds-card pa-3 text-center transition-all duration-200 border-slate-200 hover:border-primary cursor-pointer hover:-translate-y-1 hover:shadow-sm"
                          variant="outlined">
                          <div class="text-h5 font-weight-bold text-primary">{{ personnelStats.e2Count || 0 }}</div>
                          <div class="text-caption text-muted font-weight-bold text-uppercase"
                            style="font-size: 0.65rem !important;">Sessions (E2)</div>
                        </v-card>
                      </v-col>
                      <v-col cols="4">
                        <v-card
                          class="ds-card pa-3 text-center transition-all duration-200 border-slate-200 hover:border-success cursor-pointer hover:-translate-y-1 hover:shadow-sm"
                          variant="outlined">
                          <div class="text-h5 font-weight-bold text-success">{{ personnelStats.scheduledCount || 0 }}
                          </div>
                          <div class="text-caption text-muted font-weight-bold text-uppercase"
                            style="font-size: 0.65rem !important;">Recruited</div>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>

                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card class="ds-card" variant="flat">
            <v-toolbar color="transparent" density="compact" class="px-4 pt-2">
              <v-icon class="mr-2" color="primary">mdi-book-multiple-outline</v-icon>
              <span class="text-subtitle-1 font-weight-bold"
                style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">
                Assigned Studies
              </span>
              <v-chip class="ml-3" size="small" variant="tonal" color="primary">
                {{ currentPersonnel.AssignedStudies?.length || 0 }} Active
              </v-chip>
              <v-spacer></v-spacer>
              <v-btn variant="text" color="primary" size="small" prepend-icon="mdi-history" @click="openPastStudies">
                View past studies
              </v-btn>
            </v-toolbar>
            <v-divider class="mt-2"></v-divider>

            <v-card-text class="pa-6 bg-white" style="min-height: 200px;">
              <AssignedStudies v-if="currentPersonnel.id" :Studies="currentPersonnel.AssignedStudies || []"
                :labStudies="labStudies" :personnelId="currentPersonnel.id" :personnelName="currentPersonnel.Name"
                @updatedStudies="updatedStudies" />
            </v-card-text>
          </v-card>

        </div>

        <div v-else class="h-100 d-flex flex-column align-center justify-center text-center pa-6">
          <v-avatar color="grey-lighten-3" size="120" class="mb-4">
            <v-icon size="64" color="grey-lighten-1">mdi-badge-account-outline</v-icon>
          </v-avatar>
          <h2 class="text-h5 font-weight-bold text-muted mb-2">Member Profile</h2>
          <p class="text-body-1 text-muted" style="max-width: 400px;">Select a team member from the directory on the
            left to
            view their contact information, edit their profile, and manage their assigned studies.</p>
        </div>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="700px" persistent>
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">
            {{ editedIndex === -1 ? 'Add New Team Member' : 'Edit Member Profile' }}
          </span>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="close"></v-btn>
        </v-card-title>

        <v-card-text class="pt-6">
          <v-form ref="dialogForm" v-model="validDialog" lazy-validation>

            <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Identity & Role</div>
            <v-row dense class="mb-4">
              <v-col cols="12" md="6">
                <v-text-field v-model="editedPersonnel.Name" label="Full Name *" :rules="getRules('name')"
                  variant="outlined" density="compact" bg-color="white" color="primary"></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="editedPersonnel.Initial" label="Initials *" :rules="getRules('required')"
                  variant="outlined" density="compact" bg-color="white" color="primary"></v-text-field>
              </v-col>
              <v-col v-if="editedIndex === -1" cols="12" md="3">
                <v-select v-model="editedPersonnel.Role" :items="availableRoles" label="Role *"
                  :rules="[v => !!v || 'Required']" variant="outlined" density="compact" bg-color="white"
                  color="primary"></v-select>
              </v-col>
              <v-col v-else cols="12" md="3">
                <v-text-field :model-value="editedPersonnel.Role" label="Current role" readonly variant="outlined"
                  density="compact" bg-color="grey-lighten-4" hint="Update roles from History & Achievements"
                  persistent-hint></v-text-field>
              </v-col>
            </v-row>

            <v-divider class="mb-4"></v-divider>
            <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Contact & Integrations</div>

            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedPersonnel.Email" label="Email Address *" :rules="getRules('email')"
                  prepend-inner-icon="mdi-email-outline" variant="outlined" density="compact" bg-color="white"
                  color="primary"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedPersonnel.Phone" label="Phone Number" :rules="getRules('phone')"
                  prepend-inner-icon="mdi-phone-outline" variant="outlined" density="compact" bg-color="white"
                  color="primary"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedPersonnel.Calendar" label="Google Calendar ID *"
                  prepend-inner-icon="mdi-calendar-blank-outline" placeholder="username@mcmaster.ca"
                  :rules="getRules('email')" variant="outlined" density="compact" bg-color="white"
                  color="primary"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedPersonnel.ZoomLink" label="Personal Zoom Link"
                  prepend-inner-icon="mdi-video-outline" placeholder="https://zoom.us/j/..." variant="outlined"
                  density="compact" bg-color="white" color="primary"></v-text-field>
              </v-col>
            </v-row>

          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6 pt-0 d-flex justify-space-between">
          <span class="text-caption text-muted">* Required fields</span>
          <div>
            <v-btn color="error" variant="text" @click="close" class="mr-2">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="save" :disabled="!validDialog"
              prepend-icon="mdi-content-save">Save Profile</v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="historyViewerDialog" max-width="900px" scrollable>
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex align-center py-4 ds-header-gradient">
          <v-icon class="mr-2">mdi-timeline-text-outline</v-icon>
          <span class="text-h6 font-weight-bold">{{ historyViewerTitle }}</span>
          <v-spacer></v-spacer>
          <v-btn v-if="historyFilter === 'projects'" color="primary" size="small" variant="text" prepend-icon="mdi-timeline-text-outline" class="mr-2" @click="showFullHistory">
            All history
          </v-btn>
          <v-btn v-if="canManageHistory" color="primary" size="small" variant="flat" prepend-icon="mdi-plus" class="mr-3" @click="openHistoryDialog()">
            Add Entry
          </v-btn>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="historyViewerDialog = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-6 bg-white" style="max-height: 70vh;">
          <v-timeline v-if="visibleHistoryEntries.length" class="history-timeline" density="compact" align="start" side="end" truncate-line="both">
            <v-timeline-item v-for="entry in visibleHistoryEntries" :key="entry.id" :dot-color="historyColor(entry)" size="small">
              <template v-slot:opposite>
                <span class="font-weight-bold text-caption" :style="{ color: historyColor(entry) }">{{ formatHistoryMonth(entry.EffectiveDate) }}</span>
              </template>
              <v-card variant="flat" class="history-card w-100 mb-4" :class="{ 'history-card--current': isCurrentRoleEntry(entry) }" :style="{ '--history-accent': historyColor(entry) }">
                <div class="history-card__accent"></div>
                <div class="pa-4">
                  <div class="d-flex align-start justify-space-between mb-3">
                    <div class="d-flex align-center" style="gap: 10px;">
                      <div class="history-date-badge">{{ formatHistoryMonth(entry.EffectiveDate) }}</div>
                      <v-icon :color="historyColor(entry)" size="20">{{ historyIcon(entry.EventType) }}</v-icon>
                    </div>
                    <div v-if="canManageHistory" class="d-flex">
                      <v-btn icon="mdi-pencil" variant="text" size="x-small" @click="openHistoryDialog(entry)"></v-btn>
                      <v-btn icon="mdi-delete-outline" color="error" variant="text" size="x-small" @click="removeHistoryEntry(entry)"></v-btn>
                    </div>
                  </div>
                  <div class="flex-grow-1">
                    <div class="d-flex flex-wrap align-center" style="gap: 6px;">
                      <span class="font-weight-bold text-body-1">{{ historyTitle(entry) }}</span>
                      <v-chip v-if="isCurrentRoleEntry(entry)" size="x-small" color="deep-purple" variant="flat" class="text-white">Current role</v-chip>
                      <v-chip v-if="entry.Category" size="x-small" variant="tonal" color="primary">{{ entry.Category }}</v-chip>
                      <v-chip v-if="entry.Imported" size="x-small" variant="outlined" color="grey">Imported</v-chip>
                    </div>
                    <div v-if="entry.Detail" class="text-body-2 text-muted mt-2" style="white-space: pre-wrap;">{{ entry.Detail }}</div>
                  </div>
                </div>
              </v-card>
            </v-timeline-item>
          </v-timeline>
          <div v-else class="text-center pa-10 text-muted">
            <v-icon size="42" color="grey-lighten-2" class="mb-2">mdi-timeline-outline</v-icon>
            <div>{{ historyFilter === 'projects' ? 'No past study involvement has been recorded yet.' : 'No history has been recorded yet.' }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="historyDialog" max-width="620px" persistent>
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold">{{ editingHistoryId ? 'Edit History Entry' : 'Add History Entry' }}</span>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="closeHistoryDialog"></v-btn>
        </v-card-title>
        <v-card-text class="pt-6">
          <v-form ref="historyForm" v-model="validHistoryForm">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-select v-model="editedHistory.EventType" :items="historyEntryTypes" item-title="title" item-value="value" label="Entry type *" :disabled="!!editingHistoryId" variant="outlined" density="compact"></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedHistory.EffectiveDate" label="Effective date *" type="date" :rules="getRules('required')" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col v-if="editedHistory.EventType === 'achievement_note'" cols="12" md="6">
                <v-select v-model="editedHistory.Category" :items="achievementCategories" label="Category" clearable variant="outlined" density="compact"></v-select>
              </v-col>
              <v-col v-if="editedHistory.EventType === 'role_changed'" cols="12" md="6">
                <v-select v-model="editedHistory.Role" :items="roleOptions.allRoles" label="New role *" :rules="getRules('required')" variant="outlined" density="compact"></v-select>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="editedHistory.Title" :label="editedHistory.EventType === 'achievement_note' ? 'Achievement title *' : 'Title (optional)'" :rules="editedHistory.EventType === 'achievement_note' ? getRules('required') : []" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="editedHistory.Detail" label="Details" rows="4" variant="outlined" density="compact"></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-6 pt-0 justify-end">
          <v-btn color="error" variant="text" @click="closeHistoryDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" @click="saveHistoryEntry">Save Entry</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
import AssignedStudies from "@/components/AssignedStudies.vue";
import AlertBanner from "@/components/AlertBanner.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import study from "@/services/study";
import personnel from "@/services/personnel";
import login from "@/services/login";
import { useMainStore } from "@/stores/mainStore";

export default {
  name: "Personnel",
  components: {
    AssignedStudies,
    AlertBanner,
    ConfirmDialog,
  },
  setup() {
    const store = useMainStore();
    return { store };
  },

  data() {
    return {
      search: "",
      dialog: false,
      Personnels: [],
      personnelStats: {
        e1Count: 0,
        e2Count: 0,
        scheduledCount: 0
      },
      personnelHistory: [],
      personnelJoinedDate: null,
      currentRoleHistoryEntryId: null,
      historyViewerDialog: false,
      historyFilter: 'all',
      historyDialog: false,
      editingHistoryId: null,
      editedHistory: {},
      validHistoryForm: true,
      achievementCategories: ["Award", "Scholarship", "Presentation", "Publication", "Grant", "Certification", "Other"],
      historyEntryTypes: [
        { title: "Achievement note", value: "achievement_note" },
        { title: "Role update", value: "role_changed" },
      ],
      currentPersonnel: {},
      editedPersonnel: {},
      defaultPersonnel: {
        Name: null,
        FK_Lab: this.store.lab,
        Initial: null,
        Email: null,
        Calendar: null,
        Role: null,
        Active: true,
      },
      editedIndex: -1,
      labStudies: [],
      validDialog: true,
      activeMemberFilter: true,

      roleOptions: {
        allRoles: ["Admin", "PI", "Lab manager", "PostDoc", "GradStudent", "RA", "Staff", "Undergrad"],
        fullRoles: ["PostDoc", "PI", "GradStudent", "Undergrad", "RA", "Lab manager", "Staff"],
        limitedRoles: ["PostDoc", "GradStudent", "Undergrad", "RA", "Staff"]
      }
    };
  },

  computed: {
    filteredPersonnels() {
      let result = this.Personnels;

      // Filter by Active status
      if (this.activeMemberFilter) {
        result = result.filter(p => !!p.Active);
      }

      // Filter by Search text
      if (this.search) {
        const lowerSearch = this.search.toLowerCase();
        result = result.filter(p =>
          (p.Name && p.Name.toLowerCase().includes(lowerSearch)) ||
          (p.Email && p.Email.toLowerCase().includes(lowerSearch))
        );
      }

      // Role Sorting Hierarchy
      const roleOrder = {
        'Admin': 1,
        'PI': 2,
        'Lab manager': 3,
        'PostDoc': 4,
        'GradStudent': 5,
        'RA': 6,
        'Staff': 7,
        'Undergrad': 8
      };

      // Sort by Role first, then Alphabetically
      return result.sort((a, b) => {
        const roleA = roleOrder[a.Role] || 99;
        const roleB = roleOrder[b.Role] || 99;

        if (roleA !== roleB) {
          return roleA - roleB;
        }
        return (a.Name || '').localeCompare(b.Name || '');
      });
    },

    availableRoles() {
      const role = this.store.role;
      if (['Admin', 'PI', 'Lab manager'].includes(role)) {
        return this.roleOptions.fullRoles;
      }
      if (['PostDoc', 'GradStudent'].includes(role)) {
        return ["RA", "Staff", "Undergrad"];
      }
      return this.roleOptions.limitedRoles;
    },

    canAddPersonnel() {
      const role = this.store.role;
      return ['Admin', 'PI', 'PostDoc', 'GradStudent', 'Lab manager'].includes(role);
    },

    canEditPersonnel() {
      if (!this.currentPersonnel.id) return false;
      const role = this.store.role;
      if (this.currentPersonnel.id == this.store.userID) return true;
      if (['Admin', 'PI', 'Lab manager'].includes(role)) return true;
      if (['PostDoc', 'GradStudent'].includes(role) && ['RA', 'Staff', 'Undergrad'].includes(this.currentPersonnel.Role)) return true;
      return false;
    },

    canDeletePersonnel() {
      if (!this.currentPersonnel.id) return false;
      const role = this.store.role;
      if (['Admin', 'PI', 'Lab manager'].includes(role)) return true;
      if (['PostDoc', 'GradStudent'].includes(role) && ['RA', 'Staff', 'Undergrad'].includes(this.currentPersonnel.Role)) return true;
      return false;
    },

    canViewStats() {
      if (this.currentPersonnel.id == this.store.userID) return true;
      const role = this.store.role;
      if (['Admin', 'PI', 'Lab manager'].includes(role)) return true;
      if (['PostDoc', 'GradStudent'].includes(role) && ['Lab manager', 'RA', 'Staff', 'Undergrad'].includes(this.currentPersonnel.Role)) return true;
      return false;
    },

    canManageHistory() {
      return ['Admin', 'PI', 'Lab manager'].includes(this.store.role);
    },

    visibleHistoryEntries() {
      if (this.historyFilter !== 'projects') return this.personnelHistory;
      return this.personnelHistory.filter(entry => this.isProjectHistoryEntry(entry));
    },

    historyViewerTitle() {
      return this.historyFilter === 'projects' ? 'Past Studies' : 'History & Achievements';
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

    canManageStatus(item) {
      const role = this.store.role;
      if (item.id == this.store.userID) return true;
      if (['Admin', 'PI', 'Lab manager'].includes(role)) return true;
      if (['PostDoc', 'GradStudent'].includes(role) && ['RA', 'Staff', 'Undergrad'].includes(item.Role)) return true;
      return false;
    },

    getRules(ruleName) {
      if (ruleName === 'required') return [v => !!v || 'Required'];
      if (ruleName === 'name') return [
        v => !!v || 'Name is required',
        v => !v || v.trim().length >= 2 || 'Name must be at least 2 characters'
      ];
      if (ruleName === 'email') return [
        v => !v || /^[^@]+@[^@]+\.[a-zA-Z]{2,}$/.test(v) || 'Invalid Email'
      ];
      if (ruleName === 'phone') return [
        v => !v || /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(v) || 'Invalid Phone'
      ];
      return [];
    },

    copyToClipboard(text) {
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard:', text);
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    },

    PhoneFormated(Phone) {
      if (Phone) {
        var cleaned = ("" + Phone).replace(/\D/g, "");
        var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
          return "(" + match[1] + ") " + match[2] + "-" + match[3];
        }
      }
      return Phone;
    },

    async searchPersonnel() {
      try {
        const Result = await personnel.search({ FK_Lab: this.store.lab });
        this.Personnels = Result.data;

        // Default select the logged-in user, or the first person in the list
        if (this.Personnels.length > 0) {
          const currentUser = this.Personnels.find(p => p.id === this.store.userID);
          const defaultUser = currentUser || this.filteredPersonnels[0];
          if (defaultUser) {
            this.rowSelected(defaultUser);
          }
        }
      } catch (error) {
        if (error.response?.status !== 401) console.error(error);
      }
    },

    async searchLabStudies() {
      try {
        const Result = await study.search({
          FK_Lab: this.store.lab,
          includeScheules: false,
        });
        this.labStudies = Result.data;
      } catch (error) {
        if (error.response?.status !== 401) console.error(error);
      }
    },

    async changePersonnelStatus(item) {
      try {
        item.Active = !item.Active;
        await personnel.update(item);
        this.$refs.confirmDialog.open("Status Updated", `User is now marked as ${item.Active ? 'Active' : 'Inactive'}.`, { color: "success", noconfirm: true });
      } catch (error) {
        item.Active = !item.Active;
        if (error.response?.status !== 401) console.error(error);
      }
    },

    async rowSelected(person) {
      // 1. Set the active person
      this.currentPersonnel = person;
      this.editedIndex = this.Personnels.findIndex(p => p.id === person.id);

      // 2. Reset the stats initially so old data doesn't linger
      this.personnelStats = { e1Count: 0, e2Count: 0, scheduledCount: 0 };
      this.personnelHistory = [];
      this.personnelJoinedDate = null;
      this.currentRoleHistoryEntryId = null;
      this.historyFilter = 'all';

      this.loadPersonnelHistory(person.id);

      // 3. Fetch new stats if the user has permission to see them
      if (this.canViewStats) {
        try {
          const statsResponse = await personnel.getStats(person.id);
          this.personnelStats = statsResponse.data;
        } catch (error) {
          console.error("Failed to load personnel stats:", error);
        }
      }
    },

    async loadPersonnelHistory(personnelId) {
      try {
        const response = await personnel.getHistory(personnelId);
        if (this.currentPersonnel.id === personnelId) {
          this.personnelHistory = response.data.entries || [];
          this.personnelJoinedDate = response.data.joinedDate;
          this.currentRoleHistoryEntryId = response.data.currentRoleEntryId || null;
          if (response.data.currentRole) {
            this.currentPersonnel.Role = response.data.currentRole;
            const memberIndex = this.Personnels.findIndex(person => person.id === personnelId);
            if (memberIndex !== -1) this.Personnels[memberIndex].Role = response.data.currentRole;
          }
        }
      } catch (error) {
        if (error.response?.status !== 401) console.error("Failed to load personnel history:", error);
      }
    },

    async openHistoryViewer() {
      await this.loadPersonnelHistory(this.currentPersonnel.id);
      this.historyFilter = 'all';
      this.historyViewerDialog = true;
    },

    async openPastStudies() {
      await this.loadPersonnelHistory(this.currentPersonnel.id);
      this.historyFilter = 'projects';
      this.historyViewerDialog = true;
    },

    showFullHistory() {
      this.historyFilter = 'all';
    },

    formatHistoryDate(value) {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    },

    formatHistoryMonth(value) {
      if (!value) return 'Unknown date';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'Unknown date';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    },

    isCurrentRoleEntry(entry) {
      return entry.id === this.currentRoleHistoryEntryId;
    },

    isProjectHistoryEntry(entry) {
      return ['project_started', 'project_ended', 'leadership_started', 'leadership_ended'].includes(entry.EventType);
    },

    historyColor(entry) {
      if (this.isCurrentRoleEntry(entry)) return '#7C3AED';
      return ({ joined: '#22C55E', role_changed: '#2563EB', project_started: '#0891B2', project_ended: '#94A3B8', leadership_started: '#9333EA', leadership_ended: '#94A3B8', achievement_note: '#D97706' })[entry.EventType] || '#2563EB';
    },

    historyIcon(type) {
      return ({ joined: 'mdi-account-plus-outline', role_changed: 'mdi-account-switch-outline', project_started: 'mdi-book-plus-outline', project_ended: 'mdi-book-minus-outline', leadership_started: 'mdi-star-circle-outline', leadership_ended: 'mdi-star-off-outline', achievement_note: 'mdi-trophy-outline' })[type] || 'mdi-timeline-text-outline';
    },

    historyTitle(entry) {
      if (entry.EventType === 'joined') return `Joined as ${entry.Role || 'member'}`;
      if (entry.EventType === 'role_changed') return entry.Title || `Role changed to ${entry.Role || 'Unknown'}`;
      if (entry.EventType === 'project_started') return `Joined project: ${entry.StudyName || 'Unknown project'}`;
      if (entry.EventType === 'project_ended') return `Left project: ${entry.StudyName || 'Unknown project'}`;
      if (entry.EventType === 'leadership_started') return `Became project lead: ${entry.StudyName || 'Unknown project'}`;
      if (entry.EventType === 'leadership_ended') return `Ended project leadership: ${entry.StudyName || 'Unknown project'}`;
      return entry.Title || 'Achievement';
    },

    openHistoryDialog(entry = null) {
      this.editingHistoryId = entry?.id || null;
      this.editedHistory = entry ? {
        EventType: entry.EventType,
        EffectiveDate: entry.EffectiveDate ? new Date(entry.EffectiveDate).toISOString().slice(0, 10) : '',
        Role: entry.Role || null, Category: entry.Category || null, Title: entry.Title || '', Detail: entry.Detail || '',
      } : { EventType: 'achievement_note', EffectiveDate: new Date().toISOString().slice(0, 10), Category: null, Title: '', Detail: '' };
      this.historyDialog = true;
    },

    closeHistoryDialog() {
      this.historyDialog = false;
      this.editingHistoryId = null;
      this.editedHistory = {};
    },

    async saveHistoryEntry() {
      const { valid } = await this.$refs.historyForm.validate();
      if (!valid) return;
      try {
        if (this.editingHistoryId) await personnel.updateHistory(this.currentPersonnel.id, this.editingHistoryId, this.editedHistory);
        else await personnel.createHistory(this.currentPersonnel.id, this.editedHistory);
        this.closeHistoryDialog();
        await this.loadPersonnelHistory(this.currentPersonnel.id);
      } catch (error) {
        await this.$refs.confirmDialog.open('Unable to save entry', error.response?.data?.error || 'Please review the entry and try again.', { color: 'error', noconfirm: true });
      }
    },

    async removeHistoryEntry(entry) {
      const confirmed = await this.$refs.confirmDialog.open('Delete History Entry', `Remove <strong>${this.historyTitle(entry)}</strong>?`, { color: 'error' });
      if (!confirmed) return;
      try {
        await personnel.deleteHistory(this.currentPersonnel.id, entry.id);
        await this.loadPersonnelHistory(this.currentPersonnel.id);
      } catch (error) {
        await this.$refs.confirmDialog.open('Unable to delete entry', error.response?.data?.error || 'Please try again.', { color: 'error', noconfirm: true });
      }
    },

    editPersonnel() {
      this.editedPersonnel = { ...this.currentPersonnel };
      this.editedIndex = this.Personnels.findIndex(p => p.id === this.currentPersonnel.id);
      this.dialog = true;
    },

    createPersonnel() {
      this.editedPersonnel = { ...this.defaultPersonnel };
      this.editedIndex = -1;
      this.dialog = true;
    },

    async save() {
      const { valid } = await this.$refs.dialogForm.validate();
      if (!valid) {
        await this.$refs.confirmDialog.open("Validation Error", "Please fill in all required fields and fix any errors before saving.", { color: "warning", noconfirm: true });
        return;
      }

      if (this.editedIndex === -1) {
        // Create
        try {
          const Result = await login.register(this.editedPersonnel);
          this.editedPersonnel.id = Result.data.id;
          this.editedPersonnel.AssignedStudies = [];
          this.editedPersonnel.StudyinCharge = [];
          this.Personnels.push(this.editedPersonnel);
          await this.$refs.confirmDialog.open("Success", `${Result.data.Email} has been added to the system!`, { color: "success", noconfirm: true });

          // Auto-select the newly created person
          this.rowSelected(this.editedPersonnel);
          this.close();
        } catch (error) {
          await this.$refs.confirmDialog.open("Error", error.response?.data?.message || "Failed to add personnel", { color: "error", noconfirm: true });
          console.error(error);
        }
      } else {
        // Update
        try {
          await personnel.update(this.editedPersonnel);
          this.currentPersonnel = { ...this.editedPersonnel };
          Object.assign(this.Personnels[this.editedIndex], this.editedPersonnel);

          if (this.currentPersonnel.id == this.store.userID) {
            this.store.setZoomLink(this.currentPersonnel.ZoomLink);
          }
          this.close();
        } catch (error) {
          if (error.response?.status !== 401) console.error(error);
        }
      }
    },

    close() {
      this.dialog = false;
      setTimeout(() => {
        this.editedPersonnel = {};
      }, 300);
    },

    async deletePersonnel() {
      const confirmed = await this.$refs.confirmDialog.open(
        "Delete Personnel",
        `Are you sure you want to remove <strong>${this.currentPersonnel.Name}</strong>?`,
        { color: "error" }
      );
      if (!confirmed) return;

      try {
        await personnel.delete({ id: this.currentPersonnel.id });
        await this.$refs.confirmDialog.open("Success", `<strong>${this.currentPersonnel.Name}</strong> is removed from the system.`, { color: "success", noconfirm: true });

        this.Personnels = this.Personnels.filter(p => p.id !== this.currentPersonnel.id);
        this.currentPersonnel = {};
      } catch (error) {
        console.error(error);
      }
    },

    updatedStudies(updatedStudies) {
      this.currentPersonnel.AssignedStudies = updatedStudies;
    },
  },

  mounted() {
    this.searchPersonnel();
    this.searchLabStudies();
  },
};
</script>

<style scoped>
/* Scoped styling to ensure the v-list scroll area works properly */
.v-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.v-list::-webkit-scrollbar {
  width: 6px;
}

.v-list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.history-card {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.05);
}

.history-timeline {
  width: 100%;
}

.history-timeline :deep(.v-timeline-item__body) {
  flex: 1 1 0;
  width: 100%;
  max-width: none;
  min-width: 0;
}

.history-card--current {
  border-color: #c4b5fd;
  box-shadow: 0 6px 18px rgba(124, 58, 237, 0.14);
}

.history-card__accent {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--history-accent);
}

.history-date-badge {
  padding: 4px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

</style>
