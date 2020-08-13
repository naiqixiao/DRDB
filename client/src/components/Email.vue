<template>
  <v-card outlined>
    <v-row dense>
      <v-col cols="12" md="6">
        <v-text-field
          :value="appointments[0].Child.Family.Email"
          label="Email"
          :rules="this.$rules.email"
        ></v-text-field>
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
    emailType: String,
    appointments: Array,
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
    childNames() {
      var nameList = this.appointments.map((appointment) => {
        return appointment.Child.Name;
      });

      nameList = Array.from(new Set(nameList));

      var childNames = "";

      if (nameList.length <= 2) {
        childNames = nameList.join(" and ");
      } else {
        childNames = "your " + nameList.length + " children";
      }
      return childNames;
    },

    generateEmailBody() {
      var emailBodyList = [];

      // opening line, confirming the schedule date and time
      if (this.appointments) {
        var opening =
          "<p>Dear " +
          this.appointments[0].Child.Family.NameMom.split(" ")[0] +
          ",</p>" +
          "<p>Thanks for your support to our research! This is a confirmation for your visit with " +
          this.childNames() +
          moment(this.appointments[0].Schedule.AppointmentTime).format(
            " [on] dddd [(]MMM Do[)] [at] h:mma"
          ) +
          ".</p>" +
          "<p></p>";
      }
      // specific content for each schedueld study.
      // const pattern = /\$\{\{([^}]+)\}\}/g;

      this.appointments.forEach((appointment) => {
        var emailBody = appointment.Study.EmailTemplate;
        // Search for all the variables to be replaced, for instance ${"Column name"}

        // var templateVars = appointment.Study.EmailTemplate.match(pattern);
        // templateVars = Array.from(new Set(templateVars));

        if (appointment.Child.Sex == "F") {
          emailBody = emailBody.replace(/\${{he\/she}}/g, "she" || "");
          emailBody = emailBody.replace(/\${{his\/her}}/g, "her" || "");
          emailBody = emailBody.replace(/\${{him\/her}}/g, "her" || "");
        } else {
          emailBody = emailBody.replace(/\${{he\/she}}/g, "he" || "");
          emailBody = emailBody.replace(/\${{his\/her}}/g, "his" || "");
          emailBody = emailBody.replace(/\${{him\/her}}/g, "him" || "");
        }

        emailBody = emailBody.replace(
          /\${{childName}}/g,
          appointment.Child.Name || ""
        );

        emailBody = emailBody.replace(/\. he/g, ". He");
        emailBody = emailBody.replace(/\. his/g, ". His");
        emailBody = emailBody.replace(/\. she/g, ". She");
        emailBody = emailBody.replace(/\. her/g, ". Her");

        //  Replace variables from the template with the actual values from the data object.
        // If no value is available, replace with the empty string.
        // for (var i = 0; i < templateVars.length; ++i) {
        //   // normalizeHeader ignores ${"} so we can call it directly here.

        //   switch (templateVars) {
        //     case "${{his/her}}":
        //       if (appointment.Child.Sex == "F") {
        //         emailBody = emailBody.replace(templateVars[i], "her" || "");
        //       } else {
        //         emailBody = emailBody.replace(templateVars[i], "his" || "");
        //       }
        //       break;

        //     case "${{he/she}}":
        //       if (appointment.Child.Sex == "F") {
        //         emailBody = emailBody.replace(templateVars[i], "she" || "");
        //       } else {
        //         emailBody = emailBody.replace(templateVars[i], "he" || "");
        //       }

        //       break;

        //     case "${{childName}}":
        //       emailBody = emailBody.replace(
        //         templateVars[i],
        //         appointment.Child.Name || ""
        //       );
        //       break;
        //   }
        // }

        emailBodyList.push(emailBody);
      });

      // location
      var location =
        "<p>Our lab is located at Psychology Building, McMaster University. There are 3 parking lots in front of the building that you can park when you come. We will wait for you at the parking lot.</p>";

      // closing
      var closing =
        "<p>Please feel free to let us know if you wish to change the time for your visit. You can either send us an email or call us at XXXX</p>" +
        "<p></p>" +
        "<p>Best,</p>" +
        "<p>" +
        this.$store.state.name +
        "</p>" +
        "<p>" +
        this.$store.state.role +
        "</p>" +
        "<p>" +
        this.$store.state.labName +
        "</p>";

      var email = opening + emailBodyList.join("<p></p>") + location + closing;

      // if (this.emailTemplate) {
      //   var email = this.emailTemplate;
      //   // Search for all the variables to be replaced, for instance ${"Column name"}

      //   var pattern = /\$\{\{([^}]+)\}\}/g;
      //   var templateVars = this.emailTemplate.match(pattern);
      //   //  Replace variables from the template with the actual values from the data object.
      //   // If no value is available, replace with the empty string.
      //   for (var i = 0; i < templateVars.length; ++i) {
      //     // normalizeHeader ignores ${"} so we can call it directly here.

      //     var variableData = this.data[templateVars[i].slice(3, -2)];

      //     email = email.replace(templateVars[i], variableData || "");
      //   }

      return email;
      // } else {
      //   return "email body not available";
      // }
    },

    async sendEmail() {
      // send email with the current email body
      var emailContent = {
        from:
          this.$store.state.labName + "<" + this.$store.state.labEmail + ">",
        // cc: "lab email <nx@kangleelab.com>",
        to: this.$store.state.labEmail,
        //to: appointments[0].Child.Family.Email,
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
              "Study appointment for " +
              this.childNames() +
              " on " +
              moment(this.appointments[0].Schedule.AppointmentTime).format(
                "MMM D (ddd), [at] h:mma"
              );
            break;

          case "Introduction":
            this.emailSubject = "An elgible study for " + this.childNames();
            break;

          case "Reminder":
            this.emailSubject = "See you tomorrow! " + this.childNames();
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
            "Study appointment for " +
            this.childNames() +
            " on " +
            moment(this.appointments[0].Schedule.AppointmentTime).format(
              "MMM D (ddd), [at] h:mma"
            );
          break;

        case "Introduction":
          this.emailSubject = "An elgible study for " + this.childNames();
          break;

        case "Reminder":
          this.emailSubject = "See you tomorrow! " + this.childNames();
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
