<template>
  <v-container fluid ma-0 pa-0 >
    <v-row justify="center" align="center" style="height: 600px;">
      <v-col cols="12" lg="3">
        <v-text-field
          label="Email"
          :rules="[rules.required, rules.email]"
          v-model="email"
          color="teal"
          clearable
        ></v-text-field>
        <br />
        <v-text-field
          label="Password"
          type="password"
          v-model="password"
          color="teal"
          clearable
          @keydown.enter="login"
        ></v-text-field>
        <br />
        <div class="danger-alert" v-html="error" />
        <br />
        <div class="text-center">
          <v-btn rounded color="teal" @click="login">Login</v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import login from "@/services/login";

export default {
  data() {
    return {
      email: "",
      password: "",
      error: null,
      rules: {
        required: value => !!value || "Required.",
        counter: value => value.length <= 20 || "Max 20 characters",
        email: value => {
          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return pattern.test(value) || "Invalid e-mail.";
        }
      }
    };
  },
  methods: {
    async login() {
      try {
        const response = await login.login({
          Email: this.email,
          Password: this.password
        });
        this.$store.dispatch("setToken", response.data.token);
        this.$store.dispatch("setUser", response.data.user);
        this.$store.dispatch("setUserID", response.data.userID);
        this.$store.dispatch("setLab", response.data.lab);
        this.$store.dispatch("setStudies", response.data.studies);
        this.$router.push({
          name: "Family"
        });
      } catch (error) {
        this.error = error.response.data.error;
      }
    }
  }
};
</script>

<style scoped></style>
