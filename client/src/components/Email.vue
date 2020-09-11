<template>
  <v-card outlined class="d-flex flex-column">
    <v-row dense justify="start">
      <v-col cols="12" md="1"></v-col>
      <v-col cols="12" md="8">
        <v-text-field :value="familyInfo.Email" label="Email" :rules="this.$rules.email"></v-text-field>
        <v-text-field v-model="emailSubject" label="Subject"></v-text-field>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="12" md="11" style="overflow-y: scroll;">
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
    scheduleInfo: Object,
    familyInfo: Object,
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
        var opening = "";
        switch (this.emailType) {
          case "Confirmation":
            opening =
              "<p>Dear " +
              this.familyInfo.NameMom.split(" ")[0] +
              ",</p>" +
              "<p>Thanks for your support to our research! This is a confirmation for your visit with <b>" +
              this.childNames() +
              moment(this.scheduleInfo.AppointmentTime).format(
                " [on] dddd [(]MMM Do[)] [at] h:mma"
              ) +
              "</b>.</p>";
            break;

          case "ScheduleUpdate":
            opening =
              "<p>Dear " +
              this.familyInfo.NameMom.split(" ")[0] +
              ",</p>" +
              "<p>This is an update on your visit with <b>" +
              this.childNames() +
              moment(this.scheduleInfo.AppointmentTime).format(
                " [on] dddd [(]MMM Do[)] [at] h:mma"
              ) +
              "</b>.</p>";
            break;

          case "Introduction":
            opening =
              "<p>Dear " +
              this.familyInfo.NameMom.split(" ")[0] +
              ",</p>" +
              "<p>We are " +
              this.$store.state.labName +
              " at McMaster University. " +
              "We would love to have you and " +
              this.childNames() +
              " to participate in our study.</p>" +
              "<p>Here is the information about the study:<br>";
            break;

          case "ThankYou":
            opening =
              "<p>Dear " +
              this.familyInfo.NameMom.split(" ")[0] +
              ",</p>" +
              "<p>Thank you so much for visiting us with " +
              this.childNames() +
              "!</p>" +
              "<p>We are looking forward to seeing you again!</p>";
            break;
        }
      }
      // specific content for each schedueld study.
      // const pattern = /\$\{\{([^}]+)\}\}/g;
      var emailBody = "";
      this.appointments.forEach((appointment) => {
        switch (this.emailType) {
          case "Confirmation":
          case "ScheduleUpdate":
            emailBody = appointment.Study.EmailTemplate;
            break;
          case "Introduction":
            emailBody = appointment.Study.Description;
            break;
        }
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

        emailBodyList.push(emailBody);
      });

      // location
      const location =
        "<p>" + this.$store.state.transportationInstructions + "</p>";
      // closing
      const closing =
        "<p>" +
        this.$store.state.emailClosing +
        "</p>" +
        "<p>Best,</p><p>" +
        this.$store.state.name +
        "</p><p>" +
        this.$store.state.role +
        "</p><p>" +
        this.$store.state.labName +
        "</p>";

      var email = "";
      switch (this.emailType) {
        case "Confirmation":
        case "ScheduleUpdate":
          email = opening + emailBodyList.join("<p></p>") + location + closing;
          break;

        default:
          email =
            opening +
            "<p>" +
            this.$store.state.emailClosing +
            "</p>" +
            "<p>Best,</p><p>" +
            this.$store.state.name +
            "</p><p>" +
            this.$store.state.role +
            "</p><p>" +
            this.$store.state.labName +
            "</p>";
          break;
      }

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
        //to: this.familyInfo.NameMom + "<" + familyInfo.Email + ">",
        to: this.familyInfo.NameMom + "<" + this.$store.state.labEmail + ">",
        subject: this.emailSubject,
        body: this.formatedBody(this.$refs.emailBody.value),
      };

      try {
        await email.send(emailContent);
      } catch (error) {
        console.log(error);
      }
    },

    // this function is to replace the last few </p><p> with <br>, giving a better look to the emails.
    formatedBody(emailBody) {
      const k = emailBody.split("</p><p>");
      var formattedEmailBody = "";

      for (var i = 0; i < k.length; i++) {
        if (i < k.length - 3) {
          formattedEmailBody = formattedEmailBody + k[i] + "</p><p>";
        } else {
          formattedEmailBody = formattedEmailBody + k[i] + "<br>";
        }
      }

      return formattedEmailBody;
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
              moment(this.scheduleInfo.AppointmentTime).format(
                "MMM D (ddd), [at] h:mma"
              );
            break;

          case "ScheduleUpdate":
            this.emailSubject =
              "An update on your visit on " +
              moment(this.scheduleInfo.AppointmentTime).format(
                "MMM D (ddd), [at] h:mma"
              );
            break;

          case "Introduction":
            this.emailSubject = "An eligible study for " + this.childNames();
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
            moment(this.scheduleInfo.AppointmentTime).format(
              "MMM D (ddd), [at] h:mma"
            );
          break;

        case "ScheduleUpdate":
          this.emailSubject =
            "An update on your visit on " +
            moment(this.scheduleInfo.AppointmentTime).format(
              "MMM D (ddd), [at] h:mma"
            );
          break;

        case "Introduction":
          this.emailSubject = "An eligible study for " + this.childNames();
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
