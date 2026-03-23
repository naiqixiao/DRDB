<template>
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.esc="cancel"
  >
    <v-card class="ds-card" variant="flat">
      <v-toolbar :color="options.color || 'primary'" dark>
        <v-toolbar-title class="font-weight-medium">
          {{ title }}
        </v-toolbar-title>
      </v-toolbar>
      
      <v-card-text class="pt-6 pb-4 text-body-1" v-show="!!message" v-html="message">
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          v-if="!options.noconfirm"
          color="grey-darken-1"
          variant="text"
          class="text-none"
          @click="cancel"
          >Cancel</v-btn
        >
        <v-btn
          :color="options.color || 'primary'"
          variant="elevated"
          class="text-none font-weight-bold"
          @click="agree"
          >Confirm</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "ConfirmDlg",
  data() {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      message: null,
      title: null,
      options: {
        color: "grey lighten-3",
        width: 500,
        zIndex: 3000,
        noconfirm: false,
      },
    };
  },

  methods: {
    open(title, message, options) {
      this.dialog = true;
      this.title = title;
      this.message = message;
      this.options = Object.assign(this.options, options);
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    agree() {
      this.resolve(true);
      this.dialog = false;
    },
    cancel() {
      this.resolve(false);
      this.dialog = false;
    },
  },
};
</script>
