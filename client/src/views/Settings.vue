<template>
  <v-row justify="center" align="center">
    <v-col cols="12" md="6">
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
            <v-col md="4"></v-col>
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
                >Confirm</v-btn
              >
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

export default {
  data() {
    return {
      password: null,
      newPassword: null,
      newPasswordVerify: null,
      dialog: false,
      changeTemporaryPassword: false,
      valid: true,
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
  },
};
</script>
