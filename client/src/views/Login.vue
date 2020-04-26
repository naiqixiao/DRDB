<template>
  <v-container fluid ma-0 pa-0>
    <v-row justify="center" align="center" style="height: 600px;">
      <v-col cols="12" lg="3">
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
    };
  },
  methods: {
    async login() {
      try {
        const response = await login.login({
          Email: this.email,
          Password: this.password,
        });
        this.$store.dispatch("setToken", response.data.token);
        this.$store.dispatch("setUser", response.data.user);
        this.$store.dispatch("setUserID", response.data.userID);
        this.$store.dispatch("setLab", response.data.lab);
        this.$store.dispatch("setStudies", response.data.studies);
        this.$router.push({
          name: "Family information",
        });
      } catch (error) {
        this.error = error.response.data.error;
      }
    },
  },
};
</script>

<style scoped></style>
