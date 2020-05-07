<template>
  <!-- <v-container fluid> -->
  <v-row justify="space-around">
    <v-col cols="12" md="4">
      <v-row style="height: 60px;" dense>
        <v-col cols="12" md="12" class="justify-start">
          <h1 class="text-left">Choose a study</h1>
        </v-col>
      </v-row>
      <v-select
        :items="studies"
        :item-value="'id'"
        :item-text="'StudyName'"
        v-model="selectedStudy"
        return-object
        label="Studies"
        @change="searchChild"
        height="48px"
        background-color="textbackground"
        hide-details
        outlined
        dense
      ></v-select>

      <h4>{{ selectedStudy.StudyName }}</h4>
      <h4>{{ selectedStudy.MinAge }}</h4>
      <h4>{{ selectedStudy.MaxAge }}</h4>
      <p>{{ selectedStudy.Description }}</p>

      <v-btn @click.stop="dialogEmail = true" color="green" text
        >Email test</v-btn
      >
      <EmailDialog
        :dialog="dialogEmail"
        :emailTemplate="selectedStudy.EmailTemplate"
        :data="{
          NameMom: currentFamily.NameMom,
          ChildName: currentChild.Name,
          Email: currentFamily.Email,
        }"
        @cancelEmail="closeEmail"
      ></EmailDialog>
    </v-col>

    <v-col cols="12" md="4">
      <v-row justify="space-around">
        <v-col cols="12" md="3"> </v-col>
        <v-spacer></v-spacer>
        <v-col cols="12" md="4" style="text-align: end;">
          <Page
            :page="page"
            :NofPages="Children ? Children.length : 0"
            @nextPage="nextPage"
            @previousPage="previousPage"
          ></Page>
        </v-col>
      </v-row>
      <v-row justify="start">
        <v-col md="12" class="subtitle">
          <v-divider></v-divider>
          <h4 class="text-left">Family information:</h4>
        </v-col>
        <v-col cols="12" md="5" v-for="field in familyField" :key="field.label">
          <v-text-field
            height="48px"
            background-color="textbackground"
            hide-details
            :label="field.label"
            v-model="currentFamily[field.field]"
            readonly
            placeholder="  "
            outlined
            dense
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row justify="start">
        <v-col md="12" class="subtitle">
          <v-divider></v-divider>
          <h4 class="text-left">Child information:</h4>
        </v-col>
        <v-col cols="12" md="5" v-for="field in childField" :key="field.label">
          <v-text-field
            height="48px"
            background-color="textbackground"
            hide-details
            :label="field.label"
            v-model="currentChild[field.field]"
            readonly
            placeholder="  "
            outlined
            dense
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="5">
          <AgeDisplay :DoB="currentChild.DoB" />
        </v-col>
      </v-row>
      <v-row justify="space-around">
        <v-col cols="12" md="3">
          <v-btn
            color="primary"
            fab
            @click.stop="editChild"
            :disabled="!currentChild.id"
            ><v-icon>edit</v-icon></v-btn
          >
        </v-col>
        <v-spacer></v-spacer>
      </v-row>

      <v-row justify="space-around" align="center">
        <v-col md="12" class="subtitle">
          <v-divider></v-divider>
          <h4 class="text-left">Schedule this child</h4>
        </v-col>
        <v-col cols="12" md="9">
          <v-select
            :items="Responses"
            v-model="response"
            label="Parents' response"
            @change="chooseResponse"
            :disabled="!currentChild"
            height="48px"
            background-color="textbackground"
            hide-details
            outlined
            dense
          ></v-select>
        </v-col>

        <v-col cols="12" md="3">
          <v-btn
            color="primary"
            fab
            @click.stop="scheduleChild"
            :disabled="response == null"
          >
            <v-icon> {{ scheduleButtonIcon }}</v-icon>
          </v-btn>
        </v-col>

        <v-dialog v-model="dobPicker" max-width="360px">
          <v-card>
            <v-row align="center">
              <v-col cols="12" lg="12">
                <v-date-picker
                  v-model="editedItem.DoB"
                  show-current
                  :max="new Date().toISOString()"
                  @click:date="dobPicker = false"
                ></v-date-picker>
              </v-col>
            </v-row>
          </v-card>
        </v-dialog>

        <v-dialog v-model="dialogEdit" max-width="760px" :retain-focus="false">
          <v-card>
            <v-card-title>
              <span class="headline">Child's information</span>
            </v-card-title>

            <v-form ref="formChild" v-model="validChild" lazy-validation>
              <v-container>
                <v-row>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.Name"
                      :rules="this.$rules.name"
                      label="Name"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.DoB"
                      append-icon="event"
                      @click:append="dobPicker = true"
                      :rules="this.$rules.dob"
                      label="Date of birth (YYYY-MM-DD)"
                    ></v-text-field
                    >flffdjjdfa;kfjdsf
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-select
                      v-model="editedItem.Sex"
                      :items="this.$Sex"
                      filled
                      label="Sex"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.BirthWeight"
                      :rules="this.$rules.birthWeight"
                      label="Birth weight"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-container>
            </v-form>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="green darken-1" text @click="dialogChild = false"
                >Cancel</v-btn
              >
              <v-btn color="green darken-1" text @click="save">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog
          v-model="dialogSchedule"
          max-width="1200px"
          :retain-focus="false"
        >
          <v-stepper v-model="e1">
            <v-stepper-header>
              <v-stepper-step
                :complete="e1 > 1"
                editable
                step="1"
                @click="emailDialog = false"
                >Schedule studies for {{ currentChild.Name }}</v-stepper-step
              >

              <v-divider></v-divider>

              <v-stepper-step :complete="e1 > 2" step="2">Email</v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step step="3">Next contact</v-stepper-step>
            </v-stepper-header>

            <v-stepper-items>
              <v-stepper-content step="1">
                <v-card>
                  <template>
                    <v-container fluid>
                      <v-row
                        style="height: 100px;"
                        justify="space-around"
                        align="center"
                      >
                        <v-col cols="12" md="3">
                          <v-text-field
                            ref="studyDate"
                            label="Study date"
                            v-model="studyDate"
                            append-icon="event"
                            @click:append="datePicker = true"
                            :disabled="this.response != 'Confirmed'"
                            dense
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="3">
                          <v-combobox
                            v-model="studyTime"
                            :items="this.$studyTimeSlots"
                            label="Study time"
                            :disabled="this.response != 'Confirmed'"
                            dense
                          ></v-combobox>
                        </v-col>
                      </v-row>
                      <v-row>
                        <v-col
                          cols="12"
                          md="12"
                          v-for="(appointment, index) in appointments"
                          :key="appointment.index"
                        >
                          <ExtraStudies
                            ref="extraStudies"
                            :child="appointment.Child"
                            :targetChild="currentChild"
                            :currentStudy="selectedStudy"
                            :index="index"
                            :response="response"
                            :potentialStudies="
                              potentialStudies(appointment.Child)
                                .potentialStudyList
                            "
                            @selectStudy="selectStudy"
                            @deleteAppointment="deleteAppointment"
                            @emitSelectedStudy="receiveSelectedStudy"
                            align="start"
                          ></ExtraStudies>
                          <v-row v-if="index === 0 && response === 'Confirmed'">
                            <div class="title">
                              Additional appointment(s) for:
                            </div>
                            <v-col cols="12" md="2">
                              <v-btn
                                color="green darken-2"
                                text
                                @click="newAppointment(currentChild)"
                                :disabled="
                                  potentialStudies(currentChild)
                                    .selectableStudies.length < 1
                                "
                                >{{ currentChild.Name }}
                              </v-btn>
                            </v-col>
                            <v-col
                              cols="12"
                              md="2"
                              v-for="child in currentChild.sibling"
                              :key="child.id"
                            >
                              <v-btn
                                color="green darken-2"
                                text
                                @click="newAppointment(child)"
                                :disabled="
                                  potentialStudies(child).selectableStudies
                                    .length < 1
                                "
                              >
                                {{ child.Name }}</v-btn
                              >
                            </v-col>
                          </v-row>
                        </v-col>
                      </v-row>
                    </v-container>
                  </template>
                </v-card>
                <v-btn
                  text
                  color="green darken-1"
                  :disabled="!studyDateTime"
                  @click="continue12()"
                >
                  <v-icon dark left v-show="scheduleId"
                    >mdi-checkbox-marked-circle</v-icon
                  >
                  Schedule
                </v-btn>

                <v-btn
                  v-if="response == 'Confirmed'"
                  text
                  :disabled="!manualCalendar"
                  @click="createCalendarbyScheduleId"
                >
                  Create Calendar</v-btn
                >
              </v-stepper-content>

              <v-stepper-content step="2">
                <Email
                  ref="Email"
                  :dialog="emailDialog"
                  :emailTemplate="selectedStudy.EmailTemplate"
                  :data="{
                    nameMom: currentFamily.NameMom,
                    childName: currentChild.Name,
                    Email: currentFamily.Email,
                    scheduleTime: studyDateTime,
                  }"
                  emailType="Confirmation"
                ></Email>

                <v-btn text color="green darken-2" @click="continue23()">
                  Send Email
                </v-btn>
              </v-stepper-content>

              <v-stepper-content step="3">
                <NextContact
                  ref="NextContact"
                  :familyId="currentFamily.id"
                  :studyDate="studyDate"
                  :contactType="response"
                  :nextContactDialog="nextContactDialog"
                ></NextContact>

                <v-btn text color="primary" @click="completeSchedule()">
                  Complete
                </v-btn>
              </v-stepper-content>
            </v-stepper-items>
          </v-stepper>
        </v-dialog>

        <v-dialog v-model="datePicker" max-width="360px">
          <v-card>
            <v-row align="center">
              <v-col cols="12" lg="12">
                <v-date-picker
                  v-model="studyDate"
                  show-current
                  @click:date="datePick"
                  :min="earliestDate"
                  :max="latestDate"
                ></v-date-picker>
              </v-col>
            </v-row>
          </v-card>
        </v-dialog>
      </v-row>
    </v-col>
    <v-col cols="12" md="4" dense>
      <Conversation
        :Conversation="currentFamily.Conversations"
        :familyId="parseInt(currentFamily.id)"
      ></Conversation>
    </v-col>
  </v-row>
</template>

<script>
import store from "@/store";
import child from "@/services/child";
import study from "@/services/study";

import schedule from "@/services/schedule";
import calendar from "@/services/calendar";

import moment from "moment";

import AgeDisplay from "@/components/AgeDisplay";
import ExtraStudies from "@/components/ExtraStudies";

import Conversation from "@/components/Conversation";

import EmailDialog from "@/components/EmailDialog";
import Email from "@/components/Email";
import NextContact from "@/components/NextContact";

import Page from "@/components/Page";

export default {
  components: {
    AgeDisplay,
    Conversation,
    ExtraStudies,
    Email,
    NextContact,
    EmailDialog,
    Page,
  },
  props: {},
  data() {
    return {
      scheduleId: null,
      manualCalendar: false,
      dialogEmail: false,
      e1: 1,
      emailDialog: false,
      dialogEdit: false,
      dialogSchedule: false,
      dobPicker: false,
      datePicker: false,
      validChild: true,
      studies: [],
      selectedStudy: {},
      Children: [],
      elegibleExperimenters: [],
      scheduleButtonIcon: "event",
      appointments: [],
      Experimenters: [],
      studyTime: "09:00AM",
      currentChild: {
        Name: null,
        Sex: null,
        DoB: null,
        Family: {
          NameMom: null,
          NameDad: null,
          Phone: null,
          Email: null,
        },
      },
      editedItem: {
        Name: null,
        Sex: null,
        DoB: null,
        Family: {
          NameMom: null,
          NameDad: null,
          Phone: null,
          Email: null,
        },
      },
      defaultItem: {
        Name: null,
        Sex: null,
        DoB: null,
        Family: {
          NameMom: null,
          NameDad: null,
          Phone: null,
          Email: null,
        },
      },
      editedIndex: null,
      childField: [
        { label: "Name", field: "Name" },
        { label: "Sex", field: "Sex" },
        { label: "DoB", field: "DoB" },
      ],
      familyField: [
        { label: "Phone", field: "Phone", rules: "phone" },
        { label: "Email", field: "Email", rules: "email" },
        { label: "Mother's Name", field: "NameMom", rules: "name" },
        { label: "Father's Name", field: "NameDad", rules: "name" },
      ],
      Responses: ["Confirmed", "Interested", "Left a message", "Rejected"],
      response: null,
      studyDate: null,
      nextContactDialog: false,
      page: 0,
    };
  },

  methods: {
    async searchStudies() {
      var queryString = {
        FK_Lab: store.state.lab,
        Completed: 0,
      };

      try {
        const Result = await study.search(queryString);

        this.studies = Result.data;
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        }
      }
    },

    async searchChild() {
      var studyQuery = {
        id: this.selectedStudy.id,
      };
      try {
        const studyInfo = await study.search(studyQuery);
        var pastParticipants = studyInfo.data[0].Appointments.map(
          (appointment) => {
            return appointment.FK_Child;
          }
        );
      } catch (error) {
        console.log(error.response);
      }

      var queryString = {};

      queryString.pastParticipants = pastParticipants;
      queryString.minAge = this.selectedStudy.MinAge;
      queryString.maxAge = this.selectedStudy.MaxAge;

      try {
        const Results = await child.search(queryString);

        if (Results.data.length > 0) {
          this.page = 1;
          this.Children = Results.data;
          this.currentChild = this.Children[this.page - 1];
        } else {
          alert("no child is elegible for the selected study. :(");
          this.page = 0;
          this.currentChild = {};
        }
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        } else {
          console.log(error.response);
        }
      }

      this.response = null;
    },

    editChild() {
      this.editedIndex = this.Children.indexOf(this.currentChild);
      this.editedItem = Object.assign({}, this.currentChild);
      this.dialogEdit = true;
    },

    async save() {
      try {
        var validationResults = false;

        validationResults = this.$refs.formChild.validate();

        if (validationResults) {
          this.editedItem.Age = Math.floor(
            (new Date() - new Date(this.editedItem.DoB)) / (24 * 3600 * 1000)
          );

          await child.update(this.editedItem);

          Object.assign(this.Children[this.editedIndex], this.editedItem);

          console.log("Child information updated!");

          this.close();
        }
      } catch (error) {
        console.log(error.response);
      }
    },

    close() {
      this.dialogEdit = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    },

    scheduleChild() {
      this.editedIndex = this.Children.indexOf(this.currentChild);
      this.editedItem = Object.assign({}, this.currentChild);

      if (!this.scheduleId & (this.appointments.length === 0)) {
        var newAppointment = Object.assign({}, this.defaultAppointment);
        newAppointment.FK_Child = this.currentChild.id;
        newAppointment.FK_Family = this.currentChild.FK_Family;
        newAppointment.FK_Study = this.selectedStudy.id;
        newAppointment.Child = this.currentChild;
        newAppointment.Study = {
          StudyName: this.selectedStudy.StudyName,
          MinAge: this.selectedStudy.MinAge,
          MaxAge: this.selectedStudy.MaxAge,
        };
        newAppointment.index = this.appointments.length;
        this.appointments.push(newAppointment);
      }

      switch (this.response) {
        case "Confirmed":
        case "Interested":
        case "Left a message":
          this.dialogSchedule = true;
          break;

        case "Rejected":
          break;
      }
    },

    receiveSelectedStudy(selectedStudy) {
      this.appointments[selectedStudy.index].FK_Study = selectedStudy.studyId;
      this.appointments[selectedStudy.index].FK_Child = selectedStudy.childId;
    },

    potentialStudies(child) {
      var ElegibleStudies = [];

      store.state.studies.forEach((study) => {
        if (
          child.Age >= study.MinAge * 30.5 - 5 &&
          child.Age <= study.MaxAge * 30.5 - 5
        ) {
          ElegibleStudies.push(study.id);
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
      if (this.appointments.length > 0) {
        for (var i = 0; i < this.appointments.length; i++) {
          if (this.appointments[i].FK_Child == child.id) {
            currentSelectedStudies.push(this.appointments[i].FK_Study);
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

    newAppointment(child) {
      var newAppointment = Object.assign({}, this.defaultAppointment);

      newAppointment.FK_Child = child.id;
      newAppointment.Child = child;
      newAppointment.FK_Family = child.FK_Family;
      newAppointment.index = this.appointments.length;

      this.appointments.push(newAppointment);
    },

    deleteAppointment(index) {
      this.appointments.splice(index, 1);
    },

    selectStudy(extraAppointments) {
      Object.assign(
        this.appointments[extraAppointments.index],
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

    async createSchedule() {
      this.Experimenters = [];

      for (var i = 0; i < this.appointments.length; i++) {
        this.$refs.extraStudies[i].selectStudy();
      }

      var newSchedule = {};

      switch (this.response) {
        case "Confirmed":
          // var studyNames = this.appointments.map((appointment) => {
          //   return appointment.Study.StudyName;
          // });

          // var childNames = this.appointments.map((appointment) => {
          //   return appointment.FK_Child;
          // });

          // studyNames = Array.from(new Set(studyNames));
          // childNames = Array.from(new Set(childNames));

          newSchedule = {
            AppointmentTime: moment(this.studyDateTime).toISOString(true),
            Status: this.response,
            // summary:
            //   studyNames.join(" + ") +
            //   ", Family: " +
            //   this.currentChild.FK_Family +
            //   ", Child: " +
            //   childNames.join(" + "),
            Appointments: this.appointments,
            ScheduledBy: store.state.userID,
            // location: "Psychology Building, McMaster University",
            // start: {
            //   dateTime: moment(this.studyDateTime).toISOString(true),
            //   timeZone: "America/Toronto",
            // },
            // end: {
            //   dateTime: moment(this.studyDateTime)
            //     .add(1, "h")
            //     .toISOString(true),
            //   timeZone: "America/Toronto",
            // },
            // attendees: this.Experimenters,
          };

          break;

        default:
          newSchedule = {
            AppointmentTime: null,
            Appointments: this.appointments,
            ScheduledBy: store.state.userID,
          };

          if (
            this.response === "Left a message" ||
            this.response === "Interested"
          ) {
            newSchedule.Status = "TBD";
          } else {
            newSchedule.Status = "Rejected";
          }
          break;
      }

      try {
        const newStudySchedule = await schedule.create(newSchedule);

        this.scheduleId = newStudySchedule.data.id;

        switch (this.response) {
          case "Confirmed":
            this.manualCalendar = true;
            break;

          case "Interested":
          case "Left a message":
            this.e1 = 2;
            this.emailDialog = true;
            break;

          case "Rejected":
            this.e1 = 3;
            this.nextContactDialog = true;
            break;
        }
        // var calendarEvent = newSchedule;

        // calendarEvent.scheduleId = newStudySchedule.data.id;
        // console.log(this.potentialStudies(this.currentChild));

        console.log("New Scheduled Created!");

        // return { calendarEvent: calendarEvent };
      } catch (error) {
        console.log(error.response);
      }
    },

    async deleteUnfinishedSchedule() {
      await schedule.delete({ id: this.scheduleId });
    },

    async createCalendarEvent(calendarEvent) {
      try {
        await calendar.create(calendarEvent);
      } catch (error) {
        console.log(error.response);
      }
    },

    async createCalendarbyScheduleId() {
      var queryString = { id: this.scheduleId };
      const currentSchedules = await schedule.search(queryString);

      const currentSchedule = currentSchedules.data[0];
      var studyNames = currentSchedule.Appointments.map((appointment) => {
        return appointment.Study.StudyName;
      });

      var childNames = currentSchedule.Appointments.map((appointment) => {
        return appointment.FK_Child;
      });

      studyNames = Array.from(new Set(studyNames));
      childNames = Array.from(new Set(childNames));

      const attendees = [];

      currentSchedule.Appointments.forEach((appointment) => {
        appointment.Personnels.forEach((experimenter) => {
          attendees.push({
            displayName: experimenter.Name,
            email: experimenter.Calendar + ".CAL",
          });
        });
      });

      var calendarEvent = {
        summary:
          studyNames.join(" + ") +
          ", Family: " +
          currentSchedule.Appointments[0].FK_Family +
          ", Child: " +
          childNames.join(" + "),
        location: "Psychology Building, McMaster University",
        start: {
          dateTime: moment(currentSchedule.AppointmentTime).toISOString(true),
          timeZone: "America/Toronto",
        },
        end: {
          dateTime: moment(currentSchedule.AppointmentTime)
            .add(1, "h")
            .toISOString(true),
          timeZone: "America/Toronto",
        },
        attendees: attendees,
        scheduleId: this.scheduleId,
      };

      try {
        await calendar.create(calendarEvent);

        this.manualCalendar = false;

        if (this.e1 == 1) {
          this.e1 = 2;
          this.emailDialog = true;
        }
      } catch (error) {
        console.log(error.response);
      }
    },

    async continue12() {
      try {
        if (this.scheduleId) {
          await this.deleteUnfinishedSchedule();
        }

        await this.createSchedule();

        // await this.createCalendarEvent(scheduleInfo.calendarEvent).catch(
        //   (error) => {
        //     // if calendar creation fails, activate manual creation button.
        //     alert(
        //       "Calendar event wasn't created successfully, please try again."
        //     );
        //     console.log(error.response);
        //     this.manualCalendar = true;
        //   }
        // );

        // this.emailDialog = true;
        // this.e1 = 2;
      } catch (error) {
        console.log(error.response);
      }
    },

    async continue23() {
      try {
        await this.$refs.Email.sendEmail();
        this.e1 = 3;
        this.nextContactDialog = true;
      } catch (error) {
        console.log(error.response);
      }
    },

    async completeSchedule() {
      // update next contact date and content for the family.
      try {
        await this.$refs.NextContact.updateNextContact();
        this.resetSchedule();
        this.closeSchedule();
      } catch (error) {
        console.log(error.response);
      }
    },

    closeSchedule() {
      this.dialogSchedule = false;
    },

    resetSchedule() {
      setTimeout(() => {
        this.e1 = 1;
        this.scheduleId = null;
        this.response = null;
        this.studyDate = null;
        this.studyTime = "09:00AM";
        this.appointments = [];
        this.emailDialog = false;
        this.nextContactDialog = false;
      }, 300);
    },

    nextPage() {
      this.page += 1;
      this.currentChild = this.Children[this.page - 1];
      this.resetSchedule();
    },

    previousPage() {
      this.page -= 1;
      this.currentChild = this.Children[this.page - 1];
      this.resetSchedule();
    },

    datePick() {
      this.datePicker = false;
      setTimeout(() => {
        this.$refs.studyDate.focus();
      }, 100);
    },

    chooseResponse() {
      switch (this.response) {
        case "Confirmed": {
          this.scheduleButtonIcon = "event";
          break;
        }
        case "Left a Message":
        case "Interested": {
          this.scheduleButtonIcon = "email";
          break;
        }

        case "Rejected": {
          this.scheduleButtonIcon = "sentiment_dissatisfied";
          break;
        }
      }
    },

    closeEmail() {
      this.dialogEmail = false;
    },

    nextContact() {
      this.e1 = 3;
    },
  },

  computed: {
    currentFamily() {
      return this.currentChild.Family;
    },

    studyDateTime: function() {
      var StudyTimeString = this.studyTime.slice(0, 5);
      var AMPM = this.studyTime.slice(5, 7);
      var StudyHour = StudyTimeString.split(":")[0];
      var StudyMin = StudyTimeString.split(":")[1];

      switch (AMPM) {
        case "PM":
          if (parseInt(StudyHour) < 12) {
            StudyHour = parseInt(StudyHour) + 12;
          }
          break;

        case "AM":
          StudyHour = parseInt(StudyHour);
          break;
      }

      StudyMin = parseInt(StudyMin);
      var studyDateTime =
        new Date(this.studyDate).getTime() +
        StudyHour * 3600 * 1000 +
        StudyMin * 60000 +
        new Date(this.studyDate).getTimezoneOffset() * 60000;

      studyDateTime = new Date(studyDateTime);
      return studyDateTime;
    },

    earliestDate: function() {
      if (
        moment(new Date())
          .add(1, "days")
          .isSameOrAfter(
            moment(this.editedItem.DoB).add(
              Math.floor(this.selectedStudy.MinAge * 30.5),
              "days"
            )
          )
      ) {
        return moment(new Date())
          .add(1, "days")
          .toISOString(true);
      } else {
        return moment(this.editedItem.DoB)
          .add(Math.floor(this.selectedStudy.MinAge * 30.5), "days")
          .toISOString(true);
      }
    },

    latestDate: function() {
      return moment(this.editedItem.DoB)
        .add(Math.floor(this.selectedStudy.MaxAge * 30.5), "days")
        .toISOString(true);
    },
  },
  mounted: function() {
    this.searchStudies();
  },

  watch: {
    dialogEdit(val) {
      val || this.close();
    },

    dialogSchedule(val) {
      val || this.closeSchedule();
    },
  },
};
</script>

<style scoped>
/deep/ .v-pagination__item {
  display: none;
}
/deep/ .v-pagination__more {
  display: none;
}
</style>
