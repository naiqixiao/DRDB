<template>
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.esc="cancel"
  >
    <v-card height="250px">
      <v-toolbar dark color="primary" flat>
        <h2 class="title-text title-p-4 ma-2">
          {{ title }}
        </h2>
      </v-toolbar>
      <div style="height: 120px">
        <v-card-text justify="center"
          v-show="!!message"
          class="pa-4 body-2 text-left"
          v-html="message"
        ></v-card-text>
      </div>
      <v-spacer></v-spacer>

      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn
          v-if="!options.noconfirm"
          color="grey"
          text
          class="body-2 font-weight-bold"
          @click.native="cancel"
          >Cancel</v-btn
        >
        <v-btn
          color="primary"
          class="body-2 font-weight-bold"
          text
          @click.native="agree"
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
        zIndex: 200,
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
