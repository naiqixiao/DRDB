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
    Header,
  },
  watch: {
    group() {},
  },

  data() {
    return {
      studyTimeSlots: [
        "08:30AM",
        "09:00AM",
        "09:30AM",
        "10:00AM",
        "10:30AM",
        "11:00AM",
        "11:30AM",
        "12:00PM",
        "12:30PM",
        "01:00PM",
        "01:30PM",
        "02:00PM",
        "02:30PM",
        "03:00PM",
        "03:30PM",
        "04:00PM",
        "04:30PM",
        "05:00PM",
        "05:30PM",
        "06:00PM",
      ],
    };
  },
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
