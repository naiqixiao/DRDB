<template>
  <!-- <v-card outlined class="d-flex flex-column"> -->
  <div>
    <v-alert
      v-if="!familyInfo.Email"
      border="left"
      type="error"
      color="#c73460"
      dense
      style="font-weight: 600"
      >Participant email is not available.</v-alert
    >
    <v-row dense justify="start">
      <v-col cols="12" md="1"></v-col>
      <v-col cols="12" md="8">
        <v-text-field
          v-model="familyInfo.Email"
          label="Email"
          :rules="this.$rules.email"
          @change="checkEmail"
        ></v-text-field>
        <v-text-field v-model="emailSubject" label="Subject"></v-text-field>
      </v-col>
    </v-row>
    <v-row justify="center" style="height: 500px">
      <v-col cols="12" md="11">
        <vue-editor
          style="height: 450px"
          ref="emailBody"
          v-model="emailBody"
          :editor-toolbar="customToolbar"
        ></vue-editor>
      </v-col>
    </v-row>
  </div>
  <!-- </v-card> -->
</template>

<script>
import { VueEditor } from "vue2-editor";
import email from "@/services/email";
import moment from "moment";
import family from "@/services/family";
import store from "@/store";

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
      emailUpdate: false,
      emailBody: "",
      emailSubject: "",
      customToolbar: [
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
        ["link"],
      ],
    };
  },

  methods: {
    childNames() {
      var nameList = this.appointments.map((appointment) => {
        return appointment.Child.Name.split(" ")[0];
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

    checkEmail() {
      this.emailUpdate = true;
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
              this.familyInfo.NamePrimary.split(" ")[0] +
              ",</p>" +
              "<p>Thanks for your support to our research! This is a confirmation for your participation in our study with <b>" +
              this.childNames() +
              moment(this.scheduleInfo.AppointmentTime).format(
                " [on] dddd [(]MMM Do[)] [at] h:mma"
              ) +
              "</b>.</p>";
            break;

          case "ScheduleUpdate":
            opening =
              "<p>Dear " +
              this.familyInfo.NamePrimary.split(" ")[0] +
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
              this.familyInfo.NamePrimary.split(" ")[0] +
              ",</p>" +
              "<p>We are " +
              this.$store.state.labName +
              // " at McMaster University. " +
              "We would love to have you and " +
              this.childNames() +
              " to participate in our study.</p>" +
              "<p>Here is the information about the study:<br>";
            break;

          case "ThankYou":
            opening =
              "<p>Dear " +
              this.familyInfo.NamePrimary.split(" ")[0] +
              ",</p>" +
              "<p>Thank you so much for visiting us with " +
              this.childNames() +
              "!</p>" +
              "<p>We are looking forward to seeing you again!</p>";
            break;

          case "Reminder":
            var dateLabel = "";

            var differentDays = moment
              .duration(
                moment(this.scheduleInfo.AppointmentTime)
                  .startOf("day")
                  .diff(moment().startOf("day"))
              )
              .asDays();

            switch (differentDays) {
              case 1:
                dateLabel = " tomorrow";
                break;

              default:
                dateLabel = moment(this.scheduleInfo.AppointmentTime).format(
                  " [this] dddd"
                );

                break;
            }

            if (
              this.scheduleInfo.Appointments[0].Study.StudyType !== "Online"
            ) {
              opening =
                "<p>Dear " +
                this.scheduleInfo.Family.NamePrimary.split(" ")[0] +
                ",</p>" +
                "<p>Hope you are doing great! This is a reminder for your visit to " +
                this.$store.state.labName +
                " with <b>" +
                this.childNames() +
                dateLabel +
                moment(this.scheduleInfo.AppointmentTime).format(
                  " [at] h:mma"
                ) +
                "</b>.</p>" +
                "<p>" +
                this.$store.state.transportationInstructions +
                "</p>";
            } else {
              opening =
                "<p>Dear " +
                this.scheduleInfo.Family.NamePrimary.split(" ")[0] +
                ",</p>" +
                "<p>Hope you are doing great! This is " +
                this.$store.state.labName +
                ". Just a reminder that you and <b>" +
                this.childNames() +
                " will participate our online study" +
                dateLabel +
                moment(this.scheduleInfo.AppointmentTime).format(
                  " [at] h:mma"
                ) +
                "</b>.</p>";
            }

            break;
        }
      }
      // specific content for each schedueld study.
      // const pattern = /\$\{\{([^}]+)\}\}/g;

      var email = "";
      if (this.emailType == "Reminder") {
        var ZoomLink = "Zoom Link not available.";

        if ("ZoomLink" in this.scheduleInfo.Appointments[0].Study.Lab) {
          if (this.scheduleInfo.Appointments[0].Study.Lab.ZoomLink) {
            ZoomLink =
              "<a href='" +
              this.scheduleInfo.Appointments[0].Study.Lab.ZoomLink +
              "'>Zoom Link</a>";
          }
        }

        if (this.scheduleInfo.Appointments[0].PrimaryExperimenter.length > 0) {
          if (
            this.scheduleInfo.Appointments[0].PrimaryExperimenter[0].ZoomLink
          ) {
            ZoomLink =
              "<a href='" +
              this.scheduleInfo.Appointments[0].PrimaryExperimenter[0]
                .ZoomLink +
              "'>Zoom Link</a>";
          }
        }

        var body = this.scheduleInfo.Appointments[0].Study.ReminderTemplate.replace(
          /\${{ZoomLink}}/g,
          ZoomLink
        );

        body = body.replace(/\${{childName}}/g, this.childNames());

        if (this.scheduleInfo.Appointments[0].Study.StudyType === "Online") {
          body =
            body +
            "<p>You can download Zoom for your computer here: <a href='https://zoom.us/download'>Download Link</a></p>" +
            "<p><a href='https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/EdhORdZeCwlPn-X54WquFz8Boegr1YpaNy9mzlW_wJ8ZjQ?e=hvDNGr'>CLICK HERE</a> to learn a few tips to setup online study with your child.</p>";
        }

        // closing
        const closing =
          "<p>" +
          this.$store.state.emailClosing +
          "</p>" +
          "<p>Best,</p><p>" +
          this.scheduleInfo.Personnel.Name +
          "</p><p>" +
          this.scheduleInfo.Personnel.Role +
          "</p><p>" +
          this.$store.state.labName +
          "</p>";

        email = opening + body + closing;
      } else {
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

          emailBody = emailBody.replace(
            /\${{ZoomLink}}/g,
            "<a href='" + appointment.PrimaryExperimenter[0].ZoomLink + "'>Zoom Link</a>"
          );

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

        switch (this.emailType) {
          case "Confirmation":
          case "ScheduleUpdate":
            switch (this.appointments[0].Study.StudyType) {
              case "Online":
                email =
                  opening +
                  emailBodyList.join("<p></p>") +
                  "<p>This study is an online study. You can participate at home. :)</p>" +
                  closing;
                break;

              default:
                email =
                  opening + emailBodyList.join("<p></p>") + location + closing;
                break;
            }
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
      }

      return email;

    },

    experimenterEmails() {
      var emails = [];

      this.scheduleInfo.Appointments.forEach((appointment) => {

        appointment.PrimaryExperimenter.forEach((experimenter) => {
          emails.push(experimenter.Name + " <" + experimenter.Email + ">");
        });

        appointment.SecondaryExperimenter.forEach(
          (experimenter) => {
            emails.push(experimenter.Name + " <" + experimenter.Email + ">");
          }
        );
      });

      return emails.join(", ");
    },

    async sendEmail() {
      // send email with the current email body

      var emailContent = {
        // from:
        //   this.$store.state.labName + " <" + this.$store.state.labEmail + ">",
        to: this.familyInfo.NamePrimary + " <" + this.familyInfo.Email + ">",
        subject: this.emailSubject,
        body: this.formatedBody(this.$refs.emailBody.value),
      };

      // if (this.emailType == "Reminder") {
      //   emailContent.bcc = this.experimenterEmails();
      // }

      try {
        await email.send(emailContent);

        if (this.emailUpdate) {
          this.familyInfo.UpdatedBy = store.state.userID;
          await family.update(this.familyInfo);
          this.emailUpdate = false;
        }
      } catch (error) {
        console.log(error);
      }
    },

    // this function is to replace the last few </p><p> with <br>, giving a better look to the emails.
    formatedBody(emailBody) {
      const k = emailBody.split("</p><p>");
      var formattedEmailBody = "";

      for (var i = 0; i < k.length; i++) {
        // formattedEmailBody = formattedEmailBody + k[i] + "<br>";

        if (i < k.length - 3) {
          formattedEmailBody = formattedEmailBody + k[i] + "<br><br>";
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
            this.emailSubject =
              "Reminder for your study appointment with " + this.childNames();
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
          this.emailSubject =
            "Reminder for your study appointment with " + this.childNames();
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
