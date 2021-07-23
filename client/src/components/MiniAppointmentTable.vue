<template>
  <v-row dense>
    <v-col
      cols="12"
      md="3"
      style="padding: 12px !important"
      v-for="(appointment, indexAppointments) in Schedule.Appointments"
      :key="appointment.id"
    >
      <v-card
        class="child-card d-flex flex-column"
        height="180px"
        style="border-width: medium !important; margin: 12px"
      >
        <v-card-title class="title" style="padding: 8px">
          <span
            class="d-inline-block text-truncate"
            style="max-width: 100px; padding-right: 2px"
            >{{ appointment.Child.Name }}</span
          >
          <span class="body-1" style="color: var(--v-primary)">
            {{
              "(" +
                appointment.FK_Family +
                appointment.Child.IdWithinFamily +
                ")"
            }}
          </span>
          <v-spacer></v-spacer>
          <v-icon
            v-if="appointment.Child.Sex == 'M'"
            color="light-blue darken-4"
            >mdi-human-male</v-icon
          >
          <v-icon v-else color="pink darken-1">mdi-human-female</v-icon>
        </v-card-title>

        <v-card-text
          class="body-1"
          align="start"
          style="padding-left: 8px; padding-top: 4px; padding-bottom: 4px; color: var(--v-primary)"
        >
          <v-row style="height: 70px">
            <body
              class="d-inline-block text-truncate"
              align="start"
              style="max-width: 90%; z-index:2"
              v-html="ExperimentersNames(appointment)"
            ></body>
          </v-row>
        </v-card-text>
        <v-spacer></v-spacer>
        <v-card-actions>
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-icon
                  color="primary"
                  @click="updateExperimenters(appointment, indexAppointments)"
                  >how_to_reg</v-icon
                >
              </div>
            </template>
            <span>Update experimenters.</span>
          </v-tooltip>
          <v-spacer></v-spacer>
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-icon
                  color="primary"
                  @click="removeAppointment(indexAppointments)"
                  :disabled="Schedule.Appointments.length == 1"
                  >delete</v-icon
                >
              </div>
            </template>
            <span>Delete this study appointment</span>
          </v-tooltip>
        </v-card-actions>
      </v-card>
    </v-col>

    <!-- <v-col cols="12" md="2" style="padding: 12px !important">
      <v-card
        class="child-card d-flex align-center justify-center"
        height="180px"
        style="border-width: medium !important; border-style: dashed !important"
      >
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-btn
                dark
                outlined
                large
                fab
                color="primary"
                style="border-width: medium; border-style: dashed !important"
                @click.stop="editNewAppointments"
              >
                <v-icon dark>add</v-icon>
              </v-btn>
            </div>
          </template>
          <span>Add new studies to this appointment.</span>
        </v-tooltip>
      </v-card>
    </v-col> -->
    <v-spacer></v-spacer>

    <!-- <v-col cols="12" md="2" class="d-flex align-center justify-center">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <div v-on="on">
            <v-btn
              large
              @click.stop="emailParents"
              :disabled="!appointmentUpdated"
              >Email parents</v-btn
            >
          </div>
        </template>
        <span>Send an email to the parents about the update</span>
      </v-tooltip>
    </v-col> -->

    <v-dialog v-model="dialogAddAppointments" max-width="1200px" persistent>
      <v-card>
        <v-card-title class="title"
          >Add study appointment(s) to the visit</v-card-title
        >
        <v-container fluid>
          <v-row>
            <v-col cols="12" md="2" v-for="child in Children" :key="child.id">
              <v-btn
                class="text-capitalize"
                rounded
                color="primary"
                @click="newAppointmentSlot(child)"
                :disabled="potentialStudies(child).selectableStudies.length < 1"
                >{{ child.Name }}</v-btn
              >
            </v-col>
          </v-row>
          <v-row>
            <v-col
              cols="12"
              md="12"
              v-for="(appointment, indexNewAppointment) in newAppointments"
              :key="appointment.index"
            >
              <NewAppointments
                ref="newAppointments"
                :child="appointment.Child"
                :scheduleId="appointment.FK_Schedule"
                :potentialStudies="
                  potentialStudies(appointment.Child).potentialStudyList
                "
                :index="indexNewAppointment"
                @selectStudy="selectStudy"
                @deleteAppointment="deleteAppointment"
                @emitSelectedStudy="receiveSelectedStudy"
                align="start"
              />
            </v-col>
          </v-row>
        </v-container>

        <v-card-actions>
          <v-row justify="space-between" style="height: 50px">
            <v-col md="4"></v-col>
            <v-col md="2">
              <v-btn color="primary" @click="closeNewAppointment">Cancel</v-btn>
            </v-col>
            <v-col md="2">
              <v-btn color="primary" @click="saveNewAppointments"
                >Confirm</v-btn
              >
            </v-col>
            <v-col md="4"></v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogUpdateExperimenters" max-width="800px">
      <v-card height="300px" class="d-flex flex-column">
        <v-card-title class="title"
          >Update experimenters for the current appointment</v-card-title
        >
        <v-row align="center" justify="center">
          <v-col cols="12" md="4">
            <v-select
              :items="primaryaryExperimenterList"
              :item-value="'id'"
              :item-text="'Name'"
              v-model="selectedExperimenters"
              return-object
              label="Experimenter (Primary)"
              hide-details
              dense
              chip
            ></v-select>
          </v-col>
          <v-col cols="12" md="2"></v-col>
          <v-col cols="12" md="4">
            <v-select
              :items="secondaryExperimenterList"
              :item-value="'id'"
              :item-text="'Name'"
              v-model="selectedExperimenters_2nd"
              return-object
              label="Experimenters (Secondary)"
              multiple
              hide-details
              dense
              chip
            ></v-select>
          </v-col>
        </v-row>
        <!-- <v-spacer></v-spacer> -->
        <v-card-actions>
          <v-row justify="space-between" style="height: 50px">
            <v-col md="4"></v-col>
            <v-col md="2">
              <v-btn color="primary" @click="dialogUpdateExperimenters = false"
                >Cancel</v-btn
              >
            </v-col>
            <v-col md="2">
              <v-btn
                color="primay"
                @click="saveExperimenters"
                :loading="loadingStatus"
                >Save</v-btn
              >
            </v-col>
            <v-col md="4"></v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogEmail" max-width="1000px" persistent>
      <v-card>
        <Email
          ref="Email"
          :dialog="dialogEmail"
          :familyInfo="Schedule.Family"
          :scheduleInfo="Schedule"
          :appointments="Schedule.Appointments"
          emailType="ScheduleUpdate"
        ></Email>
        <v-divider></v-divider>
        <v-card-actions>
          <v-row justify="space-between" align="center">
            <v-col cols="12" md="4"></v-col>
            <v-col cols="12" md="2">
              <v-btn @click="closeEmail">Cancel</v-btn>
            </v-col>
            <v-col cols="12" md="2">
              <v-btn color="primary" @click="sendEmail">
                <v-icon dark left v-show="!appointmentUpdated"
                  >mdi-checkbox-marked-circle</v-icon
                >Send Email
              </v-btn>
            </v-col>
            <v-col cols="12" md="4"></v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import NewAppointments from "@/components/NewAppointments";
// import personnel from "@/services/personnel";

import family from "@/services/family";
import appointment from "@/services/appointment";
import store from "@/store";
import email from "@/services/email";
import moment from "moment";

import Email from "@/components/Email";

export default {
  components: {
    NewAppointments,
    Email,
  },
  props: {
    Schedule: Object,
    Index: Number,
    potentialExperimenters: Array,
  },

  data() {
    return {
      Children: [],
      dialogAppointment: false,
      dialogUpdateExperimenters: false,
      dialogAddAppointments: false,
      newAppointments: [],
      newAppointment: {},
      editedAppointment: {},
      selectedExperimenters: { id: 0 },
      selectedExperimenters_2nd: [],
      index: -1,
      Experimenters: [],
      previousIndex: -1,
      appointmentUpdated: false,
      dialogEmail: false,
      defaultAppointment: {
        index: null,
        FK_Family: null,
        FK_Child: null,
        FK_Study: null,
        FK_Schedule: null,
        PrimaryExperimenter: [],
        SecondaryExperimenter: [],
      },
      loadingStatus: false,
    };
  },
  methods: {
    newAppointmentSlot(child) {
      var newAppointment = Object.assign({}, this.defaultAppointment);

      newAppointment.FK_Child = child.id;
      newAppointment.Child = child;
      newAppointment.FK_Schedule = this.Schedule.id;
      newAppointment.FK_Family = child.FK_Family;
      newAppointment.index = this.newAppointments.length;

      this.newAppointments.push(newAppointment);
    },

    async editNewAppointments() {
      const queryString = {
        id: this.Schedule.FK_Family,
        trainingMode: this.$store.state.trainingMode,
      };

      var Results = await family.search(queryString);
      if (Results.data.families[0].Children) {
        this.Children = Results.data.families[0].Children;
      }
      this.dialogAddAppointments = true;
    },

    studyElegibility(study, child) {
      if (child.DoB != null) {
        var age =
          child.Age >= study.MinAge * 30.5 - 1 &&
          child.Age <= study.MaxAge * 30.5 - 1;

        var asd = false;

        switch (study.ASDParticipant) {
          case "Only":
            child.Family.AutismHistory ? (asd = true) : (asd = false);
            break;

          case "Exclude":
            child.Family.AutismHistory ? (asd = false) : (asd = true);

            break;

          case "Include":
            asd = true;
            break;
        }

        var hearing = false;

        switch (study.HearingLossParticipant) {
          case "Only":
            child.HearingLoss ? (hearing = true) : (hearing = false);
            break;

          case "Exclude":
            child.HearingLoss ? (hearing = false) : (hearing = true);

            break;

          case "Include":
            hearing = true;
            break;
        }

        var vision = false;
        switch (study.VisionLossParticipant) {
          case "Only":
            child.VisionLoss ? (vision = true) : (vision = false);
            break;

          case "Exclude":
            child.VisionLoss ? (vision = false) : (vision = true);

            break;

          case "Include":
            vision = true;
            break;
        }

        var premature = false;
        switch (study.PrematureParticipant) {
          case "Only":
            child.PrematureBirth ? (premature = true) : (premature = false);
            break;

          case "Exclude":
            child.PrematureBirth ? (premature = false) : (premature = true);

            break;

          case "Include":
            premature = true;
            break;
        }

        var illness = false;
        switch (study.IllParticipant) {
          case "Only":
            child.Illness ? (illness = true) : (illness = false);
            break;

          case "Exclude":
            child.Illness ? (illness = false) : (illness = true);

            break;

          case "Include":
            illness = true;
            break;
        }

        return age && asd && hearing && vision && premature && illness;
      } else {
        return false;
      }
    },

    potentialStudies(child) {
      var ElegibleStudies = [];

      store.state.studies.forEach((study) => {
        if (!study.Completed) {
          if (this.studyElegibility(study, child)) {
            ElegibleStudies.push(study.id);
          }
        }
      });

      var uniquePreviousStudies = [];

      if (child.Appointments) {
        child.Appointments.forEach((appointment) => {
          uniquePreviousStudies.push(appointment.FK_Study);
        });
        uniquePreviousStudies = Array.from(new Set(uniquePreviousStudies));
      }

      var potentialStudies = ElegibleStudies.filter(
        (study) => !uniquePreviousStudies.includes(study)
      );

      // check the selected studies.
      var currentSelectedStudies = [];
      if (this.newAppointments.length > 0) {
        for (var i = 0; i < this.newAppointments.length; i++) {
          if (this.newAppointments[i].FK_Child == child.id) {
            currentSelectedStudies.push(this.newAppointments[i].FK_Study);
          }
        }
      }

      var selectableStudies = potentialStudies.filter(
        (study) => !currentSelectedStudies.includes(study)
      );

      var potentialStudyList = store.state.studies.filter((study) =>
        potentialStudies.includes(study.id)
      );

      return {
        potentialStudyList: potentialStudyList,
        selectableStudies: selectableStudies,
      };
    },

    receiveSelectedStudy(selectedStudy) {
      this.newAppointments[selectedStudy.index].FK_Study =
        selectedStudy.studyId;
      this.newAppointments[selectedStudy.index].FK_Child =
        selectedStudy.childId;
    },

    deleteAppointment(index) {
      this.newAppointments.splice(index, 1);
    },

    selectStudy(extraAppointments) {
      Object.assign(
        this.newAppointments[extraAppointments.index],
        extraAppointments.appointment
      );

      if (this.Experimenters.lenth < 1) {
        this.Experimenters = extraAppointments.attendees;
      } else {
        extraAppointments.attendees.forEach((experimenter) => {
          this.Experimenters.push(experimenter);
        });
      }
    },

    async saveNewAppointments() {
      this.Experimenters = [];

      for (var i = 0; i < this.newAppointments.length; i++) {
        this.$refs.newAppointments[i].selectStudy();
      }

      try {
        const updatedSchedule = await appointment.create(this.newAppointments);

        updatedSchedule.data.Appointments.forEach((newAppointment) => {
          this.Schedule.Appointments.forEach((appointment) => {
            if (newAppointment.id !== appointment.id) {
              this.Schedule.Appointments.push(newAppointment);
            }
          });
        });

        this.Schedule.updatedAt = updatedSchedule.data.updatedAt;

        // //Prepare information for email
        // this.Schedule.Appointments.forEach((appointment) => {
        //   appointment.Schedule = {};
        //   appointment.Schedule.AppointmentTime =
        //     updatedSchedule.data.AppointmentTime;
        //   appointment.Schedule.Status = updatedSchedule.data.Status;
        // });

        // this.Schedule.Appointments[0].Child.Family = this.Schedule.Appointments[0].Family;
        // //

        this.appointmentUpdated = true;

        this.closeNewAppointment();

        console.log("Appointments updated.");
      } catch (error) {
        console.error(error);
      }
    },

    closeNewAppointment() {
      setTimeout(() => {
        this.newAppointments = [];
      }, 300);
      this.dialogAddAppointments = false;
    },

    save() {
      this.$refs.siblingTable.saveAppointment();
    },

    async removeAppointment(index) {
      try {
        if (this.Schedule.Appointments[index].id) {
          const updatedSchedule = await appointment.delete({
            id: this.Schedule.Appointments[index].id,
            FK_Schedule: this.Schedule.id,
          });

          this.Schedule.Appointments.splice(index, 1);

          this.Schedule.updatedAt = updatedSchedule.data.updatedAt;

          this.appointmentUpdated = true;

          console.log("Appointment deleted.");
        }
      } catch (error) {
        console.error(error);
      }
    },

    updateExperimenters(appointment, index) {
      // used to change experimenters of a given appointment
      this.editedAppointment = appointment;
      this.selectedExperimenters = appointment.PrimaryExperimenter[0];
      this.selectedExperimenters_2nd = appointment.SecondaryExperimenter;
      this.index = index;

      this.dialogUpdateExperimenters = true;
    },

    async saveExperimenters() {
      this.loadingStatus = true;

      this.editedAppointment.PrimaryExperimenter[0] = this.selectedExperimenters;
      this.editedAppointment.SecondaryExperimenter = this.selectedExperimenters_2nd;

      // var attendees = [];

      // attendees.push({
      //   displayName: this.selectedExperimenters.Name,
      //   email: this.selectedExperimenters.Calendar,
      // });

      // if (this.selectedExperimenters_2nd.length > 0) {
      //   this.selectedExperimenters_2nd.forEach((experimenter) => {
      //     attendees.push({
      //       displayName: experimenter.Name,
      //       email: experimenter.Calendar,
      //     });
      //   });
      // }

      try {
        await appointment.updateExperimenters({
          updatedExperimenters: this.selectedExperimenters,
          updatedExperimenters_2nd: this.selectedExperimenters_2nd,
          calendarId: this.Schedule.calendarEventId,
          scheduleId: this.Schedule.id,
          appointmentId: this.editedAppointment.id,
        });

        this.Schedule.Appointments[this.index] = this.editedAppointment;

        this.Schedule.updatedAt = new Date().toString();
      } catch (error) {
        console.log(error);
      }

      this.loadingStatus = false;

      this.closeUpdateExperimenter();
    },

    closeUpdateExperimenter() {
      this.editedAppointment = {};
      this.selectedExperimenters = { id: 0 };
      this.selectedExperimenters_2nd = [];
      this.index = -1;
      this.dialogUpdateExperimenters = false;
    },

    emailParents() {
      this.dialogEmail = true;
    },

    async sendEmail() {
      try {
        await this.$refs.Email.sendEmail();

        this.appointmentUpdated = false;
      } catch (error) {
        console.log(error);
        alert("Email wasn't sent successfully, please try again.");
      }

      this.closeEmail();
    },

    closeEmail() {
      this.dialogEmail = false;
    },

    childNames() {
      var nameList = this.Schedule.Appointments.map((appointment) => {
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

    async autoEmail() {
      // send an email to parents about appointment updates.
      // this email will be sent automatically, if researchers forgot to send.

      var parentName = "Caregiver";
      if (this.Schedule.Family.NamePrimary) {
        parentName = this.Schedule.Family.NamePrimary.split(" ")[0];
      }

      const emailSubject =
        "An update on your visit " +
        // this.childNames() +
        " on " +
        moment(this.Schedule.AppointmentTime).format("MMM D (ddd), [at] h:mma");
      const opening =
        "<p>Dear " +
        parentName +
        ",</p>" +
        "<p>This is an update on your visit with " +
        this.childNames() +
        moment(this.Schedule.AppointmentTime).format(
          " [on] dddd [(]MMM Do[)] [at] h:mma"
        ) +
        ".</p>";

      var emailBodyList = [];

      this.Schedule.Appointments.forEach((appointment) => {
        var emailBody = appointment.Study.EmailTemplate;

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

      // location
      const location = this.$store.state.transportationInstructions;

      // closing
      const closing = this.$store.state.emailClosing;
      "<p>Best,<br>" +
        this.$store.state.name +
        "<br>" +
        this.$store.state.role +
        "<br>" +
        this.$store.state.labName +
        "</p>";

      const emailBody =
        opening + emailBodyList.join("<p></p>") + location + closing;

      const emailContent = {
        from:
          this.$store.state.labName + "<" + this.$store.state.labEmail + ">",
        // cc: "lab email <nx@kangleelab.com>",
        to:
          this.Schedule.Family.NamePrimary +
          "<" +
          this.Schedule.Family.Email +
          ">",
        // to: this.Schedule.NamePrimary + "<" + this.$store.state.labEmail + ">",
        subject: emailSubject,
        body: emailBody,
      };

      try {
        await email.send(emailContent);
      } catch (error) {
        console.log(error);
      }
    },

    ExperimentersNames(appointment) {
      var E1 = "not assigned";
      if (appointment.PrimaryExperimenter.length > 0) {
        E1 = appointment.PrimaryExperimenter[0].Initial;
      }

      var E2 = appointment.SecondaryExperimenter.map((experimenter) => {
        return experimenter.Initial;
      });

      var E22 = "";
      if (appointment.SecondaryExperimenter.length > 0) {
        E22 = E2.join(", ");
      } else {
        E22 = "not assigned";
      }

      var body =
        "<strong>" +
        appointment.Study.StudyName +
        "</strong> (" +
        appointment.Study.StudyType +
        ")" +
        "<br>" +
        "<strong>E1:</strong> " +
        E1 +
        "<br>" +
        "<strong>E2:</strong> " +
        E22;

      if (
        appointment.PrimaryExperimenter.length > 0 &&
        appointment.Study.StudyType == "Online"
      ) {
        body =
          body +
          "<br>" +
          "<strong><a href='" +
          appointment.PrimaryExperimenter[0].ZoomLink +
          "' target='_blank' >" +
          appointment.PrimaryExperimenter[0].ZoomLink +
          "</a></strong>";
      } else {
        body = body + "<br>" + "<strong>Zoom link not available</strong>";
      }

      return body;
    },
  },

  computed: {
    primaryaryExperimenterList() {
      var primaryaryExperimenterList = [];
      var appointment = this.editedAppointment;
      if ("Study" in appointment) {
        primaryaryExperimenterList = appointment.Study.Experimenters;
      }

      return primaryaryExperimenterList;
    },

    secondaryExperimenterList() {
      var secondaryExperimenterList = [];

      var appointment = this.editedAppointment;
      if ("Study" in appointment) {
        if (this.selectedExperimenters) {
          secondaryExperimenterList = appointment.Study.Experimenters.filter(
            (experimenter) => experimenter.id !== this.selectedExperimenters.id
          );
        }
      }
      return secondaryExperimenterList;
    },
  },

  // asyncComputed: {
  //   async potentialExperimenters() {
  //     if (this.editedAppointment.FK_Study) {
  //       try {
  //         var queryString = {
  //           study: this.editedAppointment.FK_Study,
  //         };

  //         const results = await personnel.search(queryString);

  //         // filter the output based on experimenters' availability on the participation date.
  //         // this.participationDate

  //         return results.data;
  //       } catch (error) {
  //         console.log(error);
  //       }
  //     } else {
  //       return [];
  //     }
  //   },
  // },

  watch: {
    dialog(val) {
      val || this.close();
    },

    dialogUpdateExperimenters(val) {
      val || this.closeUpdateExperimenter();
    },

    dialogAddAppointments(val) {
      val || this.closeNewAppointment();
    },

    dialogEmail(val) {
      val || this.closeEmail();
    },
  },

  async beforeDestroy() {
    if (this.appointmentUpdated) {
      try {
        await this.autoEmail();

        this.appointmentUpdated = false;
        alert("An email about the appointment updates is sent to parents.");
      } catch (error) {
        alert(
          "No email about the appointment updates is sent to parents.\nPlease send an email manually."
        );
      }
    }
  },

  async beforeUpdate() {
    if (this.appointmentUpdated && this.previousIndex != this.Index) {
      try {
        await this.autoEmail();

        this.appointmentUpdated = false;
        alert("An email about the appointment updates is sent to parents.");
      } catch (error) {
        this.appointmentUpdated = false;

        alert(
          "No email about the appointment updates is sent to parents.\nPlease send an email manually."
        );
      }
    }
    this.previousIndex = this.Index;
  },
};
</script>

<style lang="scss" scoped>
.v-card-title {
  vertical-align: bottom;
}
</style>
