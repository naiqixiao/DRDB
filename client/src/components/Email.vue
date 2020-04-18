<template>
  <v-dialog v-model="dialog" max-width="800px" :retain-focus="false">
    <v-card>
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="data.Email"
            label="Email"
            :rules="this.$rules.email"
          ></v-text-field>
          <v-text-field v-model="emailSubject" label="Subject"></v-text-field>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col cols="12" md="10">
          <v-textarea
            label="Email Body"
            :value="emailBody"
            outlined
            filled
            solo
          ></v-textarea>
        </v-col>
      </v-row>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="cancel">Cancel</v-btn>
        <v-btn color="green darken-1" text @click="sendEmail">Send</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>

export default {
  props: {
    emailTemplate: String,
    emailSubject: String,
    data: Object,
    dialog: Boolean,
  },

  data() {
    return {};
  },

  methods: {
    sendEmail() {},

    cancel() {},
  },

  computed: {
    emailBody() {
      if (this.emailTemplate) {
        var email = this.emailTemplate;
        // Search for all the variables to be replaced, for instance ${"Column name"}

        var pattern = /\$\{\{([^}]+)\}\}/g;
        var templateVars = this.emailTemplate.match(pattern);
        console.log(templateVars);
        //  Replace variables from the template with the actual values from the data object.
        // If no value is available, replace with the empty string.
        for (var i = 0; i < templateVars.length; ++i) {
          // normalizeHeader ignores ${"} so we can call it directly here.

          var variableData = this.data[templateVars[i].slice(3, -2)];

          email = email.replace(templateVars[i], variableData || "");
        }

        return email;
      } else {
        return "email body not available";
      }
    },
  },
};
</script>

<style></style>
