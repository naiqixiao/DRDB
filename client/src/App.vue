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

.theme--light.v-text-field {
  font-size: 16px;
  font-weight: 700;
}

.theme--light.v-data-table {
  border-top-left-radius: 10px !important;
  border-top-right-radius: 10px !important;
}

.theme--light.v-data-table th {
  font-size: 16px;
  font-weight: 800;
  height: 60px;
}

.theme--light.v-data-table tbody tr {
  font-weight: 600;
}

.theme--light.v-data-table td {

  padding-left: 8px !important;
  padding-right: 8px !important;
}

.theme--light.v-data-table th {

  padding-left: 8px !important;
  padding-right: 8px !important;
}

.theme--light.v-data-table.v-data-table--fixed-header thead th {
  border-bottom-width: 2px;
  color: var(--v-secondary-base);
  background-color: var(--v-primary-base) !important;
}

.theme--light.v-data-table tbody tr:nth-of-type(odd) {
  background-color: var(--v-textbackground-base) ;
}
.theme--light.v-data-table tbody tr:nth-of-type(even) {
  background-color: var(--v-background-base) ;
}

.theme--light.v-data-table .v-data-table-header th.sortable .v-data-table-header__icon
 {
  color: var(--v-secondary-base) !important;
}

.theme--light.v-data-table--dense th {
  font-size: 14px;
  font-weight: 700;
  height: 40px;
}

.theme--light.v-data-table--dense tbody tr {
  height: 35px !important;
}

.conv-textarea {
  border-radius: 10px !important;
  border-style: solid !important;
  border-width: thin !important;
  border-color: var(--v-primary-base) !important;
  background-color: var(--v-background-lighten4) !important;
}
</style>
