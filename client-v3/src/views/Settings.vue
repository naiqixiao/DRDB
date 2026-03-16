<template>
  <v-container fluid>
    <div v-if="!store.labEmailStatus" class="mb-4">
      <v-alert border="start" type="error" color="#c73460" density="compact" style="font-weight: 600">
        Lab email is not set up properly. Please set it up in the Settings page.
      </v-alert>
    </div>
    <div v-if="!store.adminEmailStatus" class="mb-4">
      <v-alert border="start" type="warning" color="#c7792c" density="compact" style="font-weight: 600">
        Admin email is not set up properly. Please set it up in the Settings page.
      </v-alert>
    </div>
    <div v-if="store.trainingMode" class="mb-4">
      <v-alert border="start" type="warning" color="#c7792c" density="compact" style="font-weight: 600">
        You are running in a training mode.
      </v-alert>
    </div>

    <ConfirmDlg ref="confirmD" />

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="ds-card mb-6" variant="flat">
          <v-toolbar color="transparent" density="compact" class="px-2">
            <v-icon class="mr-2" color="primary">mdi-account-circle-outline</v-icon>
            <span class="text-subtitle-1 font-weight-bold" style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">
              User Account
            </span>
          </v-toolbar>
          <v-divider></v-divider>
          <v-card-text class="d-flex flex-column align-center py-8">
            <v-icon size="56" color="primary" class="mb-4" style="opacity: 0.15">mdi-shield-lock-outline</v-icon>
            <v-btn color="primary" variant="outlined" prepend-icon="mdi-lock-reset" @click.stop="dialog = true">
              Change Password
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card class="ds-card mb-6" variant="flat">
          <v-toolbar color="transparent" density="compact" class="px-2">
            <v-icon class="mr-2" color="primary">mdi-shield-account-outline</v-icon>
            <span class="text-subtitle-1 font-weight-bold" style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">
              Admin Email
            </span>
            <v-spacer></v-spacer>
            <v-chip v-if="store.adminEmailStatus" size="x-small" variant="tonal" color="success">
              <v-icon start size="12">mdi-check-circle</v-icon>Connected
            </v-chip>
            <v-chip v-else size="x-small" variant="tonal" color="error">Not set up</v-chip>
          </v-toolbar>
          <v-divider></v-divider>
          <v-card-text>
            <v-text-field hide-details label="Administration email" :model-value="adminEmail" readonly
              placeholder="No email is set up" variant="outlined" density="compact"
              prepend-inner-icon="mdi-email-outline" class="mb-4" bg-color="textbackground"></v-text-field>
            <div class="d-flex flex-wrap" style="gap: 8px;">
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" color="primary" variant="tonal" size="small"
                    @click.stop="googleCredentialsURL('admin')"
                    :disabled="store.role != 'Admin'" prepend-icon="mdi-google">Setup Admin</v-btn>
                </template>
                <span>Only the Administrator can change the administration email.</span>
              </v-tooltip>
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" color="primary" variant="tonal" size="small"
                    @click.stop="createNewLab"
                    :disabled="store.role != 'Admin' || !store.adminEmailStatus"
                    prepend-icon="mdi-plus-circle-outline">Create Lab</v-btn>
                </template>
                <span>Only the Administrator can create a new lab.</span>
              </v-tooltip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card class="ds-card mb-6" variant="flat">
          <v-toolbar color="transparent" density="compact" class="px-2">
            <v-icon class="mr-2" color="primary">mdi-upload-outline</v-icon>
            <span class="text-subtitle-1 font-weight-bold" style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">
              Batch Upload Participants
            </span>
          </v-toolbar>
          <v-divider></v-divider>
          <v-card-text>
            <p class="text-body-2 mb-3 text-muted">
              Use this
              <a href="https://mcmasteru365-my.sharepoint.com/:x:/g/personal/xiaon8_mcmaster_ca/EeFyaQJH4H9Imh_JzXojHeIBMCzy0mAj9DaezEQK0Ri5iQ?e=8jJIrM"
                target="_blank" class="font-weight-bold">spreadsheet</a>
              as a template to upload multiple participants at once. Ensure DoB is formatted as <b>DD/MM/YYYY</b>.
            </p>
            <v-file-input ref="fileSelect" accept=".xlsx, .csv" label="Select import file"
              @update:model-value="selectFile" v-model="inputFile" variant="outlined" density="compact"
              prepend-inner-icon="mdi-file-excel-outline" prepend-icon=""
              :disabled="!['Admin', 'PI', 'Lab manager'].includes(store.role)">
            </v-file-input>
            <div class="d-flex justify-end mt-2">
              <v-btn color="#F59E0B" class="text-white font-weight-bold" variant="flat" @click.stop="batchImport()" :disabled="!inputFile"
                :loading="loadingStatus" prepend-icon="mdi-cloud-upload">Upload Data</v-btn>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="ds-card mb-6" variant="flat">
          <v-toolbar color="transparent" density="compact" class="px-2">
            <v-icon class="mr-2" color="primary">mdi-email-outline</v-icon>
            <span class="text-subtitle-1 font-weight-bold" style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">
              Lab Email Account
            </span>
            <v-spacer></v-spacer>
            <v-chip v-if="store.labEmailStatus" size="x-small" variant="tonal" color="success">
              <v-icon start size="12">mdi-check-circle</v-icon>Connected
            </v-chip>
            <v-chip v-else size="x-small" variant="tonal" color="error">Not set up</v-chip>
          </v-toolbar>
          <v-divider></v-divider>
          <v-card-text>
            <p class="text-body-2 mb-3 text-muted">
              Follow this <a href="https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/ERk1uev-LENDrca6aWXwSqYBAn1J1OEsJ3tNjPkbpvcwtA?e=Gz73ZK"
                target="_blank" class="font-weight-bold">instruction</a> to link your lab's Google Workspace.
            </p>
            <v-text-field hide-details label="Associated lab email" :model-value="labEmail" readonly
              placeholder="No email is set up" variant="outlined" density="compact"
              prepend-inner-icon="mdi-email-outline" class="mb-4" bg-color="textbackground"></v-text-field>
            <div class="d-flex flex-wrap" style="gap: 8px;">
              <v-btn color="primary" variant="tonal" size="small"
                @click.stop="googleCredentialsURL('lab')"
                :disabled="!canManageLab" prepend-icon="mdi-google">Setup Google Account</v-btn>
              <v-btn color="primary" variant="tonal" size="small"
                @click.stop="editLabInfo" :disabled="!canManageLab"
                prepend-icon="mdi-pencil-outline">Update Lab Profile</v-btn>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="ds-card mb-6" variant="flat" v-show="store.labEmailStatus">
          <v-toolbar color="transparent" density="compact" class="px-2 cursor-pointer" @click="testingRoomsOpen = !testingRoomsOpen">
            <v-icon class="mr-2" color="primary">mdi-door-open</v-icon>
            <span class="text-subtitle-1 font-weight-bold" style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">
              Testing Rooms
            </span>
            <v-chip v-if="currentTestingRooms.length > 0" size="x-small" variant="tonal" color="primary" class="ml-2">
              {{ currentTestingRooms.length }}
            </v-chip>
            <v-spacer></v-spacer>
            <v-btn :icon="testingRoomsOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'" variant="text" size="small"></v-btn>
          </v-toolbar>
          <v-expand-transition>
            <div v-show="testingRoomsOpen">
              <v-divider></v-divider>
              <v-card-text>
                <TestingRooms :testingRooms="currentTestingRooms" :labId="store.lab" @testingRoomsUpdated="testingRoomsUpdated" />
              </v-card-text>
            </div>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">Change Password</span>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="close"></v-btn>
        </v-card-title>
        <v-card-text class="pt-6">
          <v-form ref="form" v-model="valid" lazy-validation>
            <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Current Password</div>
            <v-text-field v-model="password" type="password" hide-details density="compact" variant="outlined" class="mb-4"></v-text-field>

            <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">New Password</div>
            <v-text-field v-model="newPassword" type="password" :rules="[newPasswordRule]" clearable variant="outlined" density="compact" class="mb-4"></v-text-field>

            <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Confirm New Password</div>
            <v-text-field v-model="newPasswordVerify" type="password" :rules="[passwordConfirmationRule]" clearable variant="outlined" density="compact"></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="close">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :disabled="passwordConfirmationRule !== true || !newPassword || !password || newPasswordRule !== true" @click="changePassword">Save Password</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogImport" max-width="800px" persistent>
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">Import Results</span>
        </v-card-title>
        <v-card-text class="pt-6">
          <div align="start" v-html="importReport" class="text-body-1" style="line-height: 1.6;"></div>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="flat" @click="dialogImport = false">Acknowledge</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogGoogle" max-width="500px" persistent>
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">Google Authentication</span>
        </v-card-title>
        <v-card-text class="pt-6">
          <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Paste Sign-in Code</div>
          <v-textarea variant="outlined" no-resize rows="2" v-model="signInCode" hide-details density="compact"></v-textarea>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeExtAPIs">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!signInCode" @click="setAdmin ? setAdminToken() : setLabToken()">Verify Code</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogNewLab" max-width="800px" persistent scrollable>
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">Create New Lab</span>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="closeNewLab"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-6 pb-2" style="max-height: 70vh;">
          <v-form ref="formNewLab" v-model="valid" lazy-validation>
            <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Lab Identity</div>
            <v-row dense class="mb-4">
              <v-col cols="12" md="6">
                <v-text-field label="Lab Name" v-model="currentLab.LabName" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field label="Default Zoom Link" v-model="currentLab.ZoomLink" variant="outlined" density="compact"></v-text-field>
              </v-col>
            </v-row>

            <v-divider class="mb-4"></v-divider>
            <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">PI / Lab Manager Profile</div>
            <v-row dense>
              <v-col cols="12" md="6" v-for="item in labPI" :key="item.label">
                <v-select v-if="item.options" :items="roleOptions" v-model="currentLab.Personnels[0][item.field]" :label="item.label" variant="outlined" density="compact"></v-select>
                <v-text-field v-else :label="item.label" v-model="currentLab.Personnels[0][item.field]" variant="outlined" density="compact"></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeNewLab">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveNewLab" prepend-icon="mdi-content-save">Create Lab</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog fullscreen v-model="dialogEditLab" transition="dialog-bottom-transition">
      <v-card class="ds-card" variant="flat">
        <v-toolbar color="primary" dark>
          <v-btn icon @click="closeEditLab" :disabled="requestInProgress"><v-icon>mdi-close</v-icon></v-btn>
          <v-toolbar-title>Update Lab Profile</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="saveEditLab" :loading="requestInProgress">Save Changes</v-btn>
        </v-toolbar>
        
        <v-card-text class="pt-6" style="background-color: var(--ds-field-bg);">
          <v-container style="max-width: 1000px;">
            <v-form ref="formEdit" v-model="valid" lazy-validation>
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Global Information</div>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field label="Lab Name" v-model="editedLab.LabName" variant="outlined" density="compact" bg-color="white"></v-text-field>
                </v-col>
                <v-col cols="12" md="8">
                  <v-text-field label="Physical Location" v-model="editedLab.Location" variant="outlined" density="compact" bg-color="white"></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field label="Default Zoom Link (Online Studies)" v-model="editedLab.ZoomLink" variant="outlined" density="compact" bg-color="white"></v-text-field>
                </v-col>
              </v-row>

              <v-divider class="my-6"></v-divider>
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Email Templates</div>
              
              <v-row>
                <v-col cols="12" md="6" v-for="item in labEmailTemplate" :key="item.label">
                  <v-card variant="outlined" class="bg-white pa-4 h-100">
                    <h3 class="text-subtitle-1 font-weight-bold text-primary mb-2">{{ item.label }}</h3>
                    <v-textarea :placeholder="item.placeholder" variant="outlined" no-resize rows="5" v-model="editedLab[item.field]" hide-details density="compact"></v-textarea>
                  </v-card>
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import login from "@/services/login";
import lab from "@/services/lab";
import family from "@/services/family";
import externalAPIs from "@/services/externalAPIs";
import TestingRooms from "@/components/TestingRooms.vue";
import ConfirmDlg from "@/components/ConfirmDialog.vue";
import moment from "moment";
import { useMainStore } from "@/stores/mainStore";

export default {
  components: { TestingRooms, ConfirmDlg },
  setup() { const store = useMainStore(); return { store }; },
  data() {
    return {
      testingRoomsOpen: true,
      password: null, newPassword: null, newPasswordVerify: null,
      dialog: false, valid: true, dialogGoogle: false, dialogImport: false,
      setAdmin: false, signInCode: null,
      labEmail: "Lab email is not set up yet.", adminEmail: "Admin email is not set up yet.",
      dialogNewLab: false, dialogEditLab: false,
      currentLab: { LabName: "", PI: "", ZoomLink: "", Personnels: [{ Name: "", Initial: "", Role: "", Email: "", Calendar: "" }] },
      editedLab: { LabName: null, Location: null, ZoomLink: null, EmailOpening: null, EmailClosing: null, TYEmail: null, TransportationInstructions: null },
      inputFile: undefined, uploadFile: null, importReport: "", loadingStatus: false,
      roleOptions: ["PI", "Lab manager"], requestInProgress: false, currentTestingRooms: [],
      labPI: [
        { label: "Name of PI/Manager", field: "Name" }, { label: "Initials", field: "Initial" },
        { label: "Email of PI/Manager", field: "Email" }, { label: "Phone", field: "Phone" },
        { label: "Role", field: "Role", options: "role" }, { label: "Calendar of PI/Manager", field: "Calendar" },
      ],
      labEmailTemplate: [
        { label: "Email Opening", field: "EmailOpening", placeholder: "The opening sentence to parents" },
        { label: "Email Closing", field: "EmailClosing", placeholder: "The closing sentence to parents. It usually mentions how the parents can reach the lab." },
        { label: "Thank You Email", field: "TYEmail", placeholder: "A paragraph shown at the bottom of thank you emails." },
        { label: "Transportation Instructions", field: "TransportationInstructions", placeholder: "Instructions for how to come to the lab." },
      ],
    };
  },
  computed: {
    passwordConfirmationRule() { return this.newPassword === this.newPasswordVerify || "Password must match"; },
    newPasswordRule() { return this.newPassword !== this.password || "New password must be different from the current one."; },
    canManageLab() { return ['Admin', 'PI', 'PostDoc', 'GradStudent', 'Lab manager'].includes(this.store.role); },
  },
  methods: {
    async changePassword() {
      try {
        const response = await login.changePassword({ Email: this.store.user, Password: this.password, newPassword: this.newPassword });
        this.close();
        this.store.setToken(response.data.token);
        this.store.setUser(response.data.user);
        this.store.setUserID(response.data.userID);
        this.store.setLab(response.data.lab);
        this.store.setStudies(response.data.studies);
        this.$refs.confirmD.open('Success', 'Your password is successfully changed!', { color: 'success', noconfirm: true });
      } catch (error) { this.$refs.confirmD.open('Error', 'Failed to change password. Please check your current password.', { color: 'error', noconfirm: true }); }
    },
    close() { this.dialog = false; setTimeout(() => { this.password = null; this.newPassword = null; this.newPasswordVerify = null; }, 300); },
    createNewLab() { this.dialogNewLab = true; },
    async editLabInfo() {
      this.editedLab.LabName = this.store.labName; this.editedLab.EmailOpening = this.store.emailOpening;
      this.editedLab.EmailClosing = this.store.emailClosing; this.editedLab.TYEmail = this.store.tyEmailClosing;
      this.editedLab.TransportationInstructions = this.store.transportationInstructions; this.editedLab.Location = this.store.location;
      this.editedLab.ZoomLink = this.store.ZoomLink; this.dialogEditLab = true;
    },
    async saveNewLab() {
      try {
        this.currentLab.PI = this.currentLab.Personnels[0].Initial;
        await lab.create(this.currentLab);
        this.$refs.confirmD.open('Lab Created', 'A new lab is created!<br>PI\'s account is created!<br>A sample study is created!', { color: 'success', noconfirm: true });
      } catch (error) { console.log(error); }
      this.closeNewLab();
    },
    async saveEditLab() {
      this.requestInProgress = true;
      try {
        await lab.update(this.editedLab);
        this.store.setLabName(this.editedLab.LabName); this.store.setEmailOpening(this.editedLab.EmailOpening);
        this.store.setEmailClosing(this.editedLab.EmailClosing); this.store.setTYEmailClosing(this.editedLab.TYEmail);
        this.store.setLocation(this.editedLab.Location); this.store.setTransportationInstructions(this.editedLab.TransportationInstructions);
        this.store.setZoomLink(this.editedLab.ZoomLink);
        this.$refs.confirmD.open('Updated', 'Lab information is updated!', { color: 'success', noconfirm: true });
      } catch (error) { console.log(error); }
      this.requestInProgress = false; this.closeEditLab();
    },
    closeNewLab() { this.dialogNewLab = false; setTimeout(() => { this.currentLab = { LabName: "", PI: "", ZoomLink: "", Personnels: [{ Name: "", Initial: "", Role: "", Email: "", Calendar: "" }] }; }, 300); },
    closeEditLab() { this.dialogEditLab = false; setTimeout(() => { this.editedLab = { LabName: null, Location: null, ZoomLink: null, EmailOpening: null, EmailClosing: null, TYEmail: null, TransportationInstructions: null }; }, 300); },
    async googleCredentialsURL(accountType) {
      this.setAdmin = accountType === "admin"; this.dialogGoogle = true;
      try { const credentialsURL = await externalAPIs.googleCredentialsURL(); window.open(credentialsURL.data, "_blank"); } catch (error) { console.log(error); }
    },
    async setLabToken() {
      try {
        const response = await externalAPIs.setLabToken(this.signInCode);
        this.labEmail = response.data.Email; this.store.setLabEmailStatus(true); this.store.setLabEmail(this.labEmail);
        this.$refs.confirmD.open('Success', 'Lab email account is successfully setup!', { color: 'success', noconfirm: true });
      } catch (error) { this.store.setLabEmailStatus(false); console.log(error); }
      this.closeExtAPIs();
    },
    async setAdminToken() {
      try {
        const response = await externalAPIs.setAdminToken(this.signInCode);
        this.adminEmail = response.data.Email; this.$refs.confirmD.open('Success', 'Admin email account is successfully setup!', { color: 'success', noconfirm: true });
        this.store.setAdminEmailStatus(true);
      } catch (error) { this.store.setAdminEmailStatus(false); console.log(error); }
      this.closeExtAPIs();
    },
    closeExtAPIs() { this.dialogGoogle = false; this.signInCode = null; },
    selectFile(file) {
      if (file) {
        var reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const XLSX = (await import("xlsx")).default || (await import("xlsx"));
            var data = new Uint8Array(e.target.result); var workbook = XLSX.read(data, { type: "array" });
            let sheetName = workbook.SheetNames[0]; let worksheet = workbook.Sheets[sheetName];
            var newParticipants = XLSX.utils.sheet_to_json(worksheet);
            newParticipants.forEach((participant) => {
              participant.DoB = moment(participant.DoB, "DD/MM/YYYY").toDate();
              if (!participant.Name) participant.Name = participant.Child_Last_Name ? participant.Child_First_Name + " " + participant.Child_Last_Name : participant.Child_First_Name;
              participant.Name = (participant.Name || "").replace(/undefined /g, "").replace(/ undefined/g, "");
              if (participant.Phone) participant.Phone = participant.Phone.replace(/-/g, "");
              if (participant.CellPhone) participant.CellPhone = participant.CellPhone.replace(/-/g, "");
              participant.Age = moment().diff(participant.DoB, "days"); participant.DoB = moment(participant.DoB).format("YYYY-MM-DD");
            });
            this.uploadFile = newParticipants;
          } catch (err) { this.$refs.confirmD.open('Error', 'Error parsing the file. Please ensure it is a valid .xlsx or .csv file.', { color: 'error', noconfirm: true }); }
        };
        reader.readAsArrayBuffer(file);
      }
    },
    async batchImport() {
      if (this.uploadFile) {
        this.loadingStatus = true;
        try {
          const importResults = await family.batchImport(this.uploadFile);
          this.importReport = this.importOutput(importResults.data);
          this.dialogImport = true;
        } catch (error) { this.$refs.confirmD.open('Error', 'Batch import failed. Please check the file format.', { color: 'error', noconfirm: true }); }
        this.uploadFile = null;
      }
      this.loadingStatus = false;
    },
    importOutput(importResults) {
      var alertText = "<strong>Please copy the following information for your record.</strong><br><strong>" + importResults.nOfAdded + "</strong> families were imported.<br>";
      if (importResults.doubleCheckList && importResults.doubleCheckList.length > 0) {
        alertText += "<br><strong>Check if these families have duplicated child records. They probably just have twins.</strong><br>";
        importResults.doubleCheckList.forEach((fam) => { alertText += " - <strong>Family ID</strong>: " + fam.FK_Family + ", <strong>Email</strong>: " + fam.Email + "<br>"; });
      }
      if (importResults.nOfSkip > 0) {
        alertText += "<br><strong>There are " + importResults.nOfSkip + " children not being imported because they are already in the database:</strong><br>";
        importResults.skipList.forEach((child) => { alertText += " - <strong>Child name</strong>: " + child.Name + ", <strong>DoB</strong>: " + child.DoB + ", <strong>Family email</strong>: " + child.Email + "<br>"; });
      }
      return alertText;
    },
    testingRoomsUpdated(testingRooms) { this.currentTestingRooms = testingRooms; },
    handleOAuthMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'GOOGLE_OAUTH_CODE' && event.data.code) {
        this.signInCode = event.data.code;
        if (this.setAdmin) this.setAdminToken(); else this.setLabToken();
      }
    }
  },
  watch: { dialog(val) { val || this.close(); }, dialogGoogle(val) { val || this.closeExtAPIs(); }, dialogNewLab(val) { val || this.closeNewLab(); }, dialogEditLab(val) { val || this.closeEditLab(); } },
  beforeUnmount() { window.removeEventListener('message', this.handleOAuthMessage); },
  async mounted() {
    window.addEventListener('message', this.handleOAuthMessage);
    this.currentTestingRooms = this.store.testingRooms || [];
    try {
      const profile = await externalAPIs.googleGetEmailAddress();
      if (profile.data) {
        this.labEmail = profile.data.labEmail || "Lab email is not set up yet."; this.adminEmail = profile.data.adminEmail || "Admin email is not set up yet.";
        this.store.setLabEmailStatus(!!profile.data.labEmail); this.store.setAdminEmailStatus(!!profile.data.adminEmail);
      }
    } catch (error) { console.log("Could not load email profile:", error); }
  },
};
</script>
