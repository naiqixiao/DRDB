<template>
  <v-app style="{background: $vuetify.theme.themes.light.secondary}">
    <Header />
  </v-app>
</template>

<script>
import Header from "./components/Header";

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
};
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}

// #nav {
//   padding: 30px;

//   a {
//     font-weight: bold;
//     color: #ffffff;

//     &.router-link-exact-active {
//       color: #fafafa;
//     }
//   }
// }

.v-application {
  background-color: var(--v-background-base) !important;
}

.row {
  margin-left: 0;
  margin-right: 0;
}

.theme--light.v-btn:enabled:not(.v-btn--icon):not(.v-btn--text) {
  color: var(--v-secondary-base) !important;
  background-color: var(--v-primary-base) !important;
}

.theme--light.v-data-table {
  border-top-left-radius: 50px !important;
  border-top-right-radius: 10px !important;
}

.theme--light.v-data-table th {
  font-size: 16px;
  font-weight: 800;
  height: 60px;
}

.theme--light.v-data-table.v-data-table--fixed-header thead th {
  border-bottom-width: 2px !important;
  color: var(--v-secondary-base);
  // border-bottom-color: var(--v-secondary-base) !important;
  background-color: var(--v-primary-base) !important;
}

// .theme--light.v-data-table tbody tr.v-data-table__selected {
//   background-color: var(--v-secondary-base) !important;
// }

.theme--light.v-data-table tbody tr:nth-of-type(odd) {
  background-color: var(--v-textbackground-base) !important;
}
.theme--light.v-data-table tbody tr:nth-of-type(even) {
  background-color: var(--v-background-base) !important;
}
</style>
