<template>
  <v-app>
    <v-app-bar app color="primary" clipped-right>
      <v-app-bar-nav-icon
        x-large
        class="title-text ma-2"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>

      <v-toolbar-title class="mr-12 align-center">
        <h2 class="title-text title-p-4 ma-2">{{ this.$route.name }}</h2>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-toolbar-items align="end">
        <h2 class="title-text title ma-3">{{ this.$store.state.user }}</h2>
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

    <v-content>
      <router-view />
    </v-content>
  </v-app>
</template>

<script>
export default {
  name: "Header",
  watch: {
    group() {
      this.drawer = false;
    },
  },

  data() {
    return {
      drawer: false,
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
      this.$store.dispatch("setUserID", null);

      this.$router.push({
        name: "Login",
      });
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

.v-app-bar, .v-app-bar--clipped, .v-app-bar--fixed, .v-toolbar__content {
  height: 56px !important;
}
</style>
