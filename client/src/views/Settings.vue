<template>
  <v-container fluid>
    <div v-if="!$store.state.labEmailStatus">
      <v-alert border="left" type="error" color="#c73460" dense style="font-weight: 600">Lab email is not been setup
        properly. Please set it up in the Settings
        page.</v-alert>
    </div>
    <div v-if="!$store.state.adminEmailStatus">
      <v-alert border="left" type="warning" color="#c7792c" dense style="font-weight: 600">Admin email is not been setup
        properly. Please set it up in the Settings
        page.</v-alert>
    </div>
    <div v-if="$store.state.trainingMode">
      <v-alert border="left" type="warning" color="#c7792c" dense style="font-weight: 600">You are running in a training
        mode.</v-alert>
    </div>

    <v-row style="height: 200px; margin: 24px 10%;">
      <v-col md="4">
        <v-divider style="margin-bottom: 20px"></v-divider>
        <h2 class="text-left" style="margin-right: 0px;">User account settings</h2>
        <div style="height: 80%;  display: flex;  justify-content: space-around; align-content: center;flex-wrap: wrap; ">

          <v-btn style="align-self: center !important" color="primary" @click.stop="dialog = true">Change password</v-btn>
        </div>
        <v-dialog v-model="dialog" max-width="600px" :retain-focus="false" persistent>
          <v-card outlined>
            <v-card-title class="headline">Change password</v-card-title>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-row v-if="!changeTemporaryPassword" justify="center">
                <v-col cols="12" md="6" class="subtitle">
                  <v-divider></v-divider>
                  <h4 class="text-left">Current password:</h4>
                  <v-text-field v-model="password" type="password" hide-details dense></v-text-field>
                </v-col>
              </v-row>
              <v-row justify="center">
                <v-col cols="12" md="12">
                  <v-divider></v-divider>
                </v-col>
                <v-col cols="12" md="6" class="subtitle">
                  <h4 class="text-left">New password:</h4>
                  <v-text-field v-model="newPassword" type="password" :rules="[newPasswordRule]" clearable></v-text-field>
                </v-col>
              </v-row>
              <br />
              <v-row justify="center">
                <v-col cols="12" md="6" class="subtitle">
                  <h4 class="text-left">Confirm new password:</h4>
                  <v-text-field v-model="newPasswordVerify" clearable type="password"
                    :rules="[passwordConfirmationRule]"></v-text-field>
                </v-col>
              </v-row>
            </v-form>
            <v-card-actions>
              <v-row justify="space-between" style="height: 50px">
                <v-col md="3"></v-col>
                <v-col md="2">
                  <v-btn color="primary" @click="dialog = false">Cancel</v-btn>
                </v-col>
                <v-col md="2">
                  <v-btn color="primary" :disabled="passwordConfirmationRule != true ||
                    newPassword == null ||
                    password == null ||
                    newPasswordRule != true
                    " @click="changePassword">Confirm</v-btn>
                </v-col>
                <v-col md="3"></v-col>
              </v-row>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
      <v-col cols="12" md="8">
        <v-divider style="margin-bottom: 20px"></v-divider>
        <h2 class="text-left" style="margin-right: 0px;">Batch upload participant info</h2>
        <p class="text-left">
          You can use this
          <a href="https://mcmasteru365-my.sharepoint.com/:x:/g/personal/xiaon8_mcmaster_ca/EeFyaQJH4H9Imh_JzXojHeIBMCzy0mAj9DaezEQK0Ri5iQ?e=8jJIrM"
            target="_blank"><b>spreadsheet</b></a>
          as template to upload multiple participant information at once.<br />*Any
          information should be formatted as <b>TEXT</b> in the spreadsheet (including
          phone numbers, DoB, etc.). <br />*Date of birth (DoB) has to be entered in
          <b>DD/MM/YYYY</b> format.
        </p>
        <template>
          <v-file-input ref="fileSelect" accept=".xlsx, .csv" background-color="textbackground"
            label="Click here to select import file" @change="selectFile" v-model="inputFile" outlined dense :disabled="$store.state.role != 'Admin' &&
              $store.state.role != 'PI' &&
              $store.state.role != 'Lab manager'
              "></v-file-input>

          <div style="display: flex; justify-content: end">

            <v-btn color="primary" @click.stop="batchImport()" :disabled="!inputFile"
              :loading="loadingStatus">Upload</v-btn>
          </div>
        </template>
      </v-col>

      <v-dialog v-model="dialogImport" max-width="800px" persistent>
        <v-card outlined>
          <v-card-title class="headline">Batch import results</v-card-title>
          <v-card-text>

            <body align="start" v-html="importReport"></body>
          </v-card-text>
          <v-card-actions>
            <v-row justify="center" style="height: 50px">
              <v-col md="2">
                <v-btn color="primary" @click="dialogImport = false">Confirm</v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>

    <v-row justify="center" align="center" style="height: 200px; margin: 24px 10%">
      <v-col md="12" class="subtitle">
        <v-divider style="margin-bottom: 20px"></v-divider>
        <h2 class="text-left" style="margin-right: 0px;">Lab email account settings</h2>

        <p class="text-left">
          You can follow this
          <a href="https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/ERk1uev-LENDrca6aWXwSqYBAn1J1OEsJ3tNjPkbpvcwtA?e=Gz73ZK"
            target="_blank"><b>instruction</b></a>
          to set up Google Account for your lab.
        </p>
      </v-col>

      <v-col cols="12" md="2">
        <v-text-field class="textfield-family" background-color="textbackground" hide-details label="Associated lab email"
          :value="this.labEmail" readonly placeholder="No email is set up" outlined dense></v-text-field>
      </v-col>

      <v-col cols="12" md="3">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-btn color="primary" @click.stop="googleCredentialsURL('lab')" :disabled="$store.state.role != 'Admin' &&
                $store.state.role != 'PI' &&
                $store.state.role != 'PostDoc' &&
                $store.state.role != 'GradStudent' &&
                $store.state.role != 'Lab manager'
                ">Setup Google Account</v-btn>
            </div>
          </template>
          <span>Only PI and lab manager can change the associated lab email.</span>
        </v-tooltip>
      </v-col>
      <v-col cols="12" md="3">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-btn color="primary" @click.stop="editLabInfo" :disabled="$store.state.role != 'Admin' &&
                $store.state.role != 'PI' &&
                $store.state.role != 'PostDoc' &&
                $store.state.role != 'GradStudent' &&
                $store.state.role != 'Lab manager'
                ">Update Lab Info</v-btn>
            </div>
          </template>
          <span>Only PI and lab manager can change lab information.</span>
        </v-tooltip>
      </v-col>

      <v-dialog v-model="dialogGoogle" max-width="600px" :retain-focus="false" persistent>
        <v-card outlined>
          <v-card-title class="headline">Paste Google sign in code</v-card-title>
          <v-card-text>
            <v-row justify="center">
              <v-col cols="12" md="10" class="subtitle">
                <v-textarea label="Paste the sign-in code here." outlined no-resize rows="1" v-model="signInCode"
                  hide-details></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-row justify="space-between" style="height: 50px">
              <v-col md="3"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="dialogGoogle = false">Cancel</v-btn>
              </v-col>
              <v-col md="2">
                <v-btn color="primary" :disabled="!signInCode"
                  @click="setAdmin ? setAdminToken() : setLabToken()">Confirm</v-btn>
              </v-col>
              <v-col md="3"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>

    <!-- testing room setting will appear once the lab calendar is set up. -->
    <v-row style="margin: 24px 10%; overflow-y: scroll;" v-show="$store.state.labEmailStatus">
      <v-col md="12" class="subtitle">
        <v-divider style="margin-bottom: 20px"></v-divider>
        <h2 class="text-left" style="margin-right: 0px;">Testing Rooms</h2>
      </v-col>
      <testingRooms :testingRooms="currentTestingRooms" :labId="$store.state.lab"
        @testingRoomsUpdated="testingRoomsUpdated" />
    </v-row>

    <v-row justify="center" align="center" style="height: 200px; margin: 24px 10%; overflow-y: scroll;">
      <v-col md="12" class="subtitle">
        <v-divider style="margin-bottom: 20px"></v-divider>
        <h2 class="text-left" style="margin-right: 0px;">Administration email account settings</h2>

      </v-col>
      <v-col cols="12" md="2">
        <v-text-field class="textfield-family" background-color="textbackground" hide-details label="Administration email"
          :value="this.adminEmail" readonly placeholder="No email is set up" outlined dense></v-text-field>
      </v-col>

      <v-col cols="12" md="4">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-btn color="primary" @click.stop="googleCredentialsURL('admin')"
                :disabled="$store.state.role != 'Admin'">Setup Admin Account</v-btn>
            </div>
          </template>
          <span>Only the Administrator can change the adminstration email.</span>
        </v-tooltip>
      </v-col>

      <v-col cols="12" md="3">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-btn color="primary" @click.stop="createNewLab"
                :disabled="$store.state.role != 'Admin' || !$store.state.adminEmailStatus">Create a Lab</v-btn>
            </div>
          </template>
          <span>Only the Administrator can create new lab.</span>
        </v-tooltip>
      </v-col>

      <v-dialog v-model="dialogNewLab" max-width="800px" :retain-focus="false" persistent>
        <v-card outlined>
          <v-card-title class="headline">Lab and PI/Manager information</v-card-title>

          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row>
              <v-col md="12" class="subtitle">
                <v-divider></v-divider>
                <h4 class="text-left">Lab information:</h4>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field class="textfield-family" background-color="textbackground" hide-details label="Lab's Name"
                  v-model="currentLab.LabName" placeholder="  " :rules="$rules.required" outlined dense></v-text-field>
              </v-col>
              <!-- <v-col md="12" class="subtitle">
                <v-divider></v-divider>
                <h4 class="text-left">Email Components:</h4>
              </v-col>
              <v-col cols="12" md="12" v-for="item in this.$labEmailTemplate" :key="item.label">
                <v-textarea
                  class="conv-textarea"
                  :label="item.label"
                  :placeholder="item.placeholder"
                  outlined
                  no-resize
                  rows="3"
                  hide-details
                  v-model="currentLab[item.field]"
                  :rules="$rules.required"
                ></v-textarea>
              </v-col>-->

              <v-col md="12" class="subtitle">
                <v-divider></v-divider>
                <h4 class="text-left">Zoom Link (for online studies):</h4>
              </v-col>
              <v-col cols="12" md="12">
                <v-text-field class="textfield-family" background-color="textbackground" hide-details label="Zoom Link"
                  v-model="currentLab.ZoomLink" placeholder="  " outlined dense></v-text-field>
              </v-col>

              <v-col md="12" class="subtitle">
                <v-divider></v-divider>
                <h4 class="text-left">PI/Lab Manager information:</h4>
              </v-col>
              <v-col cols="12" md="4" v-for="item in this.$labPI" :key="item.label">
                <div v-if="item.options">
                  <v-select justify="start" :items="roleOptions" v-model="currentLab.Personnels[0][item.field]"
                    :label="item.label" hide-details class="textfield-family" placeholder="  " :rules="$rules[item.rules]"
                    outlined dense chip></v-select>
                </div>
                <div v-else>
                  <v-text-field class="textfield-family" background-color="textbackground" hide-details
                    :label="item.label" v-model="currentLab.Personnels[0][item.field]" placeholder="  "
                    :rules="$rules[item.rules]" outlined dense></v-text-field>
                </div>
              </v-col>
            </v-row>

          </v-form>

          <v-card-actions>
            <v-row justify="space-between" style="height: 50px; margintop: 20px">
              <v-col md="3"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="closeNewLab">Cancel</v-btn>
              </v-col>
              <v-col md="2">
                <v-btn color="primary" @click="saveNewLab">Confirm</v-btn>
              </v-col>
              <v-col md="3"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog fullscreen hide-overlay transition="dialog-bottom-transition" v-model="dialogEditLab"
        :retain-focus="false">
        <v-card outlined>
          <v-card-title class="headline">Lab information</v-card-title>
          <v-card-text>
            <v-form ref="formEdit" v-model="valid" lazy-validation>
              <v-row justify="start">
                <v-col cols="12" :md="item.width" v-for="item in this.$labInfo" :key="item.label"><v-text-field
                    class="textfield-family" background-color="textbackground" hide-details :label="item.label"
                    v-model="editedLab[item.field]" placeholder="  " :rules="$rules[item.rules]" outlined
                    dense></v-text-field>
                </v-col>

                <!-- <v-col cols="12" md="3">
                  <v-text-field
                    class="textfield-family"
                    background-color="textbackground"
                    hide-details
                    label="Lab's Name"
                    v-model="editedLab.LabName"
                    placeholder="  "
                    :rules="$rules.required"
                    outlined
                    dense
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    class="textfield-family"
                    background-color="textbackground"
                    hide-details
                    label="Location"
                    v-model="editedLab.Location"
                    placeholder="  "
                    :rules="$rules.required"
                    outlined
                    dense
                  ></v-text-field>
                </v-col> -->
              </v-row>

              <v-row>
                <v-col md="12" class="subtitle">
                  <v-divider></v-divider>
                  <h4 class="text-left">Zoom Link (for online studies):</h4>
                </v-col>
                <v-col cols="12" md="12">
                  <v-text-field class="textfield-family" background-color="textbackground" hide-details label="Zoom Link"
                    v-model="editedLab.ZoomLink" placeholder="  " outlined dense></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col md="12" class="subtitle">
                  <v-divider></v-divider>
                  <h4 class="text-left">Email snipplets:</h4>
                </v-col>
                <v-col cols="12" md="6" v-for=" item  in  this.$labEmailTemplate " :key="item.label">
                  <h3 class="text-left">{{ item.label }}</h3>
                  <div>
                    <ckeditor :editor="editor" v-model="editedLab[item.field]" :config="editorConfig"></ckeditor>
                  </div>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-row justify="space-between" style="height: 50px">
              <v-col md="3"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="closeEditLab" :disabled="requestInProgress">Cancel</v-btn>
              </v-col>
              <v-col md="2">
                <v-btn color="primary" @click="saveEditLab" :disabled="requestInProgress">Confirm</v-btn>
              </v-col>
              <v-col md="3"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>
  </v-container>
</template>

<script>
import login from "@/services/login";
import lab from "@/services/lab";

// import testingRoom from "@/services/testingRoom";
import family from "@/services/family";
import externalAPIs from "@/services/externalAPIs";
// import { VueEditor } from "vue2-editor";

import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import XLSX from "xlsx";
import moment from "moment";
// import calendar from "../services/calendar";

// import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog.vue';
import testingRooms from '../components/testingRooms.vue';

export default {
  components: {
    // VueEditor,
    // DeleteConfirmationDialog,
    testingRooms,
  },
  data() {
    return {
      editor: ClassicEditor,
      editorData: '<p>Content of the editor.</p>',
      editorConfig: {
        toolbar: {
          items: [
            'undo', 'redo',
            '|', 'heading',
            '|', 'bold', 'italic',
            '|', 'link', 'insertImage', 'insertTable', 'mediaEmbed', 'blockQuote',
            '|', 'bulletedList', 'numberedList', 'outdent', 'indent'
          ]
        }
      },
      password: null,
      newPassword: null,
      newPasswordVerify: null,
      dialog: false,
      changeTemporaryPassword: false,
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
        Personnels: [
          {
            Name: "",
            Initial: "",
            Role: "",
            Email: "",
            Calendar: "",
          },
        ],
      },
      editedLab: {
        LabName: null,
      },
      inputFile: undefined,
      uploadFile: null,
      importReport: "",
      loadingStatus: false,
      roleOptions: ["PI", "Lab manager"],
      customToolbar: [
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
        ["link"],
      ],
      testingRooms: [{ name: "", location: "", calendar: "" }],
      currentTestingRooms: [],
      showDeleteConfirmation: false,
      // selectedTestingRoom: '',
      requestInProgress: false,
    };
  },

  methods: {
    showDeleteConfirmationDialog(room) {
      this.showDeleteConfirmation = true;
      this.selectedTestingRoom = room;
    },
    // async confirmDelete(selectedRoom) {
    //   const testingRoomInfo = this.currentTestingRooms.find(room => room.name === selectedRoom)
    //   this.currentTestingRooms = this.currentTestingRooms.filter(curRoom => curRoom.id !== testingRoomInfo.id);

    //   this.showDeleteConfirmation = false;
    //   this.selectedTestingRoom = '';
    //   await testingRoom.delete(testingRoomInfo);
    // },
    cancelDelete() {
      this.showDeleteConfirmation = false;
      // this.selectedTestingRoom = '';
    },

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

        alert("Your password is successfully changed!");
      } catch (error) {
        console.log(error.response);
      }
    },

    createNewLab() {
      this.dialogNewLab = true;
    },

    // addTestingRoom() {
    //   this.testingRooms.push({ name: "", location: "", calendar: "" });
    // },
    // deleteTestingRoom(index) {
    //   this.testingRooms.splice(index, 1);
    // },

    async editLabInfo() {
      // const testingRooms = await testingRoom.search(this.$store.state.lab);
      // this.$store.dispatch("setTestingRooms", testingRooms.data);

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
      var validationResults = this.$refs.form.validate();

      if (validationResults) {
        try {

          this.currentLab.PI = this.currentLab.Personnels[0].Initial;

          await lab.create(this.currentLab);
          // const newLab = await lab.search(this.currentLab);
          // const testingRoomInfo = this.testingRooms;

          alert(
            "A new lab is created!\nPI's account is created! \nA sample study is created!"
          );

          this.$refs.form.resetValidation();
        } catch (error) {
          console.log(error.response);
        }
      }

      this.closeNewLab();
    },

    async saveEditLab() {
      this.requestInProgress = true;

      var validationResults = this.$refs.formEdit.validate();

      if (validationResults) {
        try {
          await lab.update(this.editedLab);

          this.$store.dispatch("setLabName", this.editedLab.LabName);

          this.$store.dispatch("setEmailOpening", this.editedLab.EmailOpening);
          this.$store.dispatch("setEmailClosing", this.editedLab.EmailClosing);
          this.$store.dispatch("setTYEmailClosing", this.editedLab.TYEmail);
          this.$store.dispatch("setLocation", this.editedLab.Location);
          this.$store.dispatch(
            "setTransportationInstructions",
            this.editedLab.TransportationInstructions
          );
          this.$store.dispatch("setZoomLink", this.editedLab.ZoomLink);

          alert("Lab information is updated!");
          this.$refs.formEdit.resetValidation();

        } catch (error) {
          console.log(error.response);
        }
      }
      this.requestInProgress = false;
      this.closeEditLab();
    },

    close() {
      this.dialog = false;
      setTimeout(() => {
        this.password = null;
        this.newPassword = null;
        this.newPasswordVerify = null;
      }, 300);
    },

    testingRoomsUpdated(testingRooms) {
      this.currentTestingRooms = testingRooms;
      this.$store.dispatch("setTestingRooms", testingRooms);
    },

    closeNewLab() {
      this.dialogNewLab = false;
      setTimeout(() => {
        this.currentLab = {
          LabName: null,
          EmailOpening: null,
          EmailClosing: null,
          ransportationInstructions: null,
          Location: null,
          PI: "",
          Personnels: [
            {
              Name: "",
              Initial: "",
              Role: "",
              Email: "",
              Calendar: "",
            },
          ],
        };
      }, 300);
    },

    closeEditLab() {
      this.dialogEditLab = false;
      this.showDeleteConfirmation = false;
      this.selectedTestingRoom = '';
      setTimeout(() => {
        this.editedLab = {
          LabName: null,
          EmailOpening: null,
          EmailClosing: null,
          ransportationInstructions: null,
          Location: null,
        };
      }, 300);
    },

    async googleCredentialsURL(accountType) {
      switch (accountType) {
        case "lab":
          this.setAdmin = false;
          break;
        case "admin":
          this.setAdmin = true;
          break;
      }

      this.dialogGoogle = true;

      const redentialsURL = await externalAPIs.googleCredentialsURL();
      window.open(redentialsURL.data, "_blank");
    },

    async setLabToken() {
      try {
        const response = await externalAPIs.setLabToken(this.signInCode);

        this.labEmail = response.data.Email;
        this.$store.dispatch("setLabEmailStatus", true);
        this.$store.dispatch("setLabEmail", this.labEmail);

        alert("Lab email account is successfully setup!");
        // console.log(response.data);
      } catch (error) {
        // console.log(error.response);
        this.$store.dispatch("setLabEmailStatus", false);
      }
      this.closeExtAPIs();
    },

    async setAdminToken() {
      try {
        const response = await externalAPIs.setAdminToken(this.signInCode);

        this.adminEmail = response.data.Email;

        alert("Admin email account is successfully setup!");
        this.$store.dispatch("setAdminEmailStatus", true);
      } catch (error) {
        this.$store.dispatch("setAdminEmailStatus", false);
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

        // Use the javascript reader object to load the contents
        // of the file in the v-model prop
        reader.onload = (e) => {
          var data = new Uint8Array(e.target.result);
          var workbook = XLSX.read(data, { type: "array" });
          let sheetName = workbook.SheetNames[0];
          /* DO SOMETHING WITH workbook HERE */
          let worksheet = workbook.Sheets[sheetName];

          var newParticipants = XLSX.utils.sheet_to_json(worksheet);

          newParticipants.forEach((participant) => {
            participant.DoB = moment(participant.DoB, "DD/MM/YYYY").toDate();

            if (!participant.Name) {
              participant.Name = participant.Child_Last_Name
                ? participant.Child_First_Name + " " + participant.Child_Last_Name
                : participant.Child_First_Name;
            }

            participant.Name = participant.Name.replace(/undefined /g, "");
            participant.Name = participant.Name.replace(/ undefined/g, "");

            if (participant.Phone) {
              participant.Phone = participant.Phone.replace(/-/g, "");
            }

            if (participant.CellPhone) {
              participant.CellPhone = participant.CellPhone.replace(/-/g, "");
            }

            if (participant.Birth_Weight) {
              var BW = participant.Birth_Weight.split("-");

              if (BW.length > 1) {
                participant.Birthweight =
                  parseInt(BW[0]) * 453.592 + (parseInt(BW[1]) * 453.592) / 16;
              } else if (parseInt(BW[0]) < 100) {
                participant.Birthweight = parseInt(BW[0]) * 453.592;
              } else {
                participant.Birthweight = parseInt(BW[0]);
              }
            }

            participant.Age = moment().diff(participant.DoB, "days");

            participant.DoB = moment(participant.DoB).format("YYYY-MM-DD");
          });

          this.uploadFile = newParticipants;
        };

        // console.log(newParticipants);
        reader.readAsArrayBuffer(file);
      }
    },

    async batchImport() {
      if (this.uploadFile) {
        this.loadingStatus = true;
        try {
          const importResults = await family.batchImport(this.uploadFile);

          const output = this.importOutput(importResults.data);

          this.importReport = output;
          this.dialogImport = true;
        } catch (error) {
          console.log(error);
        }

        // this.$refs.fileSelect.value = "";
        this.uploadFile = null;
      }
      this.loadingStatus = false;
    },

    importOutput(importResults) {
      var alertText =
        "<strong>Please copy the following information for your record.</strong><br>";

      alertText =
        alertText +
        "<strong>" +
        importResults.nOfAdded +
        "</strong> families were imported.<br>";

      if (importResults.doubleCheckList.length > 1) {
        alertText =
          alertText +
          "<br><strong>Check if these families have duplicated child records. They probably just have twins.</strong><br>";

        importResults.doubleCheckList.forEach((family) => {
          alertText =
            alertText +
            " - <strong>Family ID</strong>: " +
            family.FK_Family +
            ", <strong>Email</strong>: " +
            family.Email +
            "<br>";
        });
      }

      if (importResults.nOfSkip > 0) {
        alertText =
          alertText +
          "<br><strong>There are " +
          importResults.nOfSkip +
          " children not being imported because they are already in the databse:</strong><br>";
        importResults.skipList.forEach((child) => {
          alertText =
            alertText +
            " -  <strong>Child name</strong>: " +
            child.Name +
            ", <strong>DoB</strong>: " +
            child.DoB +
            ", <strong>Family email</strong>: " +
            child.Email +
            "<br>";
        });
      }

      return alertText;
    },
  },

  computed: {
    passwordConfirmationRule() {
      return this.newPassword === this.newPasswordVerify || "Password must match";
    },

    newPasswordRule() {
      return (
        this.newPassword !== this.password ||
        "New password must be different from the current one."
      );
    },

    isAuthorized() {
      return (createdBy) => {
        const allowedRoles = ['Admin', 'PI', createdBy];
        const userRole = this.$store.state.role;
        const userId = this.$store.state.userID;
        return allowedRoles.includes(userRole) || createdBy === userId;
      };
    },

  },

  watch: {
    dialog(val) {
      val || this.close();
    },
    dialogGoogle(val) {
      val || this.closeExtAPIs();
    },
    dialogNewLab(val) {
      val || this.closeNewLab();
    },
    dialogEditLab(val) {
      val || this.closeEditLab();
    },
    showDeleteConfirmation(val) {
      val || this.cancelDelete();
    }
  },

  async mounted() {

    this.currentTestingRooms = this.$store.state.testingRooms;

    try {
      const profile = await externalAPIs.googleGetEmailAddress();

      this.labEmail = profile.data.labEmail;
      this.adminEmail = profile.data.adminEmail;

      // if (profile.data.labName) {
      //   this.$store.dispatch("setLabName", profile.data.labName);
      // }

      if (this.labEmail) {
        // this.$store.dispatch("setLabEmail", labEmail);
        this.$store.dispatch("setLabEmailStatus", true);
      } else {
        this.$store.dispatch("setLabEmailStatus", false);
      }
      if (this.adminEmail) {
        this.$store.dispatch("setAdminEmailStatus", true);
      } else {
        this.$store.dispatch("setAdminEmailStatus", false);
      }
    } catch (error) {
      console.log(error.response);
    }
  },
};
</script>

<style>
.testing-room-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.v-text-field__details {
  display: none;
}

.testing-room--container {
  display: flex;
  margin-top: 1.5em;
  margin-bottom: 1.5em;
  margin-left: 1em;
}

.testing-room--title {
  display: flex;
  justify-content: center;
  font-size: large;
}

.testing-room--text {
  font-size: large;
  justify-content: left;
  font-weight: 500;
}

.testing-room--delete {
  position: absolute !important;
  right: 0;
  top: 0;
  color: red !important;
  transition: transform 0.3s ease;
}

.testing-room--delete:hover {
  cursor: pointer;
  transform: rotate(-90deg);
}

.ck-editor__editable_inline:not(.ck-comment__input *) {
  height: 300px !important;
  overflow-y: auto;
  margin: 0px;
}
</style>
