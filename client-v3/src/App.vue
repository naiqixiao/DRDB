<template>
  <v-app>
    <v-app-bar v-if="$route.name !== 'Login'" class="ds-header-gradient elevation-1" density="default">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title class="title-text">
        <h2 class="text-h6 ma-2">{{ $route.name }}</h2>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <template v-if="$store.state.user != null">
        <span class="title-text text-body-2 mr-4">
          {{
            $store.state.labName +
            ": " +
            $store.state.name +
            " (" +
            $store.state.role +
            ")"
          }}
        </span>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" @click.stop="feedbackDialog = true">
              <v-icon>mdi-message-alert</v-icon>
            </v-btn>
          </template>
          <span>Send us your questions, issues, requests, and suggestions!</span>
        </v-tooltip>
        <v-switch :model-value="!!$store.state.trainingMode" color="white" inset
          :label="$store.state.trainingMode ? 'Training Mode' : 'Working Mode'" hide-details
          @update:model-value="changeTrainingMode" class="training-switch ml-4 mr-2" density="compact"></v-switch>
      </template>

      <v-progress-linear :active="$store.state.loadingStatus" :indeterminate="$store.state.loadingStatus" height="5"
        absolute location="bottom" color="secondary"></v-progress-linear>
    </v-app-bar>

    <!-- Feedback Dialog -->
    <v-dialog v-model="feedbackDialog" max-width="800px" :retain-focus="false" persistent>
      <v-card class="ds-card" variant="flat">
        <v-card-title>
          <span class="text-h5">Send us your questions and suggestions!</span>
        </v-card-title>

        <v-container>
          <v-row>
            <v-col cols="12" sm="10" md="10">
              <v-text-field v-model="currentFeedback.Title" label="Title" variant="outlined"></v-text-field>
            </v-col>
            <v-col cols="12" sm="10" md="10">
              <v-textarea v-model="currentFeedback.Content" label="Content" variant="outlined" rows="6"></v-textarea>
            </v-col>
          </v-row>
        </v-container>

        <v-card-actions>
          <v-row justify="space-between" style="height: 50px">
            <v-col md="4"></v-col>
            <v-col md="2">
              <v-btn color="primary" variant="elevated" @click="closeFeedback">Cancel</v-btn>
            </v-col>
            <v-col md="2">
              <v-btn color="primary" variant="elevated" @click="createFeedback"
                :disabled="currentFeedback.Title === '' || currentFeedback.Content === ''">Send</v-btn>
            </v-col>
            <v-col md="4"></v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Navigation Drawer -->
    <v-navigation-drawer v-if="$route.name !== 'Login'" v-model="drawer" temporary width="300">
      <v-list density="default" nav class="nav-list">
        <v-list-item v-for="nav in navs" :key="nav.label" :to="nav.address" :prepend-icon="nav.icon" :title="nav.label"
          @click="drawer = false"></v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn block @click="logout" :disabled="!$store.state.userID">Logout</v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-main style="background-color: var(--ds-field-bg);">
      <router-view :training="$store.state.trainingMode" />
    </v-main>
  </v-app>
</template>

<script>
import feedback from "@/services/feedback";
import login from "@/services/login";

export default {
  name: "App",
  data() {
    return {
      drawer: false,
      feedbackDialog: false,
      currentFeedback: {
        Title: "",
        Content: "",
        CurrentPage: "",
        CreatedBy: "",
      },
      navs: [
        { address: "/home", label: "Home", icon: "mdi-home" },
        { address: "/family", label: "Family information", icon: "mdi-face-man" },
        { address: "/schedule", label: "Schedule studies", icon: "mdi-phone" },
        { address: "/appointment", label: "Study appointments", icon: "mdi-format-list-bulleted-square" },
        { address: "/study", label: "Study management", icon: "mdi-file-document" },
        { address: "/personnel", label: "Personnel management", icon: "mdi-account" },
        { address: "/settings", label: "Settings", icon: "mdi-cog" },
        { address: "/", label: "Login", icon: "mdi-fingerprint" },
      ],
    };
  },

  methods: {
    logout() {
      console.log("log out complete!");
      this.$store.dispatch("setToken", null);
      this.$store.dispatch("setUser", null);
      this.$store.dispatch("setName", null);
      this.$store.dispatch("setUserID", null);
      this.$store.dispatch("setStudies", null);
      this.$store.dispatch("setLoadingStatus", false);
      this.$store.dispatch("setEmailOpening", null);
      this.$store.dispatch("setEmailClosing", null);
      this.$store.dispatch("setTYEmailClosing", null);
      this.$store.dispatch("setLocation", null);
      this.$store.dispatch("setTransportationInstructions", null);
      this.$store.dispatch("setZoomLink", null);

      if (this.$route.name !== "Login") {
        this.$router.push({ name: "Login" });
      }
    },

    async createFeedback() {
      this.currentFeedback.CreatedBy = this.$store.state.userID;
      this.currentFeedback.CurrentPage = this.$route.name;
      this.currentFeedback.Email = this.$store.state.user;

      try {
        await feedback.create(this.currentFeedback);
        this.closeFeedback();
      } catch (error) {
        console.log(error.response);
      }
    },

    closeFeedback() {
      this.feedbackDialog = false;
      setTimeout(() => {
        this.currentFeedback.Title = "";
        this.currentFeedback.Content = "";
        this.currentFeedback.CreatedBy = "";
        this.currentFeedback.CurrentPage = "";
        this.currentFeedback.Email = "";
      }, 300);
    },

    changeTrainingMode() {
      this.$store.dispatch("setTrainingMode", !this.$store.state.trainingMode);
    },
  },

  watch: {
    feedbackDialog(val) {
      val || this.closeFeedback();
    },
  },

  async created() {
    try {
      await login.check_login();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.$store.dispatch("setToken", null);
        this.$store.dispatch("setUser", null);
        this.$store.dispatch("setUserID", null);

        if (this.$route.name !== "Login") {
          this.$router.push({ name: "Login" });
        }
      }
    }
  },
};
</script>

<style>
.title-text {
  color: var(--v-theme-secondary) !important;
  font-family: var(--ds-font-family-heading) !important;
  font-weight: 600;
}

.title-text h2 {
  font-family: var(--ds-font-family-heading) !important;
}

.training-switch .v-label {
  color: var(--v-theme-secondary) !important;
  font-family: var(--ds-font-family-body) !important;
  font-size: 0.85rem;
}

.nav-list .v-list-item-title {
  font-size: 1rem !important;
  font-weight: 500;
  font-family: var(--ds-font-family-body) !important;
}
</style>
