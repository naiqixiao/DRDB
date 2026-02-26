<template>
  <v-container fluid>
    <div v-if="!$store.state.labEmailStatus">
      <v-alert
        border="start"
        type="error"
        color="#c73460"
        density="compact"
        style="font-weight: 600"
      >Lab email is not been setup properly. Please set it up in the Settings page.</v-alert>
    </div>
    <div v-if="!$store.state.adminEmailStatus">
      <v-alert
        border="start"
        type="warning"
        color="#c7792c"
        density="compact"
        style="font-weight: 600"
      >Admin email is not been setup properly. Please set it up in the Settings page.</v-alert>
    </div>
    <div v-if="$store.state.trainingMode">
      <v-alert
        border="start"
        type="warning"
        color="#c7792c"
        density="compact"
        style="font-weight: 600"
        >You are running in a training mode.</v-alert
      >
    </div>

    <div class="home">
      <HelloWorld msg="Welcome to Your Vue.js App" />
    </div>
  </v-container>
</template>

<script>
// @ is an alias to /src
import HelloWorld from "@/components/HelloWorld.vue";

export default {
  name: "Home",
  components: {
    HelloWorld,
  },
};
</script>
