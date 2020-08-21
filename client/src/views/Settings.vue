<template>
  <v-container fluid>
    <div v-if="!$store.state.labEmailStatus">
      <v-alert
        border="left"
        type="error"
        color="#c73460"
        dense
        style="font-weight: 600"
      >Lab email is not been setup properly. Please set it up in the Settings page.</v-alert>
    </div>
    <div v-if="!$store.state.adminEmailStatus">
      <v-alert
        border="left"
        type="warning"
        color="#c7792c"
        dense
        style="font-weight: 600"
      >Admin email is not been setup properly. Please set it up in the Settings page.</v-alert>
    </div>
    <v-row align="start" style="height: 200px;">
      <v-col md="12" class="subtitle">
        <v-divider></v-divider>
        <h4 class="text-left">User account settings:</h4>
      </v-col>
      <v-col cols="12" md="5">
        <v-btn color="primary" @click.stop="dialog = true">Change password</v-btn>
      </v-col>

      <v-dialog v-model="dialog" max-width="600px" :retain-focus="false">
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
                <v-text-field
                  v-model="newPassword"
                  type="password"
                  :rules="[newPasswordRule]"
                  clearable
                ></v-text-field>
              </v-col>
            </v-row>
            <br />
            <v-row justify="center">
              <v-col cols="12" md="6" class="subtitle">
                <h4 class="text-left">Confirm new password:</h4>
                <v-text-field
                  v-model="newPasswordVerify"
                  clearable
                  type="password"
                  :rules="[passwordConfirmationRule]"
                ></v-text-field>
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
                <v-btn
                  color="primary"
                  :disabled="
                    passwordConfirmationRule != true ||
                      newPassword == null ||
                      password == null ||
                      newPasswordRule != true
                  "
                  @click="changePassword"
                >Confirm</v-btn>
              </v-col>
              <v-col md="3"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>

    <v-row justify="center" align="center" style="height: 200px;">
      <v-col md="12" class="subtitle">
        <v-divider></v-divider>
        <h4 class="text-left">Lab email account settings:</h4>
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          height="48px"
          background-color="textbackground"
          hide-details
          label="Associated lab email"
          :value="this.labEmail"
          readonly
          placeholder="No email is set up"
          outlined
          dense
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="3">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-btn
                color="primary"
                @click.stop="googleCredentialsURL('lab')"
                :disabled=" $store.state.role != 'Admin' && $store.state.role != 'PI' && $store.state.role != 'Lab manager'"
              >Setup Google Account</v-btn>
            </div>
          </template>
          <span>Only PI and lab manager can change the associated lab email.</span>
        </v-tooltip>
      </v-col>
      <v-col cols="12" md="3">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-btn
                color="primary"
                @click.stop="dialogEditLab = true"
                :disabled=" $store.state.role != 'Admin' && $store.state.role != 'PI' && $store.state.role != 'Lab manager'"
              >Update Lab Info</v-btn>
            </div>
          </template>
          <span>Only PI and lab manager can change lab information.</span>
        </v-tooltip>
      </v-col>

      <v-dialog v-model="dialogGoogle" max-width="600px" :retain-focus="false">
        <v-card outlined>
          <v-card-title class="headline">Paste Google sign in code</v-card-title>
          <!-- <v-form ref="form" v-model="valid" lazy-validation> -->

          <v-row justify="center">
            <v-col cols="12" md="8" class="subtitle">
              <v-textarea
                label="Paste the sign-in code here."
                outlined
                no-resize
                rows="1"
                solo
                v-model="signInCode"
                hide-details
              ></v-textarea>
            </v-col>
          </v-row>
          <!-- </v-form> -->
          <v-card-actions>
            <v-row justify="space-between" style="height: 50px">
              <v-col md="3"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="dialogGoogle = false">Cancel</v-btn>
              </v-col>
              <v-col md="2">
                <v-btn
                  color="primary"
                  :disabled="!signInCode"
                  @click=" setAdmin ? setAdminToken() : setLabToken()"
                >Confirm</v-btn>
              </v-col>
              <v-col md="3"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>

    <v-row justify="center" align="center" style="height: 200px;">
      <v-col md="12" class="subtitle">
        <v-divider></v-divider>
        <h4 class="text-left">Administration email account settings:</h4>
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          height="48px"
          background-color="textbackground"
          hide-details
          label="Administration email"
          :value="this.adminEmail"
          readonly
          placeholder="No email is set up"
          outlined
          dense
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="4">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-btn
                color="primary"
                @click.stop="googleCredentialsURL('admin')"
                :disabled=" $store.state.role != 'Admin'"
              >Setup Admin Account</v-btn>
            </div>
          </template>
          <span>Only the Administrator can change the adminstration email.</span>
        </v-tooltip>
      </v-col>

      <v-col cols="12" md="3">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-btn
                color="primary"
                @click.stop="createNewLab"
                :disabled=" $store.state.role != 'Admin'"
              >Create a Lab</v-btn>
            </div>
          </template>
          <span>Only the Administrator can create new lab.</span>
        </v-tooltip>
      </v-col>
      

      <v-dialog v-model="dialogNewLab" max-width="800px" :retain-focus="false">
        <v-card outlined>
          <v-card-title class="headline">Lab and PI/Manager information</v-card-title>

          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row>
              <v-col md="12" class="subtitle">
                <v-divider></v-divider>
                <h4 class="text-left">Lab information:</h4>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  height="48px"
                  background-color="textbackground"
                  hide-details
                  label="Lab's Name"
                  v-model="currentLab.LabName"
                  placeholder="  "
                  :rules="$rules.required"
                  outlined
                  dense
                ></v-text-field>
              </v-col>
              <v-col md="12" class="subtitle">
                <v-divider></v-divider>
                <h4 class="text-left">PI/Lab Manager information:</h4>
              </v-col>
              <v-col cols="12" md="4" v-for="item in this.$labPI" :key="item.label">
                <div v-if="item.options">
                  <v-select
                    justify="start"
                    :items="roleOptions"
                    v-model="currentLab.Personnels[0][item.field]"
                    :label="item.label"
                    hide-details
                    height="48px"
                    placeholder="  "
                    :rules="$rules[item.rules]"
                    outlined
                    dense
                    chip
                  ></v-select>
                </div>
                <div v-else>
                  <v-text-field
                    height="48px"
                    background-color="textbackground"
                    hide-details
                    :label="item.label"
                    v-model="currentLab.Personnels[0][item.field]"
                    placeholder="  "
                    :rules="$rules[item.rules]"
                    outlined
                    dense
                  ></v-text-field>
                </div>
              </v-col>
            </v-row>
          </v-form>

          <v-card-actions>
            <v-row justify="space-between" style="height: 50px">
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

      <v-dialog v-model="dialogEditLab" max-width="800px" :retain-focus="false">
        <v-card outlined>
          <v-card-title class="headline">Lab information</v-card-title>

          <v-form ref="formEdit" v-model="valid" lazy-validation>
            <v-row justify="space-around">
              <v-col cols="12" md="4">
                <v-text-field
                  height="48px"
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
            </v-row>
          </v-form>

          <v-card-actions>
            <v-row justify="space-between" style="height: 50px">
              <v-col md="3"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="closeEditLab">Cancel</v-btn>
              </v-col>
              <v-col md="2">
                <v-btn color="primary" @click="saveEditLab">Confirm</v-btn>
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
import externalAPIs from "@/services/externalAPIs";

export default {
  data() {
    return {
      password: null,
      newPassword: null,
      newPasswordVerify: null,
      dialog: false,
      changeTemporaryPassword: false,
      valid: true,
      dialogGoogle: false,
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
      roleOptions: ["PI", "Lab manager"],
    };
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

        alert("Your password is successfully changed!");
      } catch (error) {
        console.log(error.response);
      }
    },

    createNewLab() {
      this.dialogNewLab = true;
    },

    async saveNewLab() {
      var validationResults = this.$refs.form.validate();

      if (validationResults) {
        try {
          // const newLab = {
          //   LabName: "RHPCS",
          //   PI: "TP",
          //   Personnels: [
          //     {
          //       Name: "Todd Pfaff",
          //       Initial: "TP",
          //       Role: "PI",
          //       Email: "xiaon8@mcmaster.ca",
          //       Calendar: "xiaon8@mcmaster.ca",
          //     },
          //   ],
          // };

          this.currentLab.PI = this.currentLab.Personnels[0].Initial;

          await lab.create(this.currentLab);

          alert(
            "A new lab is created!\nPI's account is created! \nA sample study is created!"
          );
        } catch (error) {
          console.log(error.response);
        }
      }

      this.closeNewLab();
    },

    async saveEditLab() {
      var validationResults = this.$refs.formEdit.validate();

      if (validationResults) {
        try {
          await lab.update(this.editedLab);

          this.$store.dispatch("setLabName", this.editedLab.LabName);

          alert("Lab information is updated!");
        } catch (error) {
          console.log(error.response);
        }
      }

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

    closeNewLab() {
      this.dialogNewLab = false;
      setTimeout(() => {
        this.currentLab = {
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
        };
      }, 300);
    },

    closeEditLab() {
      this.dialogEditLab = false;
      setTimeout(() => {
        this.editedLab = {
          LabName: "",
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
  },
  computed: {
    passwordConfirmationRule() {
      return (
        this.newPassword === this.newPasswordVerify || "Password must match"
      );
    },

    newPasswordRule() {
      return (
        this.newPassword !== this.password ||
        "New password must be different from the current one."
      );
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
  },

  async mounted() {
    try {
      const profile = await externalAPIs.googleGetEmailAddress();

      this.labEmail = profile.data.labEmail;
      this.adminEmail = profile.data.adminEmail;

      this.$store.dispatch("setLabEmail", profile.data.labEmail);

      if (profile.data.labName != "") {
        this.$store.dispatch("setLabName", profile.data.labName);
      }
    } catch (error) {
      console.log(error.response);
    }
  },
};
</script>
