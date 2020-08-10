<template>
  <v-card outlined>
    <v-row dense>
      <v-col cols="12" md="6">
        <v-text-field v-model="data.Email" label="Email" :rules="this.$rules.email"></v-text-field>
        <v-text-field v-model="emailSubject" label="Subject"></v-text-field>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="10">
        <vue-editor ref="emailBody" v-model="emailBody" :editor-toolbar="customToolbar"></vue-editor>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import { VueEditor } from "vue2-editor";
import email from "@/services/email";
import moment from "moment";

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
      emailBody: "",
      emailSubject: "",
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
        from: this.$store.state.labName + "<" + this.$store.state.labEmail + ">",
        // cc: "lab email <nx@kangleelab.com>",
        to: this.$store.state.labEmail,
        //to: this.data.Email,
        subject: this.emailSubject,
        body: this.$refs.emailBody.value,
      };

      try {
        await email.send(emailContent);
      } catch (error) {
        console.log(error);
      }
    },
  },

  watch: {
    dialog(val) {
      if (val) {
        this.emailBody = this.generateEmailBody();

        switch (this.emailType) {
          case "Confirmation":
            this.emailSubject =
              "Appointment confirmation for " +
              this.data.childName +
              " on " +
              moment(this.data.scheduleTime).format("MMM D (ddd), [at] h:mma");
            break;

          case "Introduction":
            this.emailSubject = "An elgible study for " + this.data.childName;
            break;

          case "Reminder":
            this.emailSubject = "See you tomorrow! " + this.data.childName;
            break;

          case "ThankYou":
            this.emailSubject = "Thank you for your participation!";
            break;
        }
      } else {
        this.emailBody = "";
        this.emailSubject = "";
      }
    },
  },

  mounted() {
    if (this.dialog) {
      this.emailBody = this.generateEmailBody();

      switch (this.emailType) {
        case "Confirmation":
          this.emailSubject =
            "Appointment confirmation for " +
            this.data.childName +
            " on " +
            moment(this.data.scheduleTime).format("MMM D (ddd), [at] h:mma");
          break;

        case "Introduction":
          this.emailSubject = "An elgible study for " + this.data.childName;
          break;

        case "Reminder":
          this.emailSubject = "See you tomorrow! " + this.data.childName;
          break;

        case "ThankYou":
          this.emailSubject = "Thank you for your participation!";
          break;
      }
    } else {
      this.emailBody = "";
      this.emailSubject = "";
    }
  },
};
</script>

<style></style>
