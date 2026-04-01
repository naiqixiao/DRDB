<template>
  <v-app :style="{ '--dynamic-bg': pageBackgroundColor }">
    <v-app-bar
      v-if="$route.name !== 'Login'"
      class="ds-header-gradient elevation-3"
      density="default"
      style="border-radius: 12px; margin: 8px 16px 0 16px; max-width: calc(100% - 32px)"
    >
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title class="title-text">
        <h2 class="text-h5 font-weight-bold ma-2">{{ $route.name }}</h2>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <template v-if="store.user != null">
        <span class="title-text text-subtitle-1 font-weight-medium mr-4">
          {{ store.labName + ": " + store.name + " (" + store.role + ")" }}
        </span>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" @click.stop="feedbackDialog = true">
              <v-icon>mdi-message-alert</v-icon>
            </v-btn>
          </template>
          <span>Send us your questions, issues, requests, and suggestions!</span>
        </v-tooltip>
        <v-switch
          :model-value="!!store.trainingMode"
          color="white"
          inset
          :label="store.trainingMode ? 'Training Mode' : 'Working Mode'"
          hide-details
          @update:model-value="changeTrainingMode"
          class="training-switch ml-4 mr-2"
          density="compact"
        ></v-switch>
      </template>

      <v-progress-linear
        :active="store.loadingStatus"
        :indeterminate="store.loadingStatus"
        height="5"
        absolute
        location="bottom"
        color="secondary"
      ></v-progress-linear>
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
              <v-text-field
                v-model="currentFeedback.Title"
                label="Title"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="10" md="10">
              <v-textarea
                v-model="currentFeedback.Content"
                label="Content"
                variant="outlined"
                rows="6"
              ></v-textarea>
            </v-col>
          </v-row>
        </v-container>

        <v-card-actions>
          <v-row justify="space-between" style="height: 50px">
            <v-col md="4"></v-col>
            <v-col md="2">
              <v-btn color="primary" variant="elevated" @click="closeFeedback"
                >Cancel</v-btn
              >
            </v-col>
            <v-col md="2">
              <v-btn
                color="primary"
                variant="elevated"
                @click="createFeedback"
                :disabled="currentFeedback.Title === '' || currentFeedback.Content === ''"
                >Send</v-btn
              >
            </v-col>
            <v-col md="4"></v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-if="$route.name !== 'Login'"
      v-model="drawer"
      temporary
      width="300"
      class="drawer-container"
    >
      <!-- User Section -->
      <div class="drawer-header pa-5">
        <v-avatar size="64" color="white" class="mb-4 elevation-2">
          <v-icon size="36" color="primary">mdi-account-circle</v-icon>
        </v-avatar>
        <div
          class="text-h6 font-weight-bold mb-1"
          style="color: primary; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3)"
        >
          {{ store.name }}
        </div>
        <div class="text-body-2 mb-3" style="color: primary">
          {{ store.labName }}
        </div>
      </div>

      <!-- Navigation Items -->
      <div class="drawer-nav-section">
        <v-list class="pa-3" bg-color="transparent">
          <v-list-item
            v-for="nav in navs.filter((n) => n.address !== '/')"
            :key="nav.label"
            :to="nav.address"
            class="nav-card mb-2"
            @click="drawer = false"
            :class="{ 'nav-card-active': nav.address === $route.path }"
            :style="
              nav.address === $route.path
                ? {
                    background: `linear-gradient(90deg, ${getNavBackgroundColor(
                      nav.address
                    )} 0%, white 100%)`,
                    'border-left': `4px solid ${getNavAccentColor(nav.address)}`,
                  }
                : {}
            "
          >
            <template v-slot:prepend>
              <v-avatar
                size="40"
                :color="
                  nav.address === $route.path
                    ? getNavAccentColor(nav.address)
                    : 'grey-lighten-2'
                "
                class="nav-icon-avatar"
              >
                <v-icon
                  size="20"
                  :color="nav.address === $route.path ? 'white' : 'grey-darken-1'"
                  >{{ nav.icon }}</v-icon
                >
              </v-avatar>
            </template>
            <v-list-item-title
              class="nav-title"
              :style="
                nav.address === $route.path
                  ? { color: getNavAccentColor(nav.address) }
                  : {}
              "
              >{{ nav.label }}</v-list-item-title
            >
          </v-list-item>
        </v-list>
      </div>

      <template v-slot:append>
        <div class="pa-4">
          <v-btn
            block
            variant="outlined"
            color="error"
            prepend-icon="mdi-logout"
            @click="logout"
            :disabled="!store.userID"
            class="logout-btn"
            size="large"
          >
            Sign Out
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-main style="padding-top: 72px">
      <router-view :training="store.trainingMode" />
    </v-main>
  </v-app>
</template>

<script>
import feedback from "@/services/feedback";
import login from "@/services/login";
import { useMainStore } from "@/stores/mainStore";

export default {
  name: "App",
  setup() {
    const store = useMainStore();
    return { store };
  },
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
        {
          address: "/appointment",
          label: "Study appointments",
          icon: "mdi-format-list-bulleted-square",
        },
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
      this.store.clearAll();

      if (this.$route.name !== "Login") {
        this.$router.push({ name: "Login" });
      }
    },

    async createFeedback() {
      this.currentFeedback.CreatedBy = this.store.userID;
      this.currentFeedback.CurrentPage = this.$route.name;
      this.currentFeedback.Email = this.store.user;

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
      this.store.setTrainingMode(!this.store.trainingMode);
    },

    getNavBackgroundColor(navAddress) {
      // Map addresses to their page names
      const addressToPageName = {
        "/home": "Home",
        "/family": "Family information",
        "/schedule": "Schedule studies",
        "/appointment": "Study appointments",
        "/study": "Study management",
        "/personnel": "Personnel management",
        "/settings": "Settings",
      };

      const pageName = addressToPageName[navAddress];

      switch (pageName) {
        case "Family information":
          return "#BFDBFE"; // Richer blue
        case "Schedule studies":
          return "#FDE68A"; // Richer amber
        case "Study appointments":
          return "#A7F3D0"; // Richer emerald
        case "Study management":
          return "#DDD6FE"; // Richer violet
        case "Personnel management":
        case "Settings":
          return "#CBD5E1"; // Richer slate
        case "Home":
        default:
          return "#E5E5E5"; // Default gray
      }
    },

    getNavAccentColor(navAddress) {
      // Return a slightly darker/saturated version for borders and icons
      const addressToPageName = {
        "/home": "Home",
        "/family": "Family information",
        "/schedule": "Schedule studies",
        "/appointment": "Study appointments",
        "/study": "Study management",
        "/personnel": "Personnel management",
        "/settings": "Settings",
      };

      const pageName = addressToPageName[navAddress];

      switch (pageName) {
        case "Family information":
          return "#3B82F6"; // Blue
        case "Schedule studies":
          return "#F59E0B"; // Amber
        case "Study appointments":
          return "#10B981"; // Emerald
        case "Study management":
          return "#8B5CF6"; // Violet
        case "Personnel management":
        case "Settings":
          return "#64748B"; // Slate
        case "Home":
        default:
          return "#4285F4"; // Default blue
      }
    },
  },

  computed: {
    pageBackgroundColor() {
      switch (this.$route.name) {
        case "Family information":
          return "#F0F9FF"; // Very pale blue
        case "Schedule studies":
          return "#FFFBEB"; // Very pale amber
        case "Study appointments":
          return "#F0FDF4"; // Very pale emerald
        case "Study management":
          return "#F5F3FF"; // Very pale violet
        case "Personnel management":
          return "#F8FAFC"; // Very light slate blue-grey
        case "Settings":
          return "#F8FAFC"; // Very pale slate
        case "Home":
        case "Login":
        default:
          return "var(--ds-field-bg)"; // Default pale gray
      }
    },
  },

  watch: {
    feedbackDialog(val) {
      val || this.closeFeedback();
    },
  },

  async created() {
    // Handle OAuth callback — detect if we landed here from a Google redirect
    if (window.location.pathname === "/oauth/callback") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (code && window.opener) {
        // Send the code back to the Settings page that opened this window
        window.opener.postMessage(
          { type: "GOOGLE_OAUTH_CODE", code: code },
          window.location.origin
        );
        // Replace page content with a success message
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;"><div><div style="font-size:56px;margin-bottom:16px;">✅</div><h2>Authentication Successful!</h2><p style="color:#666;margin-top:8px;">This window will close automatically...</p></div></div>';
        setTimeout(() => {
          window.close();
        }, 2000);
        return; // Don't proceed with normal app flow
      } else if (code) {
        // No opener — show code for manual copy
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;"><div><div style="font-size:56px;margin-bottom:16px;">⚠️</div><h2>Almost Done</h2><p style="color:#666;margin-top:8px;">Please copy this code and paste it in the Settings page:</p><div style="background:#f0f0f0;border-radius:6px;padding:12px;margin-top:16px;word-break:break-all;font-family:monospace;font-size:13px;">' +
          code +
          "</div></div></div>";
        return;
      } else if (error) {
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;"><div><div style="font-size:56px;margin-bottom:16px;">❌</div><h2 style="color:#d32f2f;">Authentication Failed</h2><p style="color:#666;margin-top:8px;">' +
          error +
          "</p></div></div>";
        return;
      }
    }

    try {
      await login.check_login();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.store.clearAll();

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
  font-size: 1rem;
}

.nav-list .v-list-item-title {
  font-size: 1rem !important;
  font-weight: 500;
  font-family: var(--ds-font-family-body) !important;
}

/* Navigation Drawer Enhancements */
.drawer-container {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%) !important;
}

.drawer-header {
  background: linear-gradient(
    135deg,
    var(--v-theme-primary) 0%,
    var(--v-theme-secondary) 100%
  );
  position: relative;
  overflow: hidden;
}

.drawer-header::before {
  content: "";
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.drawer-nav-section {
  overflow-y: auto;
  flex: 1;
}

.nav-card {
  background: white !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
  border: 1px solid rgba(0, 0, 0, 0.04) !important;
  cursor: pointer;
}

.nav-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
}

.nav-card-active {
  padding-left: 13px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

.nav-card-active:hover {
  padding-left: 13px !important;
}

.nav-icon-avatar {
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-card:hover .nav-icon-avatar {
  transform: scale(1.1);
}

.nav-title {
  font-size: 0.95rem !important;
  font-weight: 500 !important;
  font-family: var(--ds-font-family-body) !important;
  color: #334155 !important;
  letter-spacing: 0.01em;
}

.nav-card-active .nav-title {
  font-weight: 600 !important;
}

.logout-btn {
  border-radius: 10px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0.02em;
  transition: all 0.3s ease !important;
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.2) !important;
}

.active-nav-item {
  background-color: rgba(var(--v-theme-primary-darken-1), 0.08) !important;
  border-left: 3px solid var(--v-theme-primary) !important;
}
</style>
