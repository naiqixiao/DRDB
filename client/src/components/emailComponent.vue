<!-- <div style="font-family: Aptos, Aptos_EmbeddedFont, Aptos_MSFontService, Calibri, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);" >type</div> -->

<!-- ## todo, email for no show, as a reminder. the emailType will be noShowReminder -->

<template>
  <v-container style="display: flex; flex-direction: column; flex-wrap: wrap; justify-content: end; gap: 20px">
    <v-alert v-if="!familyInfo.Email" border="left" type="error" color="#c73460" dense
      style="font-weight: 600">Participant email is not available.</v-alert>

    <v-text-field style="width: 60%" hide-details prefix="TO: " v-model="emailAddress" :rules="this.$rules.email"
      @change="checkEmail"></v-text-field>
    <v-text-field style="width: 60%; margin-bottom: 20px;" hide-details prefix="SUBJECT: "
      v-model="emailSubject"></v-text-field>

    <ckeditor ref="emailBody" :editor="editor" v-model="emailBody" :config="editorConfig">
    </ckeditor>

  </v-container>
</template>

<script>
// import { VueEditor } from "vue2-editor";
import email from "@/services/email";
import family from "@/services/family";
import moment from "moment";
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

export default {
  props: {
    emailType: String,
    appointmentTime: String,
    familyInfo: Object,
    appointments: Array,
    dialog: Boolean,
  },

  data() {
    return {
      emailAddress: "",
      emailUpdate: false,
      emailBody: "",
      emailSubject: "",
      editor: ClassicEditor,
      editorData: '<p>Content of the editor.</p>',
      editorConfig: {
        allowedContent: true,
        extraAllowedContent: 'style',
        toolbar: {
          items: [
            'undo', 'redo',
            '|', 'heading',
            '|', 'bold', 'italic',
            '|', 'link', 'insertImage', 'insertTable', 'mediaEmbed', 'blockQuote',
            '|', 'bulletedList', 'numberedList', 'outdent', 'indent'
          ]
        }
      },
    };
  },

  methods: {
    childNames() {
      var nameList = this.appointments.map((appointment) => {
        if (appointment.Child.Name) {
          return appointment.Child.Name.split(" ")[0];
        }
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

    initializeEmail() {

      this.emailBody = this.generateEmailBody();

      switch (this.emailType) {
        case "Confirmation":
          this.emailSubject =
            "Study appointment for " +
            this.childNames() +
            " on " +
            moment(this.appointmentTime).format("MMM D (ddd), [at] h:mma");
          break;

        case "ScheduleUpdate":
          this.emailSubject =
            "An update on your visit on " +
            moment(this.appointmentTime).format("MMM D (ddd), [at] h:mma");
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

    },

    generateEmailBody() {
      const opening = this.emailOpening();

      // location
      const location = this.$store.state.transportationInstructions;

      // closing
      var name = this.$store.state.name;
      var role = this.$store.state.role;


      const closing =
        this.$store.state.emailClosing +
        "<p>Best,<br>" +
        name +
        "<br>" +
        role +
        "<br>" +
        this.$store.state.labName + "</p>";

      const TYclosing =
        this.$store.state.tyEmailClosing +
        "<p>Best,<br>" +
        name +
        "<br>" +
        role +
        "<br>" +
        this.$store.state.labName + "</p>";

      const studyInfo = this.emailStudyInfo();
      var email = "";

      if (this.emailType == "ThankYou") {
        email =
          opening +
          studyInfo + TYclosing;

      } else {

        switch (this.appointments[0].Study.StudyType) {
          case "Online":
            email =
              opening +
              studyInfo +
              "<p>This study is an online study. You can participate at home! :)</p>" +
              closing;
            break;

          default:
            email =
              opening +
              studyInfo + location + closing;
            break;
        }
      }

      email = email.replace(/\/p><p/g, "/p><p></p><p");
      email = email.replace(/<p>/g, "<p style='margin: 0px !important; padding: 0px;'>");

      return email;

    },

    emailOpening() {
      // opening line, confirming the schedule date and time
      if (this.appointments) {
        var opening = "";

        var parentName = "Caregiver";
        if (this.familyInfo.NamePrimary) {
          parentName = this.familyInfo.NamePrimary.split(" ")[0];
        }

        switch (this.emailType) {
          case "Confirmation":
            opening =
              "<p>Dear " +
              parentName +
              ",</p><p>" +
              "Thanks for your support to our research! This is a confirmation for your participation in our study with <strong>" +
              this.childNames() +
              moment(this.appointmentTime).format(
                " [on] dddd [(]MMM Do[)] [at] h:mma"
              ) +
              "</strong>.</p>";
            break;

          case "ScheduleUpdate":
            opening =
              "<p>Dear " +
              parentName +
              ",</p><p>" +
              "This is an update on your visit with <strong>" +
              this.childNames() +
              moment(this.appointmentTime).format(
                " [on] dddd [(]MMM Do[)] [at] h:mma"
              ) +
              "</strong>.</p>";
            break;

          case "Introduction":
            opening =
              "<p>Dear " +
              parentName +
              ",</p><p>" +
              "We are " +
              this.$store.state.labName +
              ". We would love to have you and " +
              this.childNames() +
              " to participate in our study.</p>" +
              "Here is the information about the study:</p>";
            break;

          case "ThankYou":
            opening =
              "<p>Dear " +
              parentName +
              ",</p><p>" +
              "Thank you so much for participating in our study with " +
              this.childNames() +
              "! We had a wonderful time with you both! :-) </p>";
            break;

          case "Reminder":
            var dateLabel = "";

            var differentDays = moment
              .duration(
                moment(this.appointmentTime)
                  .startOf("day")
                  .diff(moment().startOf("day"))
              )
              .asDays();

            switch (differentDays) {
              case 1:
                dateLabel = " tomorrow";
                break;

              default:
                dateLabel = moment(this.appointmentTime).format(
                  " [this] dddd"
                );

                break;
            }

            if (this.appointments[0].Study.StudyType !== "Online") {
              opening =
                "<p>Dear " +
                parentName +
                ",</p><p>" +
                "Hope you are doing great! This is a reminder for your visit to " +
                this.$store.state.labName +
                " with <strong>" +
                this.childNames() +
                dateLabel +
                moment(this.appointmentTime).format(" [at] h:mma") +
                "</strong>.</p>" +
                this.$store.state.transportationInstructions;
            } else {
              opening =
                "<p>Dear " +
                parentName +
                ",</p><p>" +
                "Hope you are doing great! This is " +
                this.$store.state.labName +
                ". Just a reminder that you and <strong>" +
                this.childNames() +
                " will participate in our in our online study" +
                dateLabel +
                moment(this.appointmentTime).format(" [at] h:mma") +
                "</strong>.</p>";
            }

            break;
        }
      }
      return opening
    },

    emailStudyInfo() {
      // study information
      var studyInfo = "";
      var emailBodyList = [];

      // specific content for each schedueld study.
      switch (this.emailType) {
        case "Reminder":
          var ZoomLink = "Zoom Link not available.";

          if (this.appointments[0].PrimaryExperimenter.length > 0) {
            if (this.appointments[0].PrimaryExperimenter[0].ZoomLink) {
              ZoomLink =
                "<a href='" +
                this.appointments[0].PrimaryExperimenter[0].ZoomLink +
                "'>Zoom Link</a>";
            }
          }

          var emailBody = this.appointments[0].Study.ReminderTemplate.replace(
            /\${{ZoomLink}}/g,
            ZoomLink
          );

          if (this.appointments[0].Study.StudyType === "Online") {
            emailBody =
              emailBody +
              "<p>You can download Zoom for your computer here: <a href='https://zoom.us/download'>Download Link</a></p><p>" +
              "<a href='https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/EdhORdZeCwlPn-X54WquFz8Boegr1YpaNy9mzlW_wJ8ZjQ?e=hvDNGr'>CLICK HERE</a> to learn a few tips to setup online study with your child.</p>";
          }

          emailBody = emailBody.replace(/\${{childName}}/g, this.childNames());

          emailBodyList.push(emailBody)
          break;

        case "Confirmation":
        case "ScheduleUpdate":
          this.appointments.forEach((appointment) => {
            let emailBody = appointment.Study.EmailTemplate;
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
              "<a href='" +
              appointment.PrimaryExperimenter[0].ZoomLink +
              "'>Zoom Link</a>"
            );

            emailBodyList.push(emailBody);
          });

          break;

        case "Introduction":
          this.appointments.forEach((appointment) => {
            let emailBody = appointment.Study.Description;
            emailBodyList.push(emailBody);
          });

          break;

        case "ThankYou":
          // ##todo: we might just need to add the first study's template for thank you email.

          this.appointments.forEach((appointment) => {
            if (appointment.Study.FollowUPEmailSnippet != "") {
              if (appointment.Study.FollowUPEmailSnippet) {
                let emailBody = appointment.Study.FollowUPEmailSnippet;

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
              }
            }
          });

          break;
      }

      // adding studyInfo headers
      if (this.emailType === "Introduction" || this.emailType === "Confirmation" || this.emailType === "ScheduleUpdate") {

        if (this.appointments.length > 1) {
          // Get an array of child names from the appointments
          const childNames = this.appointments.map(appointment => appointment.FK_Child);

          // Check if all child names are unique
          const isChildUnique = Array.from(new Set(childNames));

          if (isChildUnique.length === 1) {
            // there is only one child participating in multiple studies

            emailBodyList.forEach((emailBody, index) => {
              switch (index) {
                case 0:
                  emailBodyList[index] = "<p><strong>Here is a brief introduction of the first study:</strong></p>" + emailBodyList[index];
                  break;
                case 1:
                  emailBodyList[index] = "<p><strong>The second study is about:</strong></p>" + emailBodyList[index];
                  break;
                case 2:
                  emailBodyList[index] = "<p><strong>The last study is about:</strong></p>" + emailBodyList[index];
                  break;
              }
            });
          } else {
            // multiple children participating in multiple studies
            emailBodyList.forEach((emailBody, index) => {
              switch (index) {
                case 0:
                  emailBodyList[index] = "<p><strong>Here is what " + this.appointments[index].Child.Name.split(" ")[0] + " will do:</strong></p>" + emailBodyList[index];
                  break;
                case 1:
                  emailBodyList[index] = "<p><strong>Here is what " + this.appointments[index].Child.Name.split(" ")[0] + " will do:</strong></p>" + emailBodyList[index];
                  break;
                case 2:
                  emailBodyList[index] = "<p><strong>Here is what " + this.appointments[index].Child.Name.split(" ")[0] + " will do:</strong></p>" + emailBodyList[index];
                  break;
              }
            });
          }
        } else {
          emailBodyList.unshift("<p><strong>Here is what this study is about:" + "</strong></p>");
        }
      }

      studyInfo = emailBodyList.join("");
      return studyInfo;
    },

    experimenterEmails() {
      var emails = [];

      this.appointments.forEach((appointment) => {
        appointment.PrimaryExperimenter.forEach((experimenter) => {
          emails.push(experimenter.Name + " <" + experimenter.Email + ">");
        });

        appointment.SecondaryExperimenter.forEach((experimenter) => {
          emails.push(experimenter.Name + " <" + experimenter.Email + ">");
        });
      });

      return emails.join(", ");
    },

    async sendEmail() {
      var formattedEmail = this.emailBody;
      formattedEmail = formattedEmail.replace(/<p>/g, "<p style='margin: 0px !important; padding: 0px; font-size: 12pt;'>");

      const [studyLabel] = this.studyLabels(this.appointments);

      formattedEmail = formattedEmail + studyLabel; // study labels, to insert special characters identifying studies, e.g., "#%#" + appointment.Study.StudyName + "#%# "

      var emailContent = {
        // from:
        //   this.$store.state.labName + " <" + this.$store.state.labEmail + ">",
        to: this.familyInfo.NamePrimary + " <" + this.emailAddress + " >",
        subject: this.emailSubject,
        body: formattedEmail,
        // labelNames: gmailLabels, // todo, add labelName back, but generate the labels within the function, rather than relying on input.
      };

      try {
        await email.send(emailContent);

        if (this.emailUpdate) {
          var editedFamilyInfo = JSON.parse(JSON.stringify(this.familyInfo));

          editedFamilyInfo.UpdatedBy = this.$store.state.userID;
          await family.update(editedFamilyInfo);
          this.emailUpdate = false;
        }
      } catch (error) {
        console.log(error);
      }

    },

    studyLabels(appointments) {

      var labels = [];
      const gmailLabels = []; //email labels, for Gmail.

      appointments.forEach((appointment) => {
        labels.push("#%#" + appointment.Study.StudyName + "#%#");
        gmailLabels.push(appointment.Study.StudyName);
      })

      const studyLabel = "<br><br><div style='opacity: 0'>" + labels.join('; ') + "</div>";
      return [studyLabel, gmailLabels];
    }
  },

  watch: {
    dialog(val) {
      if (val) {
        this.initializeEmail();
      } else {
        this.emailBody = "";
        this.emailSubject = "";
      }
    },

    emailType(val) {
      if (val) {
        this.initializeEmail();
      } else {
        this.emailBody = "";
        this.emailSubject = "";
      }
    },

    familyInfo(newVal) {
      if (newVal.Email) {
        this.emailAddress = newVal.Email;
      }
    }
  },

  mounted() {
    if (this.dialog) {
      this.initializeEmail();
    } else {
      this.emailBody = "";
      this.emailSubject = "";
    }

    if (this.familyInfo.Email) {
      this.emailAddress = this.familyInfo.Email;
    }
  },
};
</script>

<style>
.ck-editor__editable_inline:not(.ck-comment__input *) {
  height: 500px !important;
  overflow-y: auto;
}

.input-container .v-text-field {
  display: block;
  margin: 16px 80px 12px 50px;
  /* Adjust the space between the input boxes */
}

.input-container {
  margin: 24px 4px 8px;
  /* Adjust the space between the input boxes */
}

.v-application--is-ltr .v-text-field__prefix {
  font-weight: 600;
  font-size: 18px;
}
</style>
