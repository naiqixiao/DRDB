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

      <v-col cols="12" md="8" lg="9" style="height: calc(100vh - 120px); overflow-y: auto;">
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
              <v-col cols="12" md="3">
                <v-select v-model="editedPersonnel.Role" :items="availableRoles" label="Role *"
                  :rules="[v => !!v || 'Required']" variant="outlined" density="compact" bg-color="white"
                  color="primary"></v-select>
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
        v => !v || /^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*{}|~<>;:[\]]{2,}$/.test(v) || 'Invalid Name'
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
      if (!this.editedPersonnel.Name || !this.editedPersonnel.Email || !this.editedPersonnel.Role) {
        await this.$refs.confirmDialog.open("Missing Details", "Please fill in the required fields.", { color: "warning", noconfirm: true });
        return;
      }

      if (this.editedIndex === -1) {
        // Create
        try {
          const Result = await login.register(this.editedPersonnel);
          this.editedPersonnel.id = Result.data.id;
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
</style>
