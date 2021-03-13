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

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}

.v-application {
  background-color: var(--v-background-base) !important;
}

.row {
  margin-left: 0;
  margin-right: 0;
}

.col-xl,
.col-xl-auto,
.col-xl-12,
.col-xl-11,
.col-xl-10,
.col-xl-9,
.col-xl-8,
.col-xl-7,
.col-xl-6,
.col-xl-5,
.col-xl-4,
.col-xl-3,
.col-xl-2,
.col-xl-1,
.col-lg,
.col-lg-auto,
.col-lg-12,
.col-lg-11,
.col-lg-10,
.col-lg-9,
.col-lg-8,
.col-lg-7,
.col-lg-6,
.col-lg-5,
.col-lg-4,
.col-lg-3,
.col-lg-2,
.col-lg-1,
.col-md,
.col-md-auto,
.col-md-12,
.col-md-11,
.col-md-10,
.col-md-9,
.col-md-8,
.col-md-7,
.col-md-6,
.col-md-5,
.col-md-4,
.col-md-3,
.col-md-2,
.col-md-1,
.col-sm,
.col-sm-auto,
.col-sm-12,
.col-sm-11,
.col-sm-10,
.col-sm-9,
.col-sm-8,
.col-sm-7,
.col-sm-6,
.col-sm-5,
.col-sm-4,
.col-sm-3,
.col-sm-2,
.col-sm-1,
.col,
.col-auto,
.col-12,
.col-11,
.col-10,
.col-9,
.col-8,
.col-7,
.col-6,
.col-5,
.col-4,
.col-3,
.col-2,
.col-1 {
  padding: 8px 8px 8px 8px !important;
}

.v-main {
  padding-top: 56px !important;
}

.theme--light.v-btn:enabled:not(.v-btn--text) {
  color: var(--v-secondary-base);
  background-color: var(--v-primary-base) !important;
}

.theme--light.v-text-field {
  font-size: 14px;
  font-weight: 700;
}

.textfield-family {
  height: 36px;
}

.checkbox-child {
  font-size: 14px !important;
  font-weight: 700 !important;
  margin: 0 0 0 0 !important;
}

.theme--light.v-text-field.v-text-field--solo:not(.v-text-field--solo-flat)
  > .v-input__control
  > .v-input__slot {
  -webkit-box-shadow: none;
  -moz-box-shadow: none;
  box-shadow: none;
}

// .theme--light.v-data-table {
//   border-top-left-radius: 10px !important;
//   border-top-right-radius: 10px !important;
// }

.theme--light.v-data-table th {
  font-size: 14px;
  font-weight: 800;
  height: 50px;
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
  font-size: 14px !important;
}

.theme--light.v-data-table tbody tr:nth-of-type(odd) {
  background-color: var(--v-textbackground-base);
}
.theme--light.v-data-table tbody tr:nth-of-type(even) {
  background-color: var(--v-background-base);
}

.theme--light.v-data-table
  .v-data-table-header
  th.sortable
  .v-data-table-header__icon {
  color: var(--v-secondary-base) !important;
}

.theme--light.v-data-table.v-data-table--fixed-header thead th {
  color: var(--v-secondary-base) !important;
  font-weight: 600 !important;
}

.theme--light.v-data-table--dense th {
  font-size: 14px;
  font-weight: 700;
  height: 40px;
}

.theme--light.v-data-table--dense tbody tr {
  height: 35px !important;
}

.v-data-table tbody tr.v-data-table__expanded__content {
  padding-left: 0px !important;
  background-color: var(--v-textbackground-lighten4) !important;
  height: 180px;
}

.v-textarea textarea {
  line-height: 20px !important;
}

.conv-textarea {
  border-radius: 5px !important;
  // border-style: solid !important;
  // border-width: thin !important;
  border-color: var(--v-primary-base) !important;
  background-color: var(--v-background-lighten4) !important;
}

#app .v-list-item__content {
  text-align: start !important;
}

.v-stepper__items {
  background-color: var(--v-background-base);
}

.v-card__actions {
  padding-top: 0px !important;
}

.v-application p {
  margin-bottom: 8px !important;
}

#app .v-list-item__title {
  font-size: 1rem;
  font-weight: 800;
}

.theme--light.v-tabs .v-tabs-bar .v-tab:not(.v-tab--active) {
  background-color: var(--v-textbackground-base) !important;
}
</style>
