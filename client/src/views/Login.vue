<template>
  <v-row justify="center" align="center" style="height: 600px;">
    <v-col cols="12" lg="3">
      <v-text-field label="Email" :rules="this.$rules.email" v-model="email" clearable></v-text-field>
      <br />
      <v-text-field
        label="Password"
        type="password"
        v-model="password"
        clearable
        @keydown.enter="login"
      ></v-text-field>
      <br />
      <div class="danger-alert" v-html="error" />
      <v-btn rounded color="primary" v-if="error" @click="resetPassword">Forgot Password?</v-btn>
      <br />
      <div class="text-center">
        <v-btn rounded color="primary" @click.stop="login">Login</v-btn>
      </div>
    </v-col>

    <v-dialog v-model="dialog" max-width="600px" :retain-focus="false">
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
            <v-col md="4"></v-col>
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
              >Confirm</v-btn>
            </v-col>
            <v-col md="4"></v-col>
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
    };
  },
  methods: {
    async login() {
      try {
        const response = await login.login({
          Email: this.email,
          Password: this.password,
        });

        if (response.data.temporaryPassword) {
          // reset password
          this.changeTemporaryPassword = response.data.temporaryPassword;
          this.$store.dispatch("setToken", response.data.token);

          this.dialog = true;
        } else {
          this.$store.dispatch("setToken", response.data.token);
          this.$store.dispatch("setUser", response.data.user);
          this.$store.dispatch("setName", response.data.name);
          this.$store.dispatch("setUserID", response.data.userID);
          this.$store.dispatch("setLab", response.data.lab);
          this.$store.dispatch("setStudies", response.data.studies);
          this.$store.dispatch("setRole", response.data.role);
          this.$store.dispatch("setLabEmail", response.data.labEmail);
          this.$store.dispatch("setLabName", response.data.labName);

          const profile = await externalAPIs.googleGetEmailAddress();

          var labEmail = profile.data.labEmail;
          var adminEmail = profile.data.adminEmail;

          if (labEmail) {
            // this.$store.dispatch("setLabEmail", labEmail);
            this.$store.dispatch("setLabEmailStatus", true);
          }
          if (adminEmail) {
            this.$store.dispatch("setAdminEmailStatus", true);
          }

          this.$router.push({
            name: "Family information",
          });
        }
      } catch (error) {
        this.error = error.response.data.error;
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
            "Your password is reset, please find the temporary passowrd in your email inbox."
          );
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

        this.close();

        this.$store.dispatch("setToken", response.data.token);
        this.$store.dispatch("setUser", response.data.user);
        this.$store.dispatch("setUserID", response.data.userID);
        this.$store.dispatch("setLab", response.data.lab);
        this.$store.dispatch("setStudies", response.data.studies);

        alert("Your password is set! Welcome!");

        this.$router.push({
          name: "Family information",
        });
      } catch (error) {
        console.log(error.response);
      }
    },

    close() {
      this.dialog = false;
      setTimeout(() => {
        this.$store.dispatch("setToken", null);
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
