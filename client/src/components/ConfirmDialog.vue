<template>
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.esc="cancel"
  >
    <v-card height="300px">
      <v-toolbar dark color="primary" flat>
        <h2 class="title-text title-p-4 ma-2">
          {{ title }}
        </h2>
      </v-toolbar>
      <div>
        <v-card-text justify="center"
          v-show="!!message"
          class="pa-4 body-2 text-left"
          v-html="message"
        ></v-card-text>
      </div>
      <v-spacer></v-spacer>

      <ul style="list-style-type: none">
        <li v-for="(appointment, index) in item.Appointments" :key="index">
          <v-tooltip right>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-checkbox
                  v-model="appointment.checked" 
                  :label="`${appointment.Child.Name} (${appointment.Study.StudyName})`"
                  class="ma-0 pa-0 ml-5"
                  hide-details
                  dense
                ></v-checkbox>
              </div>
            </template>
          </v-tooltip>
        </li>
      </ul>

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
      item: {},
      selectedAppointment: [],
      options: {
        color: "grey lighten-3",
        width: 500,
        zIndex: 200,
        noconfirm: false,
      },
    };
  },

  methods: {
    open(title, message, item, options) {
      this.dialog = true;
      this.title = title;
      this.message = message;
      this.item = {...item};
      this.options = Object.assign(this.options, options);
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    agree() {
      // filter the selected studies
      const selectedAppointments = this.item.Appointments.filter(appointment => appointment.checked);
      const updatedAppointments = this.item.Appointments.filter((appointment) => {
        return !selectedAppointments.includes(appointment);
      });
      // determine if all checkboxes are checked
      const allChecked = this.item.Appointments.every(appointment => appointment.checked);

      if (allChecked) {
        this.resolve({ allChecked: true});
        this.dialog = false;
      } else {
        const selectedItem = {...this.item};
        this.item.Appointments = updatedAppointments;
        selectedItem.Appointments = selectedAppointments
        this.resolve({ allChecked: false, newItem: this.item, selectedItem});
        this.dialog = false;
      }
    },
    cancel() {
      this.resolve(false);
      this.dialog = false;
    },
  },
};
</script>
