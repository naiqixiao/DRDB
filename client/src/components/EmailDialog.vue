<template>
  <v-dialog
    v-model="dialog"
    max-width="800px"
    @click:outside="cancel"
    :retain-focus="false"
  >
    <v-card>
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="data.Email"
            label="Email"
            :rules="this.$rules.email"
          ></v-text-field>
          <v-text-field :value="emailSubject" label="Subject"></v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="10">
          <vue-editor
            ref="emailBody"
            v-model="emailBody"
            :editor-toolbar="customToolbar"
          ></vue-editor>
        </v-col>
      </v-row>

      <v-card-actions>
        <v-row justify="space-between" style="height: 50px">
          <v-col md="4"></v-col>
          <v-col md="2">
            <v-btn color="primary" @click="cancel">Cancel</v-btn>
          </v-col>
          <v-col md="2">
            <v-btn color="primary" @click="sendEmail">Send</v-btn>
          </v-col>
          <v-col md="4"></v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { VueEditor } from "vue2-editor";
import email from "@/services/email";

export default {
  props: {
    emailTemplate: String,
    emailType: String,
    data: Object,
    dialog: Boolean,
  },

  components: {
    VueEditor,
  },

  data() {
    return {
      emailBody: String,
      emailSubject: String,
      customToolbar: [
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
      ],
    };
  },

  methods: {
    generateEmailBody() {
      if (this.emailTemplate) {
        var email = this.emailTemplate;
        // Search for all the variables to be replaced, for instance ${"Column name"}

        var pattern = /\$\{\{([^}]+)\}\}/g;
        var templateVars = this.emailTemplate.match(pattern);
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

    async sendEmail() {
      // send email with the current email body
      var emailContent = {
        from: "McMaster Baby Lab <babylab@mcmaster.ca>",
        to: this.data.Email,
        subject: this.emailSubject,
        body: this.$refs.emailBody.value,
      };
      try {
        await email.send(emailContent);
      } catch (error) {
        console.log(error.response);
      }

      this.cancel();
    },

    cancel() {
      this.$emit("cancelEmail");
    },
  },

  watch: {
    dialog(val) {
      switch (val) {
        case true:
          this.emailBody = this.generateEmailBody();

          switch (this.emailType) {
            case "Confirmation":
              this.emailSubject =
                "Appointment confirmation for " + this.data.childName;
              // "on " +
              // this.data.scheduleTime;
              break;

            case "Introduction":
              this.emailSubject = "Elgible study for " + this.data.childName;
              break;

            case "Reminder":
              this.emailSubject = "See you tomorrow!" + this.data.childName;
              break;

            case "ThankYou":
              this.emailSubject = "Thank you!";
              break;
          }

          break;

        case false:
          this.emailBody = "";
          break;
      }
    },
  },
};
</script>

<style></style>
