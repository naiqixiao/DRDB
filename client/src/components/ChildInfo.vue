<template>
  <div>
    <v-row style="height: 48px;" dense>
      <v-col cols="12" md="12" class="justify-start">
        <h1 class="text-left">Child information</h1>
      </v-col>
    </v-row>
    <div v-if="Children">
      <v-row dense align="start" style="height: 345px;">
        <v-col cols="6" v-for="(child, index) in Children" :key="child.id">
          <v-card class="child-card d-flex flex-column" height="174px">
            <v-card-title class="title"
              >{{ child.Name + " (" +  currentFamily.id + child.IdWithinFamily + ")" }}
              <v-spacer></v-spacer>
              <v-icon v-if="child.Sex == 'M'" color="light-blue darken-4" large
                >mdi-human-male</v-icon
              >
              <v-icon v-else color="pink darken-1" large
                >mdi-human-female</v-icon
              >
            </v-card-title>

            <v-card-text align="start">
              <AgeDisplay class="subtitle-1 pl-md-2" :DoB="child.DoB" />
            </v-card-text>
            <v-spacer></v-spacer>
            <v-card-actions>
              <v-btn
                small
                color="primary"
                dark
                outlined
                @click.stop="editChild(child, index)"
              >
                <v-icon>edit</v-icon>edit</v-btn
              >
              <v-spacer></v-spacer>
              <v-btn
                small
                dark
                outlined
                color="primary"
                :disabled="PotentialStudies[index].length < 1"
                @click.stop="Schedule(child, index)"
              >
                <v-icon dark>event</v-icon>schedule
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>
    <div v-else>
      <v-row dense align="start" style="height: 345px;">
        <v-col cols="6" v-for="child in 4" :key="child">
          <v-card class="placeholder-card" height="174px">
            <v-card-title class="title"> {{ "Child " + alphabet[child - 1] }} </v-card-title>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <div>
      <v-dialog v-model="dobPicker" max-width="360px">
        <v-card>
          <v-row>
            <v-col cols="12" md="12">
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
    </div>

    <div>
      <v-dialog v-model="dialogChild" max-width="760px" :retain-focus="false">
        <v-card outlined>
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
                  ></v-text-field>
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
            <v-row justify="space-between" style="height: 50px">
              <v-col md="4"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="dialogChild = false"
                  >Cancel</v-btn
                >
              </v-col>
              <v-col md="2">
                <v-btn color="primary" @click="save">Save</v-btn>
              </v-col>
              <v-col md="4"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <div>
      <v-dialog
        v-model="dialogSchedule"
        max-width="1000px"
        :retain-focus="false"
        persistent
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
              <v-card outlined>
                <v-row
                  style="height: 60px;"
                  align="center"
                  justify="start"
                  v-if="response == 'Confirmed'"
                >
                  <v-col cols="12" md="3" class="text-left">
                    <div class="title" style="padding-left: 8px;">
                      Study date & time:
                    </div>
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-text-field
                      ref="studyDate"
                      label="Study date"
                      v-model="studyDate"
                      append-icon="event"
                      @click:append="datePicker = true"
                      hide-details
                      dense
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="1"> </v-col>
                  <v-col cols="12" md="2">
                    <v-combobox
                      v-model="studyTime"
                      :items="studyTimeSlots"
                      label="Study time"
                      hide-details
                      dense
                    ></v-combobox>
                  </v-col>
                </v-row>
                <v-row
                  style="height: 60px;"
                  align="center"
                  justify="start"
                  v-else
                >
                  <v-col cols="12" md="3" class="text-left">
                    <div class="title" style="padding-left: 8px;">
                      Study date & time: NA
                    </div>
                  </v-col>
                </v-row>
                <v-divider></v-divider>
                <v-row dense>
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
                      :potentialStudies="
                        potentialStudies(appointment.Child).potentialStudyList
                      "
                      :index="index"
                      response="Confirmed"
                      @selectStudy="selectStudy"
                      @deleteAppointment="deleteAppointment"
                      @emitSelectedStudy="receiveSelectedStudy"
                      @emitEmailTemplate="getEmailTemplate"
                      align="start"
                    ></ExtraStudies>
                    <v-row
                      v-if="index === 0 && response === 'Confirmed'"
                      align="center"
                      justify="start"
                      style="height: 80px;"
                    >
                      <v-col cols="12" md="4" class="text-left">
                        <div class="title">
                          Additional appointment(s) for:
                        </div>
                      </v-col>
                      <!-- <v-col cols="12" md="2">
                            <v-btn
                              color="green darken-2"
                              text
                              @click="newAppointment(currentChild)"
                              :disabled="
                                potentialStudies(currentChild).selectableStudies
                                  .length < 1
                              "
                              >{{ currentChild.Name }}
                            </v-btn>
                          </v-col> -->
                      <v-col
                        cols="12"
                        md="2"
                        v-for="sibling in Children"
                        :key="sibling.id"
                      >
                        <v-btn
                          class="text-capitalize"
                          rounded
                          color="primary"
                          @click="newAppointment(sibling)"
                          :disabled="
                            potentialStudies(sibling).selectableStudies.length <
                              1
                          "
                        >
                          {{ sibling.Name }}</v-btn
                        >
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-card>
              <v-row justify="space-between" align="center">
                <v-col cols="12" md="2"></v-col>
                <v-col cols="12" md="6">
                  <v-btn
                    color="primary"
                    :disabled="!studyDateTime"
                    @click="continue12()"
                  >
                    <v-icon dark left v-show="scheduleId"
                      >mdi-checkbox-marked-circle</v-icon
                    >
                    Schedule
                  </v-btn>

                  <v-btn
                    v-if="response == 'Confirmed' && manualCalendar"
                    @click="createCalendarbyScheduleId"
                  >
                    Create Calendar</v-btn
                  >
                </v-col>
                <v-col cols="12" md="2">
                  <v-btn
                    :disabled="!scheduleNextPage"
                    @click="scheduleNextStep"
                  >
                    Next</v-btn
                  >
                </v-col>
              </v-row>
            </v-stepper-content>
            <v-stepper-content step="2">
              <Email
                ref="Email"
                :dialog="emailDialog"
                :emailTemplate="emailTemplate"
                :data="{
                  nameMom: currentFamily.NameMom,
                  childName: currentChild.Name,
                  Email: currentFamily.Email,
                  scheduleTime: studyDateTime,
                }"
                emailType="Confirmation"
              ></Email>

              <v-row justify="space-between" align="center">
                <v-col cols="12" md="2"></v-col>
                <v-col cols="12" md="6">
                  <v-btn color="primary" @click="continue23()"
                    ><v-icon dark left v-show="emailSent"
                      >mdi-checkbox-marked-circle</v-icon
                    >
                    Send Email
                  </v-btn>
                </v-col>
                <v-col cols="12" md="2">
                  <v-btn
                    :disabled="!scheduleNextPage"
                    @click="scheduleNextStep"
                  >
                    Next</v-btn
                  >
                </v-col>
              </v-row>
            </v-stepper-content>

            <v-stepper-content step="3">
              <NextContact
                ref="NextContact"
                :familyId="currentFamily.id"
                :studyDate="studyDate"
                :contactType="response"
                :nextContactDialog="nextContactDialog"
              ></NextContact>

              <v-row dense justify="center" align="center">
                <v-col>
                  <v-btn color="primary" @click="completeSchedule()">
                    Complete
                  </v-btn>
                </v-col>
              </v-row>
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
    </div>
    <v-spacer></v-spacer>
    <v-row align-content="end" justify="end" style="height: 120px;" dense>
      <v-btn class="c1" fab @click.stop="addChild" v-if="familyId"
        ><v-icon>add</v-icon></v-btn
      >
    </v-row>
  </div>
</template>

<script>
import AgeDisplay from "@/components/AgeDisplay";
import ExtraStudies from "@/components/ExtraStudies";
import Email from "@/components/Email";
import NextContact from "@/components/NextContact";

import child from "@/services/child";
import store from "@/store";

import schedule from "@/services/schedule";
import calendar from "@/services/calendar";

import moment from "moment";

export default {
  components: {
    AgeDisplay,
    ExtraStudies,
    Email,
    NextContact,
  },
  props: {
    Children: Array,
    familyId: Number,
    currentFamily: Object,
    studyTimeSlots: Array,
  },
  data() {
    return {
      alphabet: "abcdefghij".split(""),
      dialogChild: false,
      dialogSchedule: false,
      e1: 1,
      dobPicker: false,
      datePicker: false,
      editedIndex: -1,
      validChild: true,
      studyTime: "09:00AM",
      selectedStudy: [],
      Experimenters: [],
      appointments: [],
      scheduleNextPage: false,
      emailSent: false,
      defaultAppointment: {
        index: null,
        FK_Family: null,
        FK_Child: null,
        FK_Study: null,
        Experimenters: [],
      },

      editedItem: {
        Name: null,
        Sex: null,
        DoB: new Date().toISOString(),
        FK_Family: this.familyId,
        Age: null,
        Hearingloss: 0,
        VisionLoss: 0,
        PrematureBirth: 0,
        Illness: 0,
        Note: null,
        BirthWeight: null,
        Appointments: [],
      },
      currentChild: {
        Name: null,
        Sex: null,
        DoB: new Date().toISOString(),
        FK_Family: this.familyId,
        Age: null,
        Hearingloss: 0,
        VisionLoss: 0,
        PrematureBirth: 0,
        Illness: 0,
        Note: null,
        BirthWeight: null,
        Appointments: [],
      },
      defaultItem: {
        Name: null,
        Sex: null,
        DoB: null,
        FK_Family: this.familyId,
        Age: null,
        Hearingloss: 0,
        VisionLoss: 0,
        PrematureBirth: 0,
        Illness: 0,
        Note: null,
        BirthWeight: null,
        Appointments: [],
      },
      Responses: ["Confirmed", "Interested", "Left a message", "Rejected"],
      response: "Confirmed",
      scheduleId: null,
      manualCalendar: false,
      nextContactDialog: false,
      emailDialog: false,
      emailTemplate: "",
      studyDate: null,
    };
  },
  methods: {
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

    deleteAppointment(index) {
      this.appointments.splice(index, 1);
    },

    receiveSelectedStudy(selectedStudy) {
      this.appointments[selectedStudy.index].FK_Study = selectedStudy.studyId;
      this.appointments[selectedStudy.index].FK_Child = selectedStudy.childId;
    },

    newAppointment(child) {
      var newAppointment = Object.assign({}, this.defaultAppointment);

      newAppointment.FK_Child = child.id;
      newAppointment.Child = child;
      newAppointment.FK_Family = child.FK_Family;
      newAppointment.index = this.appointments.length;

      this.appointments.push(newAppointment);
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

    async createSchedule() {
      this.Experimenters = [];

      for (var i = 0; i < this.appointments.length; i++) {
        this.$refs.extraStudies[i].selectStudy();
      }

      var newSchedule = {};

      switch (this.response) {
        case "Confirmed":
          var studyNames = this.appointments.map((appointment) => {
            return appointment.Study.StudyName;
          });

          var childNames = this.appointments.map((appointment) => {
            return appointment.Child.IdWithinFamily;
          });

          studyNames = Array.from(new Set(studyNames));
          childNames = Array.from(new Set(childNames));

          newSchedule = {
            AppointmentTime: moment(this.studyDateTime).toISOString(true),
            Status: this.response,
            summary:
              studyNames.join(" + ") +
              ", Family: " +
              this.currentChild.FK_Family +
              ", Child: " +
              childNames.join(" + "),
            Appointments: this.appointments,
            ScheduledBy: store.state.userID,
            location: "Psychology Building, McMaster University",
            start: {
              dateTime: moment(this.studyDateTime).toISOString(true),
              timeZone: "America/Toronto",
            },
            end: {
              dateTime: moment(this.studyDateTime)
                .add(1, "h")
                .toISOString(true),
              timeZone: "America/Toronto",
            },
            attendees: this.Experimenters,
          };

          break;

        default:
          newSchedule = {
            AppointmentTime: null,
            Status: this.response,
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

        var calendarEvent = newSchedule;

        calendarEvent.scheduleId = newStudySchedule.data.id;

        // this.manualCalendar = true;

        console.log("New Scheduled Created!");

        this.$emit("newSchedule");

        return { calendarEvent: calendarEvent };
      } catch (error) {
        console.log(error.response);
      }
    },

    async deleteUnfinishedSchedule() {
      await schedule.delete({ id: this.scheduleId });
    },

    async createCalendarbyScheduleId() {
      var queryString = { id: this.scheduleId };
      const currentSchedules = await schedule.search(queryString);

      const currentSchedule = currentSchedules.data[0];
      var studyNames = currentSchedule.Appointments.map((appointment) => {
        return appointment.Study.StudyName;
      });

      var childNames = currentSchedule.Appointments.map((appointment) => {
        return appointment.Child.IdWithinFamily;
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

    async createCalendarEvent(calendarEvent) {
      try {
        await calendar.create(calendarEvent);
      } catch (error) {
        console.log(error);
      }
    },

    getEmailTemplate(emailTemplate) {
      this.emailTemplate = emailTemplate;
    },

    async continue12() {
      try {
        if (this.scheduleId) {
          await this.deleteUnfinishedSchedule();
        }

        var scheduleInfo = await this.createSchedule();

        if (this.response == "Confirmed") {
          try {
            await this.createCalendarEvent(scheduleInfo.calendarEvent);

            // this.emailDialog = true;
            // this.e1 = 2;
            this.scheduleNextPage = true;
          } catch (error) {
            alert(
              "Calendar event wasn't created successfully, please try again."
            );
            console.log(error.response);
            this.manualCalendar = true;
          }
        } else {
          this.scheduleNextPage = true;
        }
      } catch (error) {
        console.log(error.response);
      }
    },

    async continue23() {
      try {
        await this.$refs.Email.sendEmail();
        // this.e1 = 3;
        // this.nextContactDialog = true;
        this.emailSent = true;
        this.scheduleNextPage = true;
      } catch (error) {
        console.log(error.response);
        alert("Email wasn't sent successfully, please try again.");
      }
    },

    async completeSchedule() {
      // update next contact date and content for the family.
      try {
        await this.$refs.NextContact.updateNextContact();
        this.$emit("newSchedule");
        this.resetSchedule();
        this.closeSchedule();
      } catch (error) {
        console.log(error.response);
      }
    },

    scheduleNextStep() {
      switch (this.e1) {
        case 1:
          if (this.response != "Rejected") {
            this.emailDialog = true;
          } else {
            this.e1 = 2; // skip email if parents rejected participation.
            this.nextContactDialog = true;
          }
          break;

        case 2:
          this.nextContactDialog = true;
          break;
      }

      this.e1 += 1;
      this.scheduleNextPage = false;
    },

    resetSchedule() {
      setTimeout(() => {
        this.e1 = 1;
        this.scheduleId = null;
        this.appointments = [];
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        this.response = null;
        this.studyDate = null;
        this.studyTime = "09:00AM";
        this.selectedStudy = [];
        this.emailDialog = false;
        this.nextContactDialog = false;
        this.emailSent = false;
        this.scheduleNextPage = false;
      }, 300);
    },

    closeSchedule() {
      this.dialogSchedule = false;
    },

    addChild() {
      this.editedIndex = -1;
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedItem.FK_Family = this.familyId;
      this.dialogChild = true;
    },

    editChild(child, index) {
      this.editedIndex = index;
      this.editedItem = Object.assign({}, child);
      this.dialogChild = true;
    },

    async save() {
      try {
        var validationResults = false;

        if (this.editedIndex > -1) {
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
        } else {
          validationResults = this.$refs.formChild.validate();

          if (validationResults) {
            this.editedItem.Age = Math.floor(
              (new Date() - new Date(this.editedItem.DoB)) / (24 * 3600 * 1000)
            );

            const newChild = await child.create(this.editedItem);

            this.editedItem.id = newChild.data.id;

            this.Children.push(this.editedItem);

            console.log("Child is creted and siblings are updated!");

            this.close();
          }
        }
      } catch (error) {
        console.log(error.response);
      }
    },

    close() {
      this.dialogChild = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    },

    Schedule(child, index) {
      this.currentChildIndex = index;
      this.currentChild = Object.assign({}, child);

      var newAppointment = Object.assign({}, this.defaultAppointment);

      newAppointment.FK_Child = child.id;
      newAppointment.Child = child;
      newAppointment.FK_Family = child.FK_Family;
      newAppointment.index = this.appointments.length;

      this.appointments.push(newAppointment);

      this.dialogSchedule = true;
    },

    datePick() {
      this.datePicker = false;
      setTimeout(() => {
        this.$refs.studyDate.focus();
      }, 100);
    },
  },
  computed: {
    ElegibleStudies: function() {
      if (this.Children) {
        var elegibleStudies = this.Children.map((child) => {
          let studyIds = [];
          store.state.studies.forEach((study) => {
            if (
              child.Age >= study.MinAge * 30.5 - 5 &&
              child.Age <= study.MaxAge * 30.5 - 5
            ) {
              studyIds.push(study.id);
            }
          });
          return studyIds;
        });

        return elegibleStudies;
      } else {
        return [];
      }
    },

    UniquePreviousStudies: function() {
      return this.Children.map((child) => {
        let studyIds = [];
        child.Appointments.forEach((appointment) => {
          studyIds.push(appointment.FK_Study);
        });

        return studyIds;
      });
    },
    PotentialStudies: function() {
      var PotentialStudies = [];
      for (var i = 0; i < this.ElegibleStudies.length; i++) {
        var elegibleStudy = this.ElegibleStudies[i];
        var previousStudies = this.UniquePreviousStudies[i];

        previousStudies = Array.from(new Set(previousStudies));

        let potentialStudyIds = elegibleStudy.filter(
          (study) => !previousStudies.includes(study)
        );

        var PotentialStudyList = store.state.studies.filter((study) =>
          potentialStudyIds.includes(study.id)
        );

        PotentialStudies.push(PotentialStudyList);
      }

      return PotentialStudies;
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
      if (!this.dialogSchedule) {
        if (this.selectedStudy.length > 0) {
          var minAges = this.selectedStudy.map((study) => {
            return moment(this.editedItem.DoB).add(
              Math.floor(study.MinAge * 30.5),
              "days"
            );
          });

          minAges.push(moment());

          var MinAge = moment.max(minAges);

          return MinAge.toISOString(true);
        } else {
          return new Date().toISOString();
        }
      } else {
        return new Date().toISOString();
      }
    },

    latestDate() {
      if (!this.dialogSchedule) {
        if (this.selectedStudy.length > 0) {
          var maxAges = this.selectedStudy.map((study) => {
            return moment(this.editedItem.DoB).add(
              Math.floor(study.MaxAge * 30.5),
              "days"
            );
          });

          var MaxAge = moment.min(maxAges);

          return MaxAge.toISOString(true);
        } else {
          return new Date().toISOString();
        }
      } else {
        return moment(new Date())
          .add(60, "days")
          .toISOString(true);
      }
    },
  },
  watch: {
    dialogChild(val) {
      val || this.close();
    },

    dialogSchedule(val) {
      val || this.closeSchedule();
    },
  },
};
</script>

<style lang="scss">
.child-card {
  border-radius: 10px !important;
  border-style: solid !important;
  border-width: thin !important;
  border-color: var(--v-primary-base) !important;
  background-color: var(--v-background-lighten4) !important;
}

.placeholder-card {
  border-radius: 10px !important;
  border-style: dashed !important;
  border-width: thin !important;
  border-color: var(--v-primary-lighten4) !important;
  background-color: var(--v-textbackground-lighten4) !important;
}
</style>
