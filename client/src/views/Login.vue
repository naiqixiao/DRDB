<template>
  <v-row justify="center" align="center" style="height: 900px">
    <v-col cols="12" md="3">
      <v-form ref="formLogin" v-model="validLogin" lazy-validation>
        <v-text-field
          label="Email"
          :rules="this.$rules.email"
          v-model="email"
          clearable
        ></v-text-field>
        <br />
        <v-text-field
          label="Password"
          type="password"
          v-model="password"
          clearable
          @keydown.enter="login"
          :rules="this.$rules.required"
        ></v-text-field>
      </v-form>
    </v-col>
    <v-col cols="12" md="3">
      <div class="text-center">
        <v-btn
          rounded
          color="primary"
          large
          @click.stop="login"
          :disabled="!validLogin || !email"
          >Login</v-btn
        >
      </div>
      <div class="text-center" v-if="error">
        <br />
        <v-btn
          rounded
          color="primary"
          large
          @click="resetPassword"
          :disabled="!email"
          >Reset Password?</v-btn
        >
      </div>
    </v-col>
    <v-col cols="12" lg="12" class="d-flex align-end justify-end">
      <h4>V1.0.20210105</h4>
    </v-col>

    <v-dialog
      v-model="dialog"
      max-width="600px"
      :retain-focus="false"
      persistent
    >
      <v-card outlined>
        <v-card-title class="headline"
          >Welcome to the system! Please set your password.</v-card-title
        >
        <v-form ref="form" v-model="valid" lazy-validation>
          <v-row v-if="!changeTemporaryPassword" justify="center">
            <v-col cols="12" md="6" class="subtitle">
              <v-divider></v-divider>
              <h4 class="text-left">Current password:</h4>
              <v-text-field
                v-model="password"
                type="password"
                hide-details
                dense
              ></v-text-field>
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
                clearable
                hide-details
              ></v-text-field>
            </v-col>
          </v-row>
          <br />
          <v-row justify="center">
            <v-col cols="12" md="6" class="subtitle">
              <h4 class="text-left">Confirm password:</h4>
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
            <v-col md="2"></v-col>
            <v-col md="2">
              <v-btn color="primary" @click="dialog = false">Cancel</v-btn>
            </v-col>
            <v-col md="2">
              <v-btn
                color="primary"
                :disabled="
                  passwordConfirmationRule != true || newPassword == null
                "
                @click="changePassword"
                >Confirm</v-btn
              >
            </v-col>
            <v-col md="2"></v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import login from "@/services/login";
import externalAPIs from "@/services/externalAPIs";

export default {
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
          const KKK = await fetch("https://api.ipify.org/?format=json");

          var ip = await KKK.json();

          this.$store.dispatch("setIP", ip.ip);

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

          this.$store.dispatch("setEmailOpening", response.data.emailOpening);
          this.$store.dispatch("setEmailClosing", response.data.emailClosing);
          this.$store.dispatch("setLocation", response.data.location);
          this.$store.dispatch(
            "setTransportationInstructions",
            response.data.transportationInstructions
          );

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

          alert(error.response.data.error);
        }

        this.$store.dispatch("setLoadingStatus", false);
      }
    },

    async resetPassword() {
      if (this.email) {
        const KKK = await fetch("https://api.ipify.org/?format=json");

        var ip = await KKK.json();

        this.$store.dispatch("setIP", ip.ip);

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

        this.$store.dispatch("setEmailOpening", response.data.emailOpening);
        this.$store.dispatch("setEmailClosing", response.data.emailClosing);
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
      return (
        this.newPassword === this.newPasswordVerify || "Password must match"
      );
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
