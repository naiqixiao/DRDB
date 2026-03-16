<template>
  <v-container fluid>
    <AlertBanner :showAdminEmail="true" />

    <v-row>
      <!-- Left Column: Personnel List -->
      <v-col cols="12" md="4">
        <v-card class="ds-card" variant="flat">
          <v-card-title class="d-flex align-center py-2">
            <v-text-field v-model="search" label="Search by Name or Email" class="mx-4" density="compact"
              variant="underlined" hide-details></v-text-field>
            <v-spacer></v-spacer>
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <div v-bind="props">
                  <v-checkbox v-model="activeMemberFilter" label="Active only" hide-details
                    density="compact"></v-checkbox>
                </div>
              </template>
              <span>Show active members</span>
            </v-tooltip>
          </v-card-title>

          <v-data-table :headers="headerPersonnel" :items="filteredPersonnels" :search="search" fixed-header
            height="600" hover :class="['elevation-1', 'personnel-table']" @click:row="rowSelected">
            <template #item.Active="{ item }">
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <div v-bind="props" @click.stop>
                    <v-checkbox-btn :model-value="!!item.Active" @update:model-value="changePersonnelStatus(item)"
                      :disabled="!canManageStatus(item)" density="compact" color="primary"></v-checkbox-btn>
                  </div>
                </template>
                <span>Mark whether this person is available to run studies</span>
              </v-tooltip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- Right Column: Personnel Details -->
      <v-col cols="12" md="8">
        <SectionHeader title="Personnel Information" icon="mdi-account-details" />

        <v-form ref="form" v-model="valid" lazy-validation>
          <v-container class="pa-0">
            <div class="info-grid info-grid--3">
              <InfoField v-for="item in personnelFields" :key="item.label" :label="item.label"
                :value="currentPersonnel[item.field]"
                :type="item.rules === 'phone' ? 'phone' : (item.rules === 'email' ? 'email' : null)" />
            </div>

            <v-row class="mt-4">
              <v-col cols="12">
                <v-row>
                  <v-col cols="auto">
                    <v-tooltip location="top">
                      <template v-slot:activator="{ props }">
                        <v-btn color="primary" v-bind="props" @click.stop="createPersonnel" :disabled="!canAddPersonnel"
                          prepend-icon="mdi-account-plus">
                          Add a person
                        </v-btn>
                      </template>
                      <span>Add a new person to the lab</span>
                    </v-tooltip>
                  </v-col>

                  <v-col cols="auto">
                    <v-tooltip location="top">
                      <template v-slot:activator="{ props }">
                        <v-btn color="primary" v-bind="props" @click.stop="editPersonnel" :disabled="!canEditPersonnel"
                          prepend-icon="mdi-pencil">
                          Update info
                        </v-btn>
                      </template>
                      <span>Edit personnel information</span>
                    </v-tooltip>
                  </v-col>

                  <v-col cols="auto">
                    <v-tooltip location="top">
                      <template v-slot:activator="{ props }">
                        <v-btn color="error" v-bind="props" @click.stop="deletePersonnel"
                          :disabled="!canDeletePersonnel" prepend-icon="mdi-delete">
                          Delete
                        </v-btn>
                      </template>
                      <span>Remove this person from the lab</span>
                    </v-tooltip>
                  </v-col>
                </v-row>
              </v-col>

              <SectionHeader title="Assigned Studies" icon="mdi-book-multiple" />

              <v-col cols="12" md="12" class="pa-0 mt-2">
                <AssignedStudies v-if="currentPersonnel.id" :Studies="currentPersonnel.AssignedStudies || []"
                  :labStudies="labStudies" :personnelId="currentPersonnel.id" :personnelName="currentPersonnel.Name"
                  @updatedStudies="updatedStudies"></AssignedStudies>
                <div v-else class="text-medium-emphasis ms-2">
                  Select a lab member to view assigned studies.
                </div>
              </v-col>
            </v-row>
          </v-container>

          <!-- Edit/Add Dialog -->
          <v-dialog v-model="dialog" max-width="800px" persistent>
            <v-card class="ds-card" variant="flat">
              <v-card-title class="text-h6 py-4">
                Lab member information
              </v-card-title>
              <v-card-text>
                <v-form ref="dialogForm" v-model="validDialog" lazy-validation>
                  <v-container class="pa-0">
                    <v-row dense>
                      <v-col cols="12" sm="6" :md="item.width" v-for="item in personnelFields" :key="item.label">
                        <v-select v-if="item.options === 'role'" v-model="editedPersonnel[item.field]"
                          :items="availableRoles" :label="item.label" :rules="[v => !!v || 'Required']"
                          hide-details="auto" variant="outlined" density="compact" class="mb-2"></v-select>

                        <v-text-field v-else v-model="editedPersonnel[item.field]" :label="item.label"
                          :rules="getRules(item.rules)" hide-details="auto" variant="outlined" density="compact"
                          class="mb-2"></v-text-field>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-form>
              </v-card-text>
              <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="text" @click="close">Cancel</v-btn>
                <v-btn color="primary" variant="text" @click="save" :disabled="!validDialog">Save</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-form>
      </v-col>
    </v-row>
    <ConfirmDialog ref="confirmDialog"></ConfirmDialog>
  </v-container>
</template>

<script>
import AssignedStudies from "@/components/AssignedStudies.vue";
import AlertBanner from "@/components/AlertBanner.vue";
import InfoField from "@/components/InfoField.vue";
import SectionHeader from "@/components/SectionHeader.vue";
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
    InfoField,
    SectionHeader,
    ConfirmDialog,
  },
  setup() {
    const store = useMainStore();
    return { store };
  },

  data() {
    return {
      search: "",
      headerPersonnel: [
        { title: "Name", align: "start", key: "Name", width: "35%" },
        { title: "Email", align: "start", sortable: false, key: "Email", width: "45%" },
        { title: "Active?", sortable: false, align: "center", key: "Active", width: "20%" },
      ],
      dialog: false,
      personnelFields: [
        { label: "Name", field: "Name", width: "6", rules: "name" },
        { label: "Initials", field: "Initial", width: "6", rules: "required" },
        { label: "Role", field: "Role", options: "role", width: "6", rules: "required" },
        { label: "Email", field: "Email", width: "6", rules: "email" },
        { label: "Calendar ID", field: "Calendar", width: "6", rules: "email" },
        { label: "Phone", field: "Phone", width: "6", rules: "phone" },
        { label: "Zoom Link", width: "12", field: "ZoomLink" },
      ],

      Personnels: [],
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
      valid: true,
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
      if (!this.activeMemberFilter) {
        return this.Personnels;
      }
      return this.Personnels.filter(p => !!p.Active);
    },

    availableRoles() {
      const role = this.store.role;
      if (role === 'Admin' || role === 'PI' || role === 'Lab manager') {
        return this.roleOptions.fullRoles;
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
      return (
        this.currentPersonnel.id == this.store.userID ||
        ['Admin', 'PI', 'Lab manager'].includes(role)
      );
    },

    canDeletePersonnel() {
      if (!this.currentPersonnel.id) return false;
      const role = this.store.role;
      return ['Admin', 'PI', 'Lab manager'].includes(role);
    }
  },

  methods: {
    canManageStatus(item) {
      const role = this.store.role;
      return (
        item.id == this.store.userID ||
        ['Admin', 'PI', 'Lab manager'].includes(role)
      );
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

    async searchPersonnel() {
      try {
        const Result = await personnel.search({ FK_Lab: this.store.lab });
        this.Personnels = Result.data;
      } catch (error) {
        if (error.response?.status !== 401) console.error(error);
      }
    },

    async searchLabStudies() {
      try {
        const Result = await study.search({
          FK_Lab: this.store.lab,
          includeScheules: false,
          Completed: 0,
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
      } catch (error) {
        item.Active = !item.Active;
        if (error.response?.status !== 401) console.error(error);
      }
    },

    rowSelected(event, { item }) {
      this.currentPersonnel = item;
      this.editedIndex = this.Personnels.findIndex(p => p.id === item.id);
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
      // Basic validation
      if (!this.editedPersonnel.Name || !this.editedPersonnel.Email || !this.editedPersonnel.Role) {
        await this.$refs.confirmDialog.open("Missing Details", "Please fill in the required fields (Name, Initials, Role, Email).", { color: "warning", noconfirm: true });
        return;
      }

      if (this.editedIndex === -1) {
        // Create
        try {
          const Result = await login.register(this.editedPersonnel);
          this.editedPersonnel.id = Result.data.id;
          this.Personnels.push(this.editedPersonnel);
          await this.$refs.confirmDialog.open("Success", `${Result.data.Email} has been added to the system!`, { color: "success", noconfirm: true });
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
        this.currentPersonnel = { ...this.defaultPersonnel };
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
.personnel-table :deep(tr.v-data-table__selected) {
  background-color: rgb(var(--v-theme-secondary), 0.1) !important;
}
</style>
