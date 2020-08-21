<template>
  <v-card outlined class="d-flex flex-column">
    <v-row dense justify="start">
      <v-col cols="12" md="1"></v-col>
      <v-col cols="12" md="8">
        <v-text-field
          :value="appointments[0].Child.Family.Email"
          label="Email"
          :rules="this.$rules.email"
        ></v-text-field>
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
              this.appointments[0].Child.Family.NameMom.split(" ")[0] +
              ",</p>" +
              "<p>Thanks for your support to our research! This is a confirmation for your visit with " +
              this.childNames() +
              moment(this.appointments[0].Schedule.AppointmentTime).format(
                " [on] dddd [(]MMM Do[)] [at] h:mma"
              ) +
              ".</p>"
            break;

          case "ScheduleUpdate":
            opening =
              "<p>Dear " +
              this.appointmentsForEmail[0].Child.Family.NameMom.split(" ")[0] +
              ",</p>" +
              "<p>This is an update on your visit with " +
              this.childNames() +
              moment(
                this.appointmentsForEmail[0].Schedule.AppointmentTime
              ).format(" [on] dddd [(]MMM Do[)] [at] h:mma") +
              ".</p>"
            break;
        }
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

        emailBodyList.push(emailBody);
      });

      // location
      const location =
        "<p>Our lab is located at Psychology Building, McMaster University. There are 3 parking lots in front of the building that you can park when you come. We will wait for you at the parking lot.</p>";

      // closing
      const closing =
        "<p>Please feel free to let us know if you wish to change the time for your visit. You can either send us an email or call us at XXXX</p>" +
        "<p>Best,</p><p>" +
        this.$store.state.name +
        "</p><p>" +
        this.$store.state.role +
        "</p><p>" +
        this.$store.state.labName +
        "</p>";

      const email = opening + emailBodyList.join("<p></p>") + location + closing;

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
        //to: this.appointments[0].Child.Family.NameMom + "<" + appointments[0].Child.Family.Email + ">",
        to:
          this.appointments[0].Child.Family.NameMom +
          "<" +
          this.$store.state.labEmail +
          ">",
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

          case "ScheduleUpdate":
            this.emailSubject =
              "An update on your visit " +
              // this.childNames() +
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

        case "ScheduleUpdate":
          this.emailSubject =
            "An update on your visit " +
            // this.childNames() +
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
