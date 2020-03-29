<template>
  <div>
    <v-navigation-drawer v-model="drawer" absolute temporary width="200">
      <v-list nav dense>
        <v-list-item
          v-for="nav in navs"
          :key="nav.label"
          router
          :to="nav.address"
        >
          <v-list-item-action>
            <v-icon>{{ nav.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item>{{ nav.label }}</v-list-item>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="teal" clipped-right dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title class="mr-12 align-center">
        <span class="title">Title</span>
      </v-toolbar-title>
    </v-app-bar>

    <v-content>
      <router-view />
    </v-content>
  </div>
</template>

<script>
export default {
  name: "Header",
  watch: {
    group() {
      this.drawer = false;
    }
  },

  data() {
    return {
      drawer: false,
      navs: [
        {
          address: "/",
          label: "Home",
          icon: "home"
        },
        {
          address: "/family",
          label: "Family",
          icon: "face"
        },
        {
          address: "/schedule",
          label: "Schedule",
          icon: "phone"
        },
        {
          address: "/study",
          label: "Study",
          icon: "description"
        },
        {
          address: "/personnel",
          label: "Personnel",
          icon: "perm_identity"
        },
        {
          address: "/appointment",
          label: "Appointment",
          icon: "event"
        },
        {
          address: "/about",
          label: "About",
          icon: "dashboard"
        },
        {
          address: "/login",
          label: "Login",
          icon: "fingerprint"
        }
      ]
    };
  }
};
</script>
