<template>
  <v-container fluid>
    <AlertBanner />

    <div class="home">
      <HelloWorld msg="Welcome to Your Vue.js App" />
    </div>
  </v-container>
</template>

<script>
// @ is an alias to /src
import HelloWorld from "@/components/HelloWorld.vue";
import AlertBanner from "@/components/AlertBanner.vue";

export default {
  name: "Home",
  components: {
    HelloWorld,
    AlertBanner,
  },
};
</script>
