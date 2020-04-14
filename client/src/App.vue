<template>
  <v-app>
    <Header />
  </v-app>
</template>

<script>
import Header from "./components/Header";

export default {
  name: "App",

  components: {
    Header
  },
  watch: {
    group() {}
  },

  data() {
    return {};
  }
};
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  // color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #ffffff;

    &.router-link-exact-active {
      color: #2c3e50;
    }
  }
}
</style>
