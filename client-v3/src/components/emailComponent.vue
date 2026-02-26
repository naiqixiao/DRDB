<template>
  <v-container class="d-flex flex-column justify-end" style="gap: 20px;">
    <v-alert v-if="!familyInfo.Email" border="start" type="error" color="#c73460" density="compact" class="font-weight-bold">
      Participant email is not available.
    </v-alert>

    <v-text-field 
      style="width: 60%" 
      hide-details 
      prefix="TO: " 
      v-model="emailAddress" 
      :rules="$rules.email"
      @update:model-value="checkEmail"
      variant="outlined"
      density="compact"
    ></v-text-field>
    
    <v-text-field 
      style="width: 60%; margin-bottom: 20px;" 
      hide-details 
      prefix="SUBJECT: "
      v-model="emailSubject"
      variant="outlined"
      density="compact"
    ></v-text-field>

    <ckeditor ref="emailBodyRef" :editor="editor" v-model="emailBody" :config="editorConfig"></ckeditor>
  </v-container>
</template>

<script>
import email from "@/services/email";
import family from "@/services/family";
import moment from "moment";
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Ckeditor } from '@ckeditor/ckeditor5-vue';

export default {
  name: "emailComponent",
  components: {
    ckeditor: Ckeditor
  },
  props: {
    emailType: String,
    appointmentTime: String,
    familyInfo: {
      type: Object,
      default: () => ({})
    },
    appointments: {
      type: Array,
      default: () => []
    },
    dialog: Boolean,
  },
  data() {
    return {
      emailAddress: "",
      emailUpdate: false,
      emailBody: "",
      emailSubject: "",
      editor: ClassicEditor,
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
      if (!this.appointments || this.appointments.length === 0) return "";
      let nameList = this.appointments.map((appointment) => {
        if (appointment.Child && appointment.Child.Name) {
          return appointment.Child.Name.split(" ")[0];
        }
        return "";
      }).filter(name => name !== "");

      nameList = Array.from(new Set(nameList));

      let childNames = "";

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
          this.emailSubject = "Study appointment for " + this.childNames() + " on " + moment(this.appointmentTime).format("MMM D (ddd), [at] h:mma");
          break;
        case "ScheduleUpdate":
          this.emailSubject = "An update on your visit on " + moment(this.appointmentTime).format("MMM D (ddd), [at] h:mma");
          break;
        case "Introduction":
          this.emailSubject = "An eligible study for " + this.childNames();
          break;
        case "Reschedule":
        case "cancelledReminder":
        case "noShowReminder":
          this.emailSubject = "Reschedule " + this.childNames() + "'s study appointment";
          break;
        case "Follow-up":
          this.emailSubject = "We would love to hear from you: Invitation to participate in our study";
          break;
        case "Reminder":
          this.emailSubject = "Reminder for your study appointment with " + this.childNames();
          break;
        case "ThankYou":
          this.emailSubject = "Thank you for your participation!";
          break;
      }
    },

    generateEmailBody() {
      const opening = this.emailOpening();
      const location = this.$store.state.transportationInstructions;
      const name = this.$store.state.name;
      const role = this.$store.state.role;

      const closing =
        (this.$store.state.emailClosing || "") +
        "<p>Best,<br>" +
        name +
        "<br>" +
        role +
        "<br>" +
        this.$store.state.labName + "</p>";

      const TYclosing =
        (this.$store.state.tyEmailClosing || "") +
        "<p>Best,<br>" +
        name +
        "<br>" +
        role +
        "<br>" +
        this.$store.state.labName + "</p>";

      const studyInfo = this.emailStudyInfo();
      let emailObj = "";

      if (this.emailType === "ThankYou") {
        emailObj = opening + studyInfo + TYclosing;
      } else {
        if (this.appointments && this.appointments.length > 0 && this.appointments[0].Study && this.appointments[0].Study.StudyType === "Online") {
          emailObj = opening + studyInfo + "<p>This study is an online study. You can participate at home! :)</p>" + closing;
        } else {
          emailObj = opening + studyInfo + (location || "") + closing;
        }
      }

      emailObj = emailObj.replace(/\/p><p/g, "/p><p></p><p");
      emailObj = emailObj.replace(/<p>/g, "<p style='margin: 0px !important; padding: 0px;'>");

      return emailObj;
    },

    emailOpening() {
      if (this.appointments && this.appointments.length > 0) {
        let opening = "";
        let parentName = "Caregiver";
        if (this.familyInfo.NamePrimary) {
          parentName = this.familyInfo.NamePrimary.split(" ")[0];
        }

        switch (this.emailType) {
          case "Confirmation":
            opening = "<p>Dear " + parentName + ",</p><p>Thanks for your support to our research! This is a confirmation for your participation in our study with <strong>" + this.childNames() + moment(this.appointmentTime).format(" [on] dddd [(]MMM Do[)] [at] h:mma") + "</strong>.</p>";
            break;
          case "ScheduleUpdate":
            opening = "<p>Dear " + parentName + ",</p><p>This is an update on your visit with <strong>" + this.childNames() + moment(this.appointmentTime).format(" [on] dddd [(]MMM Do[)] [at] h:mma") + "</strong>.</p>";
            break;
          case "Introduction":
            opening = "<p>Dear " + parentName + ",</p><p>We are " + this.$store.state.labName + ". We would love to have you and " + this.childNames() + " to participate in our study.</p>Here is the information about the study:</p>";
            break;
          case "Reschedule":
            opening = "<p>Dear " + parentName + ",</p><p>I'm happy to schedule another visit for you and " + this.childNames() + ".</p><p>We would appreciate it if you could provide us with your availability by replying to this email. We will do our best to find a time that works for you.</p>";
            break;
          case "cancelledReminder":
            opening = "<p>Dear " + parentName + ",</p><p>We are sorry for the cancellation of " + this.childNames() + "'s study appointment. We are looking forward to your visit soon.</p><p>We would appreciate it if you could provide us with your availability by replying to this email. We will do our best to find a time that works for you and " + this.childNames() + ".</p>";
            break;
          case "noShowReminder":
            opening = "<p>Dear " + parentName + ",</p><p>We missed you and " + this.childNames() + " today. We hope everything is okay.</p><p>We understand that life can get busy and unpredictable sometimes. We're happy to reschedule your child's visit our lab, if you're still interested in participation.</p><p>We would appreciate it if you could provide us with your availability by replying to this email. We will do our best to find a time that works for you and " + this.childNames() + ".</p>";
            break;
          case "Follow-up":
            opening = "<p>Dear " + parentName + ",</p><p>This is " + this.$store.state.labName + ". We hope this email finds you well!</p><p>We are writing to follow up with our previous email regarding inviting " + this.childNames() + " to participate in our study.</p><p>We would appreciate it if you could provide us with your availability by replying to this email. We will do our best to find a time that works for you and " + this.childNames() + ".</p>";
            break;
          case "ThankYou":
            opening = "<p>Dear " + parentName + ",</p><p>Thank you so much for participating in our study with " + this.childNames() + "! We had a wonderful time with you both! :-) </p>";
            break;
          case "Reminder":
            let dateLabel = "";
            let differentDays = moment.duration(moment(this.appointmentTime).startOf("day").diff(moment().startOf("day"))).asDays();

            if (differentDays === 1) {
              dateLabel = " tomorrow";
            } else {
              dateLabel = moment(this.appointmentTime).format(" [this] dddd");
            }

            if (this.appointments[0].Study.StudyType !== "Online") {
              opening = "<p>Dear " + parentName + ",</p><p>Hope you are doing great! This is a reminder for your visit to " + this.$store.state.labName + " with <strong>" + this.childNames() + dateLabel + moment(this.appointmentTime).format(" [at] h:mma") + "</strong>.</p>" + (this.$store.state.transportationInstructions || "");
            } else {
              opening = "<p>Dear " + parentName + ",</p><p>Hope you are doing great! This is " + this.$store.state.labName + ". Just a reminder that you and <strong>" + this.childNames() + " will participate in our in our online study" + dateLabel + moment(this.appointmentTime).format(" [at] h:mma") + "</strong>.</p>";
            }
            break;
        }
        return opening;
      }
      return "";
    },

    emailStudyInfo() {
      let studyInfo = "";
      let emailBodyList = [];

      switch (this.emailType) {
        case "Reminder":
          if (this.appointments && this.appointments.length > 0) {
            let ZoomLink = "Zoom Link not available.";
            if (this.appointments[0].PrimaryExperimenter && this.appointments[0].PrimaryExperimenter.length > 0) {
              if (this.appointments[0].PrimaryExperimenter[0].ZoomLink) {
                ZoomLink = "<a href='" + this.appointments[0].PrimaryExperimenter[0].ZoomLink + "'>Zoom Link</a>";
              }
            }

            let emailBody = (this.appointments[0].Study.ReminderTemplate || "").replace(/\${{ZoomLink}}/g, ZoomLink);

            if (this.appointments[0].Study.StudyType === "Online") {
              emailBody += "<p>You can download Zoom for your computer here: <a href='https://zoom.us/download'>Download Link</a></p><p><a href='https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/EdhORdZeCwlPn-X54WquFz8Boegr1YpaNy9mzlW_wJ8ZjQ?e=hvDNGr'>CLICK HERE</a> to learn a few tips to setup online study with your child.</p>";
            }

            emailBody = emailBody.replace(/\${{childName}}/g, this.childNames());
            emailBodyList.push(emailBody);
          }
          break;

        case "Confirmation":
        case "ScheduleUpdate":
          this.appointments.forEach((appointment) => {
            let emailBody = appointment.Study.EmailTemplate || "";
            if (appointment.Child.Sex === "F") {
              emailBody = emailBody.replace(/\${{he\/she}}/g, "she");
              emailBody = emailBody.replace(/\${{his\/her}}/g, "her");
              emailBody = emailBody.replace(/\${{him\/her}}/g, "her");
            } else {
              emailBody = emailBody.replace(/\${{he\/she}}/g, "he");
              emailBody = emailBody.replace(/\${{his\/her}}/g, "his");
              emailBody = emailBody.replace(/\${{him\/her}}/g, "him");
            }

            emailBody = emailBody.replace(/\${{childName}}/g, appointment.Child.Name || "");
            emailBody = emailBody.replace(/\. he/g, ". He");
            emailBody = emailBody.replace(/\. his/g, ". His");
            emailBody = emailBody.replace(/\. she/g, ". She");
            emailBody = emailBody.replace(/\. her/g, ". Her");

            if (appointment.PrimaryExperimenter && appointment.PrimaryExperimenter.length > 0 && appointment.PrimaryExperimenter[0].ZoomLink) {
                emailBody = emailBody.replace(/\${{ZoomLink}}/g, "<a href='" + appointment.PrimaryExperimenter[0].ZoomLink + "'>Zoom Link</a>");
            }

            emailBodyList.push(emailBody);
          });
          break;

        case "Introduction":
          this.appointments.forEach((appointment) => {
            emailBodyList.push(appointment.Study.Description || "");
          });
          break;

        case "ThankYou":
          this.appointments.forEach((appointment) => {
            if (appointment.Study.FollowUPEmailSnippet && appointment.Study.FollowUPEmailSnippet !== "") {
              let emailBody = appointment.Study.FollowUPEmailSnippet;

              if (appointment.Child.Sex === "F") {
                emailBody = emailBody.replace(/\${{he\/she}}/g, "she");
                emailBody = emailBody.replace(/\${{his\/her}}/g, "her");
                emailBody = emailBody.replace(/\${{him\/her}}/g, "her");
              } else {
                emailBody = emailBody.replace(/\${{he\/she}}/g, "he");
                emailBody = emailBody.replace(/\${{his\/her}}/g, "his");
                emailBody = emailBody.replace(/\${{him\/her}}/g, "him");
              }

              emailBody = emailBody.replace(/\${{childName}}/g, appointment.Child.Name || "");
              emailBody = emailBody.replace(/\. he/g, ". He");
              emailBody = emailBody.replace(/\. his/g, ". His");
              emailBody = emailBody.replace(/\. she/g, ". She");
              emailBody = emailBody.replace(/\. her/g, ". Her");

              emailBodyList.push(emailBody);
            }
          });
          break;
      }

      if (this.emailType === "Introduction" || this.emailType === "Confirmation" || this.emailType === "ScheduleUpdate") {
        if (this.appointments.length > 1) {
          const childNames = this.appointments.map(appointment => appointment.FK_Child);
          const isChildUnique = Array.from(new Set(childNames));

          if (isChildUnique.length === 1) {
            emailBodyList.forEach((emailBody, index) => {
              if (index === 0) emailBodyList[index] = "<p><strong>Here is a brief introduction of the first study:</strong></p>" + emailBodyList[index];
              else if (index === 1) emailBodyList[index] = "<p><strong>The second study is about:</strong></p>" + emailBodyList[index];
              else if (index === 2) emailBodyList[index] = "<p><strong>The last study is about:</strong></p>" + emailBodyList[index];
            });
          } else {
            emailBodyList.forEach((emailBody, index) => {
              if (index <= 2 && this.appointments[index].Child && this.appointments[index].Child.Name) {
                  let firstName = this.appointments[index].Child.Name.split(" ")[0];
                  emailBodyList[index] = "<p><strong>Here is what " + firstName + " will do:</strong></p>" + emailBodyList[index];
              }
            });
          }
        } else {
          emailBodyList.unshift("<p><strong>Here is what this study is about:</strong></p>");
        }
      }

      studyInfo = emailBodyList.join("");
      return studyInfo;
    },

    experimenterEmails() {
      let emails = [];
      if (this.appointments) {
        this.appointments.forEach((appointment) => {
          if (appointment.PrimaryExperimenter) {
            appointment.PrimaryExperimenter.forEach((experimenter) => {
              emails.push(experimenter.Name + " <" + experimenter.Email + ">");
            });
          }
          if (appointment.SecondaryExperimenter) {
            appointment.SecondaryExperimenter.forEach((experimenter) => {
              emails.push(experimenter.Name + " <" + experimenter.Email + ">");
            });
          }
        });
      }
      return emails.join(", ");
    },

    async sendEmail() {
      let formattedEmail = this.emailBody;
      formattedEmail = formattedEmail.replace(/<p>/g, "<p style='margin: 0px !important; padding: 0px; font-size: 12pt;'>");

      const [studyLabel, gmailLabels] = this.studyLabels(this.appointments);

      formattedEmail = formattedEmail + studyLabel;

      const emailContent = {
        to: this.familyInfo.NamePrimary + " <" + this.emailAddress + ">",
        subject: this.emailSubject,
        body: formattedEmail,
        labelNames: gmailLabels,
      };

      try {
        await email.send(emailContent);

        if (this.emailUpdate) {
          let editedFamilyInfo = JSON.parse(JSON.stringify(this.familyInfo));
          editedFamilyInfo.UpdatedBy = this.$store.state.userID;
          await family.update(editedFamilyInfo);
          this.emailUpdate = false;
        }
        
        return true; // Used by parent to know it succeeded
      } catch (error) {
        console.error(error);
        alert("Email was not sent successfully. Please send it again manually!");
        return false;
      }
    },

    studyLabels(appointments) {
      let labels = [];
      const gmailLabels = [];

      if (appointments) {
        appointments.forEach((appointment) => {
          if (appointment.Study && appointment.Study.StudyName) {
            labels.push("#%#" + appointment.Study.StudyName + "#%#");
            gmailLabels.push(appointment.Study.StudyName);
          }
        });
      }

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
      if (val && this.dialog) {
        this.initializeEmail();
      } else {
        this.emailBody = "";
        this.emailSubject = "";
      }
    },
    familyInfo(newVal) {
      if (newVal && newVal.Email) {
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

    if (this.familyInfo && this.familyInfo.Email) {
      this.emailAddress = this.familyInfo.Email;
    }
  }
};
</script>

<style>
.ck-editor__editable_inline:not(.ck-comment__input *) {
  height: 500px !important;
  overflow-y: auto;
}
.v-field__prefix {
  font-weight: 600;
  font-size: 16px;
}
</style>
