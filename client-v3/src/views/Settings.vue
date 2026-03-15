<template>
  <v-container fluid>
    <ConfirmDlg ref="confirmD" />
    <!-- Alerts -->
    <div v-if="!$store.state.labEmailStatus">
      <v-alert border="start" type="error" color="#c73460" density="compact" style="font-weight: 600">
        Lab email is not set up properly. Please set it up in the Settings page.
      </v-alert>
    </div>
    <div v-if="!$store.state.adminEmailStatus">
      <v-alert border="start" type="warning" color="#c7792c" density="compact" style="font-weight: 600">
        Admin email is not set up properly. Please set it up in the Settings page.
      </v-alert>
    </div>
    <div v-if="$store.state.trainingMode">
      <v-alert border="start" type="warning" color="#c7792c" density="compact" style="font-weight: 600">
        You are running in a training mode.
      </v-alert>
    </div>

    <!-- ROW 1: User Account + Batch Upload -->
    <v-row style="margin: 24px 10%">
      <!-- Change Password -->
      <v-col md="4">
        <v-divider style="margin-bottom: 20px"></v-divider>
        <h2 class="text-left">User account settings</h2>
        <div style="height: 80%; display: flex; justify-content: space-around; align-content: center; flex-wrap: wrap;">
          <v-btn style="align-self: center" color="primary" @click.stop="dialog = true">Change password</v-btn>
        </div>

        <!-- Change Password Dialog -->
        <v-dialog v-model="dialog" max-width="600px" persistent>
          <v-card class="ds-card" variant="flat">
            <v-card-title class="text-h6">Change password</v-card-title>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-row justify="center">
                <v-col cols="12" md="6" class="subtitle">
                  <v-divider></v-divider>
                  <h4 class="text-left">Current password:</h4>
                  <v-text-field v-model="password" type="password" hide-details density="compact"
                    variant="outlined"></v-text-field>
                </v-col>
              </v-row>
              <v-row justify="center">
                <v-col cols="12" md="12"><v-divider></v-divider></v-col>
                <v-col cols="12" md="6" class="subtitle">
                  <h4 class="text-left">New password:</h4>
                  <v-text-field v-model="newPassword" type="password" :rules="[newPasswordRule]" clearable
                    variant="outlined"></v-text-field>
                </v-col>
              </v-row>
              <br />
              <v-row justify="center">
                <v-col cols="12" md="6" class="subtitle">
                  <h4 class="text-left">Confirm new password:</h4>
                  <v-text-field v-model="newPasswordVerify" clearable type="password"
                    :rules="[passwordConfirmationRule]" variant="outlined"></v-text-field>
                </v-col>
              </v-row>
            </v-form>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" @click="dialog = false" variant="text">Cancel</v-btn>
              <v-btn color="primary" variant="text"
                :disabled="passwordConfirmationRule !== true || newPassword == null || password == null || newPasswordRule !== true"
                @click="changePassword">Confirm</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>

      <!-- Batch Upload -->
      <v-col cols="12" md="8">
        <v-divider style="margin-bottom: 20px"></v-divider>
        <h2 class="text-left">Batch upload participant info</h2>
        <p class="text-left">
          You can use this
          <a href="https://mcmasteru365-my.sharepoint.com/:x:/g/personal/xiaon8_mcmaster_ca/EeFyaQJH4H9Imh_JzXojHeIBMCzy0mAj9DaezEQK0Ri5iQ?e=8jJIrM"
            target="_blank"><b>spreadsheet</b></a>
          as template to upload multiple participant information at once.<br />
          *Any information should be formatted as <b>TEXT</b> in the spreadsheet (including phone numbers, DoB,
          etc.).<br />
          *Date of birth (DoB) has to be entered in <b>DD/MM/YYYY</b> format.
        </p>
        <v-file-input ref="fileSelect" accept=".xlsx, .csv" label="Click here to select import file"
          @update:model-value="selectFile" v-model="inputFile" variant="outlined" density="compact"
          :disabled="$store.state.role != 'Admin' && $store.state.role != 'PI' && $store.state.role != 'Lab manager'">
        </v-file-input>
        <div style="display: flex; justify-content: end">
          <v-btn color="primary" @click.stop="batchImport()" :disabled="!inputFile"
            :loading="loadingStatus">Upload</v-btn>
        </div>
      </v-col>

      <!-- Batch Import Results Dialog -->
      <v-dialog v-model="dialogImport" max-width="800px" persistent>
        <v-card class="ds-card" variant="flat">
          <v-card-title class="text-h6">Batch import results</v-card-title>
          <v-card-text>
            <div align="start" v-html="importReport"></div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="dialogImport = false">Confirm</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>

    <!-- ROW 2: Lab Email Account Settings -->
    <v-row justify="center" align="center" style="margin: 24px 10%">
      <v-col md="12" class="subtitle">
        <v-divider style="margin-bottom: 20px"></v-divider>
        <h2 class="text-left">Lab email account settings</h2>
        <p class="text-left">
          You can follow this
          <a href="https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/ERk1uev-LENDrca6aWXwSqYBAn1J1OEsJ3tNjPkbpvcwtA?e=Gz73ZK"
            target="_blank"><b>instruction</b></a>
          to set up Google Account for your lab.
        </p>
      </v-col>

      <v-col cols="12" md="2">
        <v-text-field hide-details label="Associated lab email" :model-value="labEmail" readonly
          placeholder="No email is set up" variant="outlined" density="compact"></v-text-field>
      </v-col>

      <v-col cols="12" md="3">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" color="primary" @click.stop="googleCredentialsURL('lab')"
              :disabled="!canManageLab">Setup Google Account</v-btn>
          </template>
          <span>Only PI and lab manager can change the associated lab email.</span>
        </v-tooltip>
      </v-col>

      <v-col cols="12" md="3">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" color="primary" @click.stop="editLabInfo" :disabled="!canManageLab">Update Lab
              Info</v-btn>
          </template>
          <span>Only PI and lab manager can change lab information.</span>
        </v-tooltip>
      </v-col>

      <!-- Google Sign-In Code Dialog -->
      <v-dialog v-model="dialogGoogle" max-width="600px" persistent>
        <v-card class="ds-card" variant="flat">
          <v-card-title class="text-h6">Paste Google sign in code</v-card-title>
          <v-card-text>
            <v-row justify="center">
              <v-col cols="12" md="10" class="subtitle">
                <v-textarea label="Paste the sign-in code here." variant="outlined" no-resize rows="1"
                  v-model="signInCode" hide-details></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="dialogGoogle = false" variant="text">Cancel</v-btn>
            <v-btn color="primary" :disabled="!signInCode" variant="text"
              @click="setAdmin ? setAdminToken() : setLabToken()">Confirm</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>

    <!-- Testing Rooms (visible when lab email is set up) -->
    <v-row style="margin: 24px 10%; overflow-y: auto" v-show="$store.state.labEmailStatus">
      <v-col md="12" class="subtitle">
        <v-divider style="margin-bottom: 20px"></v-divider>
        <h2 class="text-left">Testing Rooms</h2>
      </v-col>
      <TestingRooms :testingRooms="currentTestingRooms" :labId="$store.state.lab"
        @testingRoomsUpdated="testingRoomsUpdated" />
    </v-row>

    <!-- ROW 3: Administration Email Account Settings -->
    <v-row justify="center" align="center" style="margin: 24px 10%">
      <v-col md="12" class="subtitle">
        <v-divider style="margin-bottom: 20px"></v-divider>
        <h2 class="text-left">Administration email account settings</h2>
      </v-col>

      <v-col cols="12" md="2">
        <v-text-field hide-details label="Administration email" :model-value="adminEmail" readonly
          placeholder="No email is set up" variant="outlined" density="compact"></v-text-field>
      </v-col>

      <v-col cols="12" md="4">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" color="primary" @click.stop="googleCredentialsURL('admin')"
              :disabled="$store.state.role != 'Admin'">Setup Admin Account</v-btn>
          </template>
          <span>Only the Administrator can change the administration email.</span>
        </v-tooltip>
      </v-col>

      <v-col cols="12" md="3">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" color="primary" @click.stop="createNewLab"
              :disabled="$store.state.role != 'Admin' || !$store.state.adminEmailStatus">Create a Lab</v-btn>
          </template>
          <span>Only the Administrator can create new lab.</span>
        </v-tooltip>
      </v-col>

      <!-- Create New Lab Dialog -->
      <v-dialog v-model="dialogNewLab" max-width="800px" persistent>
        <v-card class="ds-card" variant="flat">
          <v-card-title class="text-h6">Lab and PI/Manager information</v-card-title>
          <v-form ref="formNewLab" v-model="valid" lazy-validation>
            <v-row style="padding: 16px">
              <v-col md="12" class="subtitle">
                <v-divider></v-divider>
                <h4 class="text-left">Lab information:</h4>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field hide-details label="Lab's Name" v-model="currentLab.LabName" placeholder=" "
                  variant="outlined" density="compact"></v-text-field>
              </v-col>

              <v-col md="12" class="subtitle">
                <v-divider></v-divider>
                <h4 class="text-left">Zoom Link (for online studies):</h4>
              </v-col>
              <v-col cols="12" md="12">
                <v-text-field hide-details label="Zoom Link" v-model="currentLab.ZoomLink" placeholder=" "
                  variant="outlined" density="compact"></v-text-field>
              </v-col>

              <v-col md="12" class="subtitle">
                <v-divider></v-divider>
                <h4 class="text-left">PI/Lab Manager information:</h4>
              </v-col>
              <v-col cols="12" md="4" v-for="item in labPI" :key="item.label">
                <div v-if="item.options">
                  <v-select :items="roleOptions" v-model="currentLab.Personnels[0][item.field]" :label="item.label"
                    hide-details variant="outlined" density="compact"></v-select>
                </div>
                <div v-else>
                  <v-text-field hide-details :label="item.label" v-model="currentLab.Personnels[0][item.field]"
                    placeholder=" " variant="outlined" density="compact"></v-text-field>
                </div>
              </v-col>
            </v-row>
          </v-form>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="closeNewLab" variant="text">Cancel</v-btn>
            <v-btn color="primary" @click="saveNewLab" variant="text">Confirm</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Edit Lab Info Dialog (fullscreen) -->
      <v-dialog fullscreen v-model="dialogEditLab">
        <v-card class="ds-card" variant="flat">
          <v-card-title class="text-h6">Lab information</v-card-title>
          <v-card-text>
            <v-form ref="formEdit" v-model="valid" lazy-validation>
              <v-row justify="start">
                <v-col cols="12" md="4">
                  <v-text-field hide-details label="Lab's Name" v-model="editedLab.LabName" variant="outlined"
                    density="compact"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field hide-details label="Location" v-model="editedLab.Location" variant="outlined"
                    density="compact"></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col md="12" class="subtitle">
                  <v-divider></v-divider>
                  <h4 class="text-left">Zoom Link (for online studies):</h4>
                </v-col>
                <v-col cols="12" md="12">
                  <v-text-field hide-details label="Zoom Link" v-model="editedLab.ZoomLink" variant="outlined"
                    density="compact"></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col md="12" class="subtitle">
                  <v-divider></v-divider>
                  <h4 class="text-left">Email snippets:</h4>
                </v-col>
                <v-col cols="12" md="6" v-for="item in labEmailTemplate" :key="item.label">
                  <h3 class="text-left">{{ item.label }}</h3>
                  <v-textarea :label="item.label" :placeholder="item.placeholder" variant="outlined" no-resize rows="6"
                    v-model="editedLab[item.field]"></v-textarea>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="closeEditLab" variant="text" :disabled="requestInProgress">Cancel</v-btn>
            <v-btn color="primary" @click="saveEditLab" variant="text" :disabled="requestInProgress">Confirm</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>

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

export default {
  components: {
    TestingRooms,
    ConfirmDlg,
  },
  data() {
    return {
      password: null,
      newPassword: null,
      newPasswordVerify: null,
      dialog: false,
      valid: true,
      dialogGoogle: false,
      dialogImport: false,
      setAdmin: false,
      signInCode: null,
      labEmail: "Lab email is not set up yet.",
      adminEmail: "Admin email is not set up yet.",
      dialogNewLab: false,
      dialogEditLab: false,
      currentLab: {
        LabName: "",
        PI: "",
        ZoomLink: "",
        Personnels: [
          { Name: "", Initial: "", Role: "", Email: "", Calendar: "" },
        ],
      },
      editedLab: {
        LabName: null,
        Location: null,
        ZoomLink: null,
        EmailOpening: null,
        EmailClosing: null,
        TYEmail: null,
        TransportationInstructions: null,
      },
      inputFile: undefined,
      uploadFile: null,
      importReport: "",
      loadingStatus: false,
      roleOptions: ["PI", "Lab manager"],
      requestInProgress: false,
      currentTestingRooms: [],

      // Field definitions (migrated from Vue.prototype)
      labPI: [
        { label: "Name of PI/Manager", field: "Name" },
        { label: "Initials", field: "Initial" },
        { label: "Email of PI/Manager", field: "Email" },
        { label: "Phone", field: "Phone" },
        { label: "Role", field: "Role", options: "role" },
        { label: "Calendar of PI/Manager", field: "Calendar" },
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
    passwordConfirmationRule() {
      return this.newPassword === this.newPasswordVerify || "Password must match";
    },
    newPasswordRule() {
      return this.newPassword !== this.password || "New password must be different from the current one.";
    },
    canManageLab() {
      const role = this.$store.state.role;
      return ['Admin', 'PI', 'PostDoc', 'GradStudent', 'Lab manager'].includes(role);
    },
  },

  methods: {
    async changePassword() {
      try {
        const response = await login.changePassword({
          Email: this.$store.state.user,
          Password: this.password,
          newPassword: this.newPassword,
        });

        this.close();

        this.$store.dispatch("setToken", response.data.token);
        this.$store.dispatch("setUser", response.data.user);
        this.$store.dispatch("setUserID", response.data.userID);
        this.$store.dispatch("setLab", response.data.lab);
        this.$store.dispatch("setStudies", response.data.studies);

        this.$refs.confirmD.open('Success', 'Your password is successfully changed!', { color: 'success', noconfirm: true });
      } catch (error) {
        console.log(error.response || error);
        this.$refs.confirmD.open('Error', 'Failed to change password. Please check your current password.', { color: 'error', noconfirm: true });
      }
    },

    close() {
      this.dialog = false;
      setTimeout(() => {
        this.password = null;
        this.newPassword = null;
        this.newPasswordVerify = null;
      }, 300);
    },

    createNewLab() {
      this.dialogNewLab = true;
    },

    async editLabInfo() {
      this.editedLab.LabName = this.$store.state.labName;
      this.editedLab.EmailOpening = this.$store.state.emailOpening;
      this.editedLab.EmailClosing = this.$store.state.emailClosing;
      this.editedLab.TYEmail = this.$store.state.tyEmailClosing;
      this.editedLab.TransportationInstructions = this.$store.state.transportationInstructions;
      this.editedLab.Location = this.$store.state.location;
      this.editedLab.ZoomLink = this.$store.state.ZoomLink;
      this.dialogEditLab = true;
    },

    async saveNewLab() {
      try {
        this.currentLab.PI = this.currentLab.Personnels[0].Initial;
        await lab.create(this.currentLab);
        this.$refs.confirmD.open('Lab Created', 'A new lab is created!<br>PI\'s account is created!<br>A sample study is created!', { color: 'success', noconfirm: true });
      } catch (error) {
        console.log(error.response || error);
      }
      this.closeNewLab();
    },

    async saveEditLab() {
      this.requestInProgress = true;
      try {
        await lab.update(this.editedLab);

        this.$store.dispatch("setLabName", this.editedLab.LabName);
        this.$store.dispatch("setEmailOpening", this.editedLab.EmailOpening);
        this.$store.dispatch("setEmailClosing", this.editedLab.EmailClosing);
        this.$store.dispatch("setTYEmailClosing", this.editedLab.TYEmail);
        this.$store.dispatch("setLocation", this.editedLab.Location);
        this.$store.dispatch("setTransportationInstructions", this.editedLab.TransportationInstructions);
        this.$store.dispatch("setZoomLink", this.editedLab.ZoomLink);

        this.$refs.confirmD.open('Updated', 'Lab information is updated!', { color: 'success', noconfirm: true });
      } catch (error) {
        console.log(error.response || error);
      }
      this.requestInProgress = false;
      this.closeEditLab();
    },

    closeNewLab() {
      this.dialogNewLab = false;
      setTimeout(() => {
        this.currentLab = {
          LabName: "", PI: "", ZoomLink: "",
          Personnels: [{ Name: "", Initial: "", Role: "", Email: "", Calendar: "" }],
        };
      }, 300);
    },

    closeEditLab() {
      this.dialogEditLab = false;
      setTimeout(() => {
        this.editedLab = {
          LabName: null, Location: null, ZoomLink: null,
          EmailOpening: null, EmailClosing: null, TYEmail: null,
          TransportationInstructions: null,
        };
      }, 300);
    },

    async googleCredentialsURL(accountType) {
      this.setAdmin = accountType === "admin";
      this.dialogGoogle = true;

      try {
        const credentialsURL = await externalAPIs.googleCredentialsURL();
        window.open(credentialsURL.data, "_blank");
      } catch (error) {
        console.log(error);
      }
    },

    async setLabToken() {
      try {
        const response = await externalAPIs.setLabToken(this.signInCode);
        this.labEmail = response.data.Email;
        this.$store.dispatch("setLabEmailStatus", true);
        this.$store.dispatch("setLabEmail", this.labEmail);
        this.$refs.confirmD.open('Success', 'Lab email account is successfully setup!', { color: 'success', noconfirm: true });
      } catch (error) {
        this.$store.dispatch("setLabEmailStatus", false);
        console.log(error);
      }
      this.closeExtAPIs();
    },

    async setAdminToken() {
      try {
        const response = await externalAPIs.setAdminToken(this.signInCode);
        this.adminEmail = response.data.Email;
        this.$refs.confirmD.open('Success', 'Admin email account is successfully setup!', { color: 'success', noconfirm: true });
        this.$store.dispatch("setAdminEmailStatus", true);
      } catch (error) {
        this.$store.dispatch("setAdminEmailStatus", false);
        console.log(error);
      }
      this.closeExtAPIs();
    },

    closeExtAPIs() {
      this.dialogGoogle = false;
      this.signInCode = null;
    },

    selectFile(file) {
      if (file) {
        var reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const XLSX = (await import("xlsx")).default || (await import("xlsx"));
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: "array" });
            let sheetName = workbook.SheetNames[0];
            let worksheet = workbook.Sheets[sheetName];
            var newParticipants = XLSX.utils.sheet_to_json(worksheet);

            newParticipants.forEach((participant) => {
              participant.DoB = moment(participant.DoB, "DD/MM/YYYY").toDate();

              if (!participant.Name) {
                participant.Name = participant.Child_Last_Name
                  ? participant.Child_First_Name + " " + participant.Child_Last_Name
                  : participant.Child_First_Name;
              }

              participant.Name = (participant.Name || "").replace(/undefined /g, "").replace(/ undefined/g, "");

              if (participant.Phone) {
                participant.Phone = participant.Phone.replace(/-/g, "");
              }
              if (participant.CellPhone) {
                participant.CellPhone = participant.CellPhone.replace(/-/g, "");
              }

              participant.Age = moment().diff(participant.DoB, "days");
              participant.DoB = moment(participant.DoB).format("YYYY-MM-DD");
            });

            this.uploadFile = newParticipants;
          } catch (err) {
            console.error("Error parsing file:", err);
            this.$refs.confirmD.open('Error', 'Error parsing the file. Please ensure it is a valid .xlsx or .csv file.', { color: 'error', noconfirm: true });
          }
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
        } catch (error) {
          console.log(error);
          this.$refs.confirmD.open('Error', 'Batch import failed. Please check the file format.', { color: 'error', noconfirm: true });
        }
        this.uploadFile = null;
      }
      this.loadingStatus = false;
    },

    importOutput(importResults) {
      var alertText = "<strong>Please copy the following information for your record.</strong><br>";
      alertText += "<strong>" + importResults.nOfAdded + "</strong> families were imported.<br>";

      if (importResults.doubleCheckList && importResults.doubleCheckList.length > 0) {
        alertText += "<br><strong>Check if these families have duplicated child records. They probably just have twins.</strong><br>";
        importResults.doubleCheckList.forEach((fam) => {
          alertText += " - <strong>Family ID</strong>: " + fam.FK_Family + ", <strong>Email</strong>: " + fam.Email + "<br>";
        });
      }

      if (importResults.nOfSkip > 0) {
        alertText += "<br><strong>There are " + importResults.nOfSkip + " children not being imported because they are already in the database:</strong><br>";
        importResults.skipList.forEach((child) => {
          alertText += " - <strong>Child name</strong>: " + child.Name + ", <strong>DoB</strong>: " + child.DoB + ", <strong>Family email</strong>: " + child.Email + "<br>";
        });
      }

      return alertText;
    },

    testingRoomsUpdated(testingRooms) {
      this.currentTestingRooms = testingRooms;
    },

    handleOAuthMessage(event) {
      // Only process messages from our own origin
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === 'GOOGLE_OAUTH_CODE' && event.data.code) {
        this.signInCode = event.data.code;
        if (this.setAdmin) {
          this.setAdminToken();
        } else {
          this.setLabToken();
        }
      }
    }
  },

  watch: {
    dialog(val) { val || this.close(); },
    dialogGoogle(val) { val || this.closeExtAPIs(); },
    dialogNewLab(val) { val || this.closeNewLab(); },
    dialogEditLab(val) { val || this.closeEditLab(); },
  },

  beforeUnmount() {
    window.removeEventListener('message', this.handleOAuthMessage);
  },

  async mounted() {
    window.addEventListener('message', this.handleOAuthMessage);

    this.currentTestingRooms = this.$store.state.testingRooms || [];

    try {
      const profile = await externalAPIs.googleGetEmailAddress();

      if (profile.data) {
        this.labEmail = profile.data.labEmail || "Lab email is not set up yet.";
        this.adminEmail = profile.data.adminEmail || "Admin email is not set up yet.";

        if (profile.data.labEmail) {
          this.$store.dispatch("setLabEmailStatus", true);
        } else {
          this.$store.dispatch("setLabEmailStatus", false);
        }
        if (profile.data.adminEmail) {
          this.$store.dispatch("setAdminEmailStatus", true);
        } else {
          this.$store.dispatch("setAdminEmailStatus", false);
        }
      }
    } catch (error) {
      console.log("Could not load email profile:", error);
    }
  },
};
</script>

<style scoped>
.subtitle {
  padding: 4px 0px 0px 8px !important;
}
</style>
