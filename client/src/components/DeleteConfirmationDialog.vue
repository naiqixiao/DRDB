<template>
  <v-dialog 
    overlay-opacity="0.01"
    v-model="show" 
    width="500"
    :retain-focus="false"
    persistent
  >
    <v-card height="250px">
      <v-toolbar dark color="primary" flat>
        <h2 class="title-text title-p-4 ma-2">
          Confirm Delete
        </h2>
      </v-toolbar>
      <div style="height: 120px">
        <v-card-text class="pa-4 body-2 text-left">
          <h3>Are you sure you want to delete Testing Room: {{testingRoom}}?</h3>
        </v-card-text>
      </div>
      <v-spacer></v-spacer>
      <v-card-actions class="pt-3">
        <v-btn 
          color="grey"
          class="body-2 font-weight-bold" 
          text 
          @click="$emit('cancel')"
        >
          Cancel
        </v-btn>
        <v-btn 
          color="red"
          class="body-2 font-weight-bold" 
          text
          @click="$emit('confirm')"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>  
</template>

<script>
export default {
  props: {
    show: Boolean,
    testingRoom: String
  },
};
</script>

<style>
.v-dialog {
  box-shadow: none;
  -webkit-box-shadow: none;
}
</style>