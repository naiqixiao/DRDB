<template>
  <v-app
    style="
       {
        background: $vuetify.theme.themes.light.secondary;
      }
    "
  >
    <Header />
  </v-app>
</template>

<script>
import Header from "./components/Header";
import login from "./services/login";

export default {
  name: "App",

  components: {
    Header,
  },

  watch: {
    group() {},
  },

  data() {
    return {};
  },
  methods: {
    // async deleteUpload() {
    //   await login.check_login();
    // },
    // beforePageDestroyed: function() {
    //   this.$store.dispatch("setToken", null);
    //   login.logout();
    // },
  },

  async created() {
    // window.addEventListener("beforeunload", (event) => {

    //   login.logout();

    //   this.$store.dispatch("setToken", null);

    //   // Cancel the event as stated by the standard.
    //   event.preventDefault();
    //   // Chrome requires returnValue to be set.
    //   event.returnValue = "";
    // });

    // window.addEventListener("beforeunload", this.beforePageDestroyed);

    try {
      await login.check_login();
      // console.log("User is already logged in.");
    } catch (error) {
      if (error.response.status === 401) {
        this.$store.dispatch("setToken", null);
        this.$store.dispatch("setUser", null);
        this.$store.dispatch("setUserID", null);

        alert("Authentication failed, please login.");

        if (this.$route.name != "Login") {
          this.$router.push({
            name: "Login",
          });
        }
      }
    }
  },
};
</script>