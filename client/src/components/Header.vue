<template>
  <v-app>
    <v-app-bar app color="primary" clipped-right>
      <v-app-bar-nav-icon x-large class="title-text ma-2" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title class="mr-12 align-center">
        <h2 class="title-text title-p-4 ma-2">{{ this.$route.name }}</h2>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-toolbar-items v-if="this.$store.state.user != null" align="end">
        <h2
          class="title-text title ma-3"
        >{{ $store.state.labName + ": " +$store.state.name + ' ('+ $store.state.role + ')' }}</h2>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-btn icon @click.stop="feedbackDialog = true">
                <v-icon>feedback</v-icon>
              </v-btn>
            </div>
          </template>
          <span>Send us your questions, issues, requests, and suggestions!</span>
        </v-tooltip>
      </v-toolbar-items>
    </v-app-bar>

    <v-navigation-drawer app v-model="drawer" temporary width="300" clipped>
      <v-list dense>
        <v-list-item
          v-for="nav in navs"
          :key="nav.label"
          :to="nav.address"
          @click="pageTitle = nav.label"
        >
          <v-list-item-action>
            <v-icon>{{ nav.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item>{{ nav.label }}</v-list-item>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn block @click="logout">Logout</v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-dialog v-model="feedbackDialog" max-width="800px" :retain-focus="false">
      <v-card outlined>
        <v-card-title>
          <span class="headline">Send us your questions and suggestions!</span>
        </v-card-title>

        <v-container>
          <v-row>
            <v-col cols="12" sm="10" md="10">
              <v-text-field v-model="currentFeedback.Title" label="Title"></v-text-field>
            </v-col>
            <v-col cols="12" sm="10" md="10">
              <vue-editor
                ref="feedbackContent"
                v-model="currentFeedback.Content"
                :editor-toolbar="customToolbar"
              ></vue-editor>
            </v-col>
          </v-row>
        </v-container>

        <v-card-actions>
          <v-row justify="space-between" style="height: 50px">
            <v-col md="4"></v-col>
            <v-col md="2">
              <v-btn color="primary" @click="feedbackDialog = false">Cancel</v-btn>
            </v-col>
            <v-col md="2">
              <v-btn
                color="primary"
                @click="createFeedback"
                :disabled="currentFeedback.Title == '' || currentFeedback.Content == ''"
              >Send</v-btn>
            </v-col>
            <v-col md="4"></v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import { VueEditor } from "vue2-editor";
import feedback from "@/services/feedback";

export default {
  name: "Header",
  components: {
    VueEditor,
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
      customToolbar: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }, { background: [] }],
        // ["image", "code-block"]
      ],
      navs: [
        {
          address: "/",
          label: "Home",
          icon: "home",
        },
        {
          address: "/family",
          label: "Family information",
          icon: "face",
        },
        {
          address: "/schedule",
          label: "Schedule studies",
          icon: "phone",
        },
        {
          address: "/appointment",
          label: "Study appointments",
          icon: "mdi-format-list-bulleted-square",
        },
        {
          address: "/study",
          label: "Study management",
          icon: "description",
        },
        {
          address: "/personnel",
          label: "Personnel management",
          icon: "perm_identity",
        },

        {
          address: "/settings",
          label: "Settings",
          icon: "dashboard",
        },
        {
          address: "/login",
          label: "Login",
          icon: "fingerprint",
        },
      ],
    };
  },

  methods: {
    logout() {
      this.$store.dispatch("setToken", null);
      this.$store.dispatch("setUser", null);
      this.$store.dispatch("setName", null);
      this.$store.dispatch("setUserID", null);
      this.$store.dispatch("setLabEmail", null);
      this.$store.dispatch("setLabName", null);
      this.$store.dispatch("setRole", null);
      this.$store.dispatch("setStudies", null);

      this.$store.dispatch("setLabEmailStatus", null);
      this.$store.dispatch("setAdminEmailStatus", null);
      this.$router.push({
        name: "Login",
      });
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
  },

  watch: {
    group() {
      this.drawer = false;
    },
    feedbackDialog(val) {
      val || this.closeFeedback();
    },
  },
};
</script>

<style lang="scss">
.v-navigation-drawer--temporary.v-navigation-drawer--clipped {
  z-index: 3;
  padding-top: 56px;
}

.title-text {
  color: var(--v-secondary-base) !important;
}

.v-app-bar,
.v-app-bar--clipped,
.v-app-bar--fixed,
.v-toolbar__content {
  height: 56px !important;
}
</style>
