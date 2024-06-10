<template>
  <v-container>
    <v-row justify="center" align="center" style="padding: 40px">
      <v-col cols="12" md="3">
        <v-form ref="formLogin" v-model="validLogin" lazy-validation style="padding: 20px">
          <v-text-field label="Email" :rules="this.$rules.email" v-model="email" clearable></v-text-field>
          <br />
          <v-text-field label="Password" type="password" v-model="password" clearable @keydown.enter="login"
            :rules="this.$rules.required"></v-text-field>
        </v-form>
      </v-col>
      <v-col cols="12" md="3">
        <div class="text-center">
          <v-btn rounded color="primary" large @click.stop="login" :disabled="!validLogin || !email">Login</v-btn>
        </div>
        <div class="text-center" v-if="error">
          <br />
          <v-btn rounded color="primary" large @click="resetPassword" :disabled="!email">Reset Password?</v-btn>
        </div>
      </v-col>
      <v-col cols="12" lg="12" >
        <h3 style="padding: 20px">
          If this is your first time using the system, please visit
          <a href="https://mcmaster-baby-lab.github.io/handbook/DRDB" target='_blank'>this site to learn some
            basics.</a>
        </h3>
      </v-col>
      
      <v-col cols="12" lg="12">
        <div >
          <HistogramChart />
        </div>
      </v-col>

      <v-col cols="12" lg="12" class="d-flex align-center justify-center">
        <v-card outlined elevation="3" style="height: 462px; overflow-y: scroll !important">
          <div align="start" v-html="releaseNote" style="margin: 36px"></div>
        </v-card>
      </v-col>

      <v-dialog v-model="dialog" max-width="600px" :retain-focus="false" persistent>
        <v-card outlined>
          <v-card-title class="headline">Welcome to the system! Please set your password.</v-card-title>
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
                <v-text-field v-model="newPassword" type="password" clearable hide-details></v-text-field>
              </v-col>
            </v-row>
            <br />
            <v-row justify="center">
              <v-col cols="12" md="6" class="subtitle">
                <h4 class="text-left">Confirm password:</h4>
                <v-text-field v-model="newPasswordVerify" clearable type="password"
                  :rules="[passwordConfirmationRule]"></v-text-field>
              </v-col>
            </v-row>
          </v-form>

          <v-card-actions>
            <v-row justify="space-between" style="height: 50px">
              <v-col md="2"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="dialog = false">Cancel</v-btn>
              </v-col>
              <v-col md="2">
                <v-btn color="primary" :disabled="passwordConfirmationRule != true || newPassword == null"
                  @click="changePassword">Confirm</v-btn>
              </v-col>
              <v-col md="2"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>
    <v-row justify="center">
      <v-col cols="12" md="6">
        <v-alert type="error" dismissible v-model="error" border="left" elevation="2">
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import login from "@/services/login";
import testingRoom from "@/services/testingRoom";
import externalAPIs from "@/services/externalAPIs";
import HistogramChart from '@/components/HistogramChart.vue';
// import {releaseNote} from '@/assets/releaseNote.html';

export default {
  components: {
    HistogramChart
  },
  data() {
    return {
      email: null,
      password: null,
      newPassword: null,
      newPasswordVerify: null,
      error: null,
      dialog: false,
      changeTemporaryPassword: false,
      valid: true,
      validLogin: false,
    };
  },
  methods: {
    async login() {
      var validationResults = this.$refs.formLogin.validate();

      if (validationResults) {
        this.$store.dispatch("setLoadingStatus", true);
        try {
          // const KKK = await fetch("https://api.ipify.org/?format=json");

          // var ip = await KKK.json();

          // this.$store.dispatch("setIP", ip.ip);

          const response = await login.login({
            Email: this.email,
            Password: this.password,
          });

          this.error = null;

          this.$store.dispatch("setToken", response.data.token);
          this.$store.dispatch("setUser", response.data.user);
          this.$store.dispatch("setName", response.data.name);
          this.$store.dispatch("setUserID", response.data.userID);
          this.$store.dispatch("setLab", response.data.lab);
          this.$store.dispatch("setStudies", response.data.studies);
          this.$store.dispatch("setRole", response.data.role);
          this.$store.dispatch("setLabEmail", response.data.labEmail);
          this.$store.dispatch("setLabName", response.data.labName);
          this.$store.dispatch("setTimeZone", response.data.timeZone);
          this.$store.dispatch("setZoomLink", response.data.ZoomLink);

          this.$store.dispatch("setEmailOpening", response.data.emailOpening);
          this.$store.dispatch("setEmailClosing", response.data.emailClosing);
          this.$store.dispatch("setTYEmailClosing", response.data.TYEmail);
          this.$store.dispatch("setLocation", response.data.location);
          this.$store.dispatch(
            "setTransportationInstructions",
            response.data.transportationInstructions
          );
          const testingRooms = await testingRoom.search(this.$store.state.lab);
          this.$store.dispatch("setTestingRooms", testingRooms.data);

          if (response.data.temporaryPassword) {
            // reset password
            this.changeTemporaryPassword = response.data.temporaryPassword;

            this.dialog = true;
          } else {
            const profile = await externalAPIs.googleGetEmailAddress();

            if (profile.data.labEmail) {
              // var labEmail = profile.data.labEmail;
              // this.$store.dispatch("setLabEmail", labEmail);
              this.$store.dispatch("setLabEmailStatus", true);
            }

            if (profile.data.adminEmail) {
              // var adminEmail = profile.data.adminEmail;
              this.$store.dispatch("setAdminEmailStatus", true);
            }

            this.$router.push({
              name: "Family information",
            });
          }
        } catch (error) {
          this.error = error.response.data.error;

          switch (error.response.status) {
            case 500:
            case 502:
              alert(
                "Calm down....\n\nThe backend server is not running properly.\n\nAsk the administor to fix this issue."
              );
              break;
          }
        }

        this.$store.dispatch("setLoadingStatus", false);
      }
    },

    async resetPassword() {
      if (this.email) {
        try {
          await login.resetPassword({
            Email: this.email,
          });

          this.error = null;
          alert(
            "Your password is reset, please find the temporary passowrd in your email (" +
            this.email +
            ") inbox."
          );
          this.email = null;
          this.password = null;
          this.error = null;
        } catch (error) {
          this.error = error.response.data.error;
        }
      } else {
        alert("enter your email to reset password.");
      }
    },

    async changePassword() {
      try {
        const response = await login.changePassword({
          Email: this.email,
          Password: this.password,
          newPassword: this.newPassword,
        });

        this.error = null;

        this.$store.dispatch("setToken", response.data.token);
        this.$store.dispatch("setUser", response.data.user);
        this.$store.dispatch("setName", response.data.name);
        this.$store.dispatch("setUserID", response.data.userID);
        this.$store.dispatch("setLab", response.data.lab);
        this.$store.dispatch("setStudies", response.data.studies);
        this.$store.dispatch("setRole", response.data.role);
        this.$store.dispatch("setLabEmail", response.data.labEmail);
        this.$store.dispatch("setLabName", response.data.labName);
        this.$store.dispatch("setTimeZone", response.data.timeZone);
        this.$store.dispatch("setTrainingMode", false);

        this.$store.dispatch("setEmailOpening", response.data.emailOpening);
        this.$store.dispatch("setEmailClosing", response.data.emailClosing);
        this.$store.dispatch("setTYEmailClosing", response.data.TYEmail);
        this.$store.dispatch("setLocation", response.data.location);
        this.$store.dispatch(
          "setTransportationInstructions",
          response.data.transportationInstructions
        );
        this.$store.dispatch("setZoomLink", response.data.ZoomLink);

        const profile = await externalAPIs.googleGetEmailAddress();

        if (profile.data.labEmail) {
          // var labEmail = profile.data.labEmail;
          // this.$store.dispatch("setLabEmail", labEmail);
          this.$store.dispatch("setLabEmailStatus", true);
        }

        if (profile.data.adminEmail) {
          // var adminEmail = profile.data.adminEmail;
          this.$store.dispatch("setAdminEmailStatus", true);
        }

        this.changeTemporaryPassword = false;

        alert("Your password is set! \nWelcome!");

        this.close();

        this.$router.push({
          name: "Family information",
        });
      } catch (error) {
        console.log(error);
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
  },

  computed: {
    passwordConfirmationRule() {
      return this.newPassword === this.newPasswordVerify || "Password must match";
    },

    releaseNote() {
      const releaseNote =
        "<html><head><title>Release Notes</title></head><h1>Release Notes (V1.2.20240610)</h1><body><h2>Recruitment history stats are available</h2><h1>Release Notes (V1.2.20240122)</h1><body><h2>Schedule Appointments Enhancements</h2><ul><li><strong>Partial Update Feature</strong>: Capability to modify individual appointments within a schedule, beneficial for scheduling subsequent visits.</li><li><strong>Direct Reschedule Functionality</strong>: Directly reschedule appointments to a new date and time, ideal for specific rescheduling needs.</li><li><strong>Multiple Studies Per Visit</strong>: Supports booking multiple studies per visit, with each represented as separate Google Calendar events.</li></ul><h2>Testing Rooms Feature</h2><ul><li>Create testing rooms via the Settings page, each linked to an independent Google Calendar.</li><li>Associate studies with a testing room on the Study Management page; appointments will appear in the relevant Google Calendar.</li><li>Default to the main calendar if no specific testing room is set up.</li></ul><h2>Email System Enhancements</h2><ul><li><strong>Email Tags</strong>: Organize emails by study name. Automatic in Gmail, manual format #%#study.name#%# for others.</li><li><strong>Email Templates</strong>: New follow-up and reschedule email templates accessible via the Mail icon on scheduling pages.</li><li><strong>Reminder Emails</strong>: Daily reminders for schedule follow-up and study completion.</li></ul><h2>Daily Database Updates</h2><ul><li><strong>Study Completion</strong>: Automatic marking of appointments as Completed based on specific criteria.</li><li><strong>Family Release</strong>: Release families from a lab when associated study appointment is marked as Completed.</li></ul><h2>New User Interface</h2><p>A new user interface for scheduling studies. Explore through the <a href='https://gentle-pithivier-6d0847.netlify.app'>DRDB scheduling demo</a>.</p><h2>Performance Improvements and Bug Fixes</h2><p>Various system enhancements and bug fixes to improve performance and functionality.</p></body></html>";

      return releaseNote;
    },
  },

  watch: {
    dialog(val) {
      val || this.close();
    },
  },
};
</script>

<style scoped></style>
