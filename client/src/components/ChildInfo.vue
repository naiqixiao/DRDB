<template>
  <div>
    <div style="overflow-y: scroll" v-if="familyId">
      <v-row dense align="start" style="height: 500px">
        <v-col cols="12" v-for="(child, index) in Children" :key="child.id">
          <v-card class="child-card d-flex flex-column" height="200px">
            <v-card-title
              class="title"
              style="padding: 4px 8px; font-size: 80%"
            >
              <div class="d-inline-block text-truncate" style="max-width: 60%">
                {{
                  child.Name +
                    " (" +
                    currentFamily.id +
                    child.IdWithinFamily +
                    ")"
                }}
              </div>
              <v-spacer></v-spacer>
              <v-icon
                :color="
                  child.Sex === 'M' ? 'light-blue darken-4' : 'pink darken-1'
                "
                large
                >{{
                  child.Sex == "M" ? "mdi-human-male" : "mdi-human-female"
                }}</v-icon
              >
              <v-icon v-show="birthday(child.DoB)">cake</v-icon>
            </v-card-title>

            <v-card-text align="start">
              <v-row dense style="padding: 8px 8px 4px">
                <v-col
                  cols="12"
                  md="7"
                  style="padding: 0px !important"
                  class="justify-center"
                >
                  <body align="start" v-html="age(child)"></body>
                  <body
                    style="
                      height: 70px !important;
                      overflow-y: scroll !important;
                    "
                    align="start"
                    v-html="noteChild(child)"
                  ></body>
                </v-col>
                <v-spacer></v-spacer>
                <v-col cols="12" md="5" style="padding: 0px !important">
                  <body
                    align="end"
                    style="
                      overflow-y: scroll !important;
                    "
                    v-html="languageDisplay(child)"
                  ></body>
                </v-col>
              </v-row>
            </v-card-text>
            <v-spacer></v-spacer>
            <v-card-actions style="padding: 16px">
              <v-row dense justify="space-around">
                <v-btn
                  small
                  color="primary"
                  dark
                  outlined
                  @click.stop="editChild(child, index)"
                >
                  <v-icon>edit</v-icon>edit
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  small
                  color="warning"
                  dark
                  outlined
                  :v-show="
                    !(
                      $store.state.role != 'Admin' &&
                      $store.state.role != 'PI' &&
                      $store.state.role != 'PostDoc' &&
                      $store.state.role != 'GradStudent' &&
                      $store.state.role != 'Lab manager'
                    )
                  "
                  @click.stop="deleteChild(child, index)"
                  ><v-icon>delete</v-icon>Delete</v-btn
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
              </v-row>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card
            class="child-card d-flex align-center justify-center"
            style="
              border-width: medium !important;
              border-style: dashed !important;
            "
            height="200px"
          >
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-btn
                    dark
                    outlined
                    class="c1"
                    fab
                    color="primary"
                    x-large
                    style="
                      border-width: medium;
                      border-style: dashed !important;
                    "
                    @click.stop="addChild"
                    :disabled="!familyId"
                  >
                    <v-icon dark>add</v-icon>
                  </v-btn>
                </div>
              </template>
              <span>Add a child to this family</span>
            </v-tooltip>
          </v-card>
        </v-col>
      </v-row>
    </div>
    <div style="overflow-y: scroll" v-else>
      <v-row dense align="start" style="height: 500px">
        <v-col cols="12" v-for="child in 3" :key="child">
          <v-card class="placeholder-card" height="200px">
            <v-card-title class="title">{{
              "Child " + alphabet[child - 1]
            }}</v-card-title>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <div>
      <v-dialog v-model="dobPicker" max-width="290px">
        <v-card outlined>
          <v-date-picker
            v-model="editedItem.DoB"
            show-current
            :max="new Date().toISOString()"
            @click:date="dobPicker = false"
          ></v-date-picker>
        </v-card>
      </v-dialog>
    </div>

    <div>
      <v-dialog v-model="dialogChild" max-width="1000px" :retain-focus="false">
        <v-card outlined>
          <v-card-title>
            <span class="headline">Child's information</span>
          </v-card-title>
          <v-card-text>
            <v-form ref="formChild" v-model="validChild" lazy-validation>
              <v-container>
                <v-row dense style="padding: 8px 8px 4px">
                  <v-col
                    cols="12"
                    :md="item.width"
                    v-for="item in this.$childInfo"
                    :key="item.label"
                  >
                    <div v-if="!!item.options">
                      <v-combobox
                        :label="item.label"
                        :items="$Options[item.options]"
                        justify="start"
                        v-model="editedItem[item.field]"
                        outlined
                        hide-details
                        dense
                      ></v-combobox>
                    </div>
                    <div v-else-if="item.label === 'Note'">
                      <v-textarea
                        class="conv-textarea"
                        :label="item.label"
                        outlined
                        no-resize
                        rows="4"
                        hide-details
                        v-model="editedItem[item.field]"
                      ></v-textarea>
                    </div>
                    <div v-else-if="item.field === 'DoB'">
                      <v-text-field
                        v-model="editedItem.DoB"
                        append-icon="event"
                        @click:append="dobPicker = true"
                        :rules="$rules.dob"
                        :label="item.label"
                        class="textfield-family"
                        filled
                        hide-details
                        dense
                        placeholder="  "
                        outlined
                        background-color="textbackground"
                      ></v-text-field>
                    </div>
                    <div v-else-if="!!item.rules">
                      <v-text-field
                        class="textfield-family"
                        filled
                        hide-details
                        :label="item.label"
                        v-model="editedItem[item.field]"
                        dense
                        placeholder="  "
                        outlined
                        :rules="$rules[item.rules]"
                        background-color="textbackground"
                      ></v-text-field>
                    </div>
                    <div v-else>
                      <v-text-field
                        class="textfield-family"
                        filled
                        hide-details
                        :label="item.label"
                        v-model="editedItem[item.field]"
                        dense
                        placeholder="  "
                        outlined
                        background-color="textbackground"
                      ></v-text-field>
                    </div>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col
                    cols="12"
                    :md="item.width"
                    v-for="item in this.$childSensitiveInfo"
                    :key="item.label"
                  >
                    <v-checkbox
                      class="checkbox-child"
                      hide-details
                      :label="item.label"
                      v-model="editedItem[item.field]"
                      dense
                    >
                    </v-checkbox>
                  </v-col>
                </v-row>
                <!-- <v-divider></v-divider> -->
              </v-container>
            </v-form>
          </v-card-text>

          <v-card-actions style="padding: 16px">
            <v-row justify="space-between">
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

    <ConfirmDlg ref="confirmD" />
    <div>
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
              <v-row style="height: 650px" align="start" justify="center" dense>
                <v-card outlined style="height: 650px" width="90%">
                  <v-form
                    ref="scheduleDateTime"
                    v-model="validScheduleDateTime"
                    lazy-validation
                  >
                    <v-row style="height: 100px" align="center" justify="start">
                      <v-col cols="12" md="3" class="text-left">
                        <div class="title" style="padding-left: 8px">
                          {{ "Study date & time:" }}
                        </div>
                      </v-col>
                      <v-col cols="12" md="2">
                        <v-text-field
                          ref="studyDate"
                          label="Study date"
                          v-model="studyDate"
                          append-icon="event"
                          :rules="$rules.dob"
                          @click:append="datePicker = true"
                          :disabled="this.skipStudyDateTimeStatus"
                          hide-details
                          dense
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="1"></v-col>
                      <v-col cols="12" md="2">
                        <v-combobox
                          v-model="studyTime"
                          :items="this.$studyTimeSlots"
                          :rules="$rules.time"
                          label="Study time"
                          hide-details
                          dense
                          :disabled="this.skipStudyDateTimeStatus"
                        ></v-combobox>
                      </v-col>
                      <v-col cols="12" md="1"></v-col>
                      <v-col cols="12" md="3">
                        <v-tooltip top>
                          <template v-slot:activator="{ on }">
                            <div v-on="on">
                              <v-checkbox
                                style="padding: 4px !important"
                                label="Skip study date/time"
                                class="ma-0 pa-0"
                                :value="skipStudyDateTimeStatus"
                                @change="skipStudyDateTime()"
                                hide-details
                                dense
                              ></v-checkbox>
                            </div>
                          </template>
                          <span
                            >Check this box to use current date/time for the
                            current appointment.<br />NO Google Calendar event
                            will be created.</span
                          >
                        </v-tooltip>
                        <v-tooltip top>
                          <template v-slot:activator="{ on }">
                            <div v-on="on">
                              <v-checkbox
                                style="padding: 4px !important"
                                label="Skip reminder email"
                                class="ma-0 pa-0"
                                :value="skipReminderEmailStatus"
                                @change="skipReminderEmail()"
                                hide-details
                                dense
                              ></v-checkbox>
                            </div>
                          </template>
                          <span
                            >Check this box to prevent reminder email from being
                            sent to the participant.</span
                          >
                        </v-tooltip>
                      </v-col>
                    </v-row>
                  </v-form>
                  <!-- <v-row
                  style="height: 60px"
                  align="center"
                  justify="start"
                  v-else
                >
                  <v-col cols="12" md="3" class="text-left">
                    <div class="title" style="padding-left: 8px">
                      {{ "Study date & time: NA" }}
                    </div>
                  </v-col>
                </v-row> -->
                  <v-divider style="margin-bottom: 16px"></v-divider>
                  <div style="height: 290px; overflow-y: scroll !important">
                    <ExtraStudies
                      ref="extraStudies"
                      v-for="(appointment, index) in appointments"
                      :key="appointment.index"
                      :child="appointment.Child"
                      :targetChild="currentChild"
                      :potentialStudies="
                        potentialStudies(appointment.Child).potentialStudyList
                      "
                      type="newSchedule"
                      :currentStudy="studyPlaceHolder"
                      :index="index"
                      :nOfAppointments="appointments.length"
                      response="Confirmed"
                      @selectStudy="selectStudy"
                      @deleteAppointment="deleteAppointment"
                      @emitSelectedStudy="receiveSelectedStudy"
                      @emitEmailTemplate="getEmailTemplate"
                      @primaryExperimenterStatus="checkPrimaryExperimenter"
                      align="start"
                    ></ExtraStudies>
                  </div>
                  <v-spacer></v-spacer>
                  <v-divider
                    style="margin-bottom: 4px"
                    v-show="response === 'Confirmed'"
                  ></v-divider>
                  <v-row
                    dense
                    v-if="response === 'Confirmed'"
                    align="center"
                    justify="start"
                    style="height: 100px"
                  >
                    <v-col cols="12" md="4" class="text-left">
                      <h4 class="text-left">Additional appointment(s) for:</h4>
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
                      </v-col>-->
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
                          potentialStudies(sibling).selectableStudies.length < 1
                        "
                        >{{
                          !!sibling.Name
                            ? sibling.Name.split(" ")[0]
                            : "Name is missing"
                        }}</v-btn
                      >
                    </v-col>
                  </v-row>
                  <v-spacer></v-spacer>
                  <v-divider style="margin-bottom: 4px"></v-divider>
                  <v-row
                    dense
                    style="height: 150px"
                    align="center"
                    justify="center"
                  >
                    <v-col md="11">
                      <v-textarea
                        class="conv-textarea"
                        label="Notes for this schedule"
                        outlined
                        no-resize
                        rows="6"
                        hide-details
                        v-model="scheduleNotes"
                      ></v-textarea>
                    </v-col>
                  </v-row>
                </v-card>
              </v-row>
              <v-row
                justify="space-between"
                align="center"
                style="padding: 8px"
              >
                <v-col cols="12" md="2"></v-col>
                <v-col cols="12" md="6">
                  <v-btn
                    :loading="loadingStatus"
                    color="primary"
                    :disabled="
                      !(studyDateTime || skipStudyDateTimeStatus) ||
                        !appointments[0].FK_Study
                    "
                    @click="continue12()"
                  >
                    <v-icon dark left v-show="currentSchedule.id"
                      >mdi-checkbox-marked-circle</v-icon
                    >{{ scheduleButtonText }}
                  </v-btn>

                  <v-btn
                    v-if="response == 'Confirmed' && manualCalendar"
                    @click="createCalendarbyScheduleId"
                    >Create Calendar</v-btn
                  >
                </v-col>
                <v-col cols="12" md="2">
                  <v-btn :disabled="!scheduleNextPage" @click="scheduleNextStep"
                    >Next</v-btn
                  >
                </v-col>
              </v-row>
            </v-stepper-content>
            <v-stepper-content step="2">
              <v-row style="height: 700px" align="start" justify="center" dense>
                <v-card outlined style="height: 700px" width="90%">
                  <Email
                    ref="Email"
                    :dialog="emailDialog"
                    :appointments="appointments"
                    :familyInfo="currentFamily"
                    :scheduleInfo="currentSchedule"
                    emailType="Confirmation"
                  ></Email>
                </v-card>
              </v-row>
              <!-- <v-divider></v-divider> -->
              <v-row
                justify="space-between"
                align="center"
                style="padding: 8px"
              >
                <v-col cols="12" md="2">
                  <v-tooltip top>
                    <template v-slot:activator="{ on }">
                      <div v-on="on">
                        <v-checkbox
                          label="Skip email"
                          class="ma-0 pa-0"
                          :value="skipConfirmationEmailStatus"
                          @change="skipConfirmationEmail()"
                          :disabled="response != 'Confirmed'"
                          dense
                        ></v-checkbox>
                      </div>
                    </template>
                    <span>Check this box to skip emailing to parents.</span>
                  </v-tooltip>
                </v-col>
                <v-col cols="12" md="6">
                  <v-btn
                    :loading="loadingStatus"
                    color="primary"
                    @click="continue23()"
                    :disabled="
                      !currentFamily.Email ||
                        this.skipConfirmationEmailStatus ||
                        !this.$store.state.labEmailStatus
                    "
                  >
                    <v-icon dark left v-show="emailSent"
                      >mdi-checkbox-marked-circle</v-icon
                    >{{ emailButtonText }}
                  </v-btn>
                </v-col>
                <v-col cols="12" md="2">
                  <v-btn
                    :disabled="
                      !scheduleNextPage &&
                        !!currentFamily.Email &&
                        !this.skipConfirmationEmailStatus
                    "
                    @click="scheduleNextStep"
                    >{{
                      !!currentFamily.Email ||
                      (!this.skipConfirmationEmailStatus &&
                        this.$store.state.labEmailStatus)
                        ? "Next"
                        : "Skip email"
                    }}</v-btn
                  >
                </v-col>
              </v-row>
            </v-stepper-content>

            <v-stepper-content step="3">
              <NextContact
                ref="NextContact"
                :familyId="currentFamily.id"
                :labId="$store.state.lab"
                :studyDate="studyDate"
                :contactType="response"
                :nextContactDialog="nextContactDialog"
              ></NextContact>
              <!-- <v-divider></v-divider> -->
              <v-row
                justify="space-between"
                align="center"
                style="padding: 8px"
                dense
              >
                <v-col>
                  <v-btn color="primary" @click="completeSchedule()"
                    >Complete</v-btn
                  >
                </v-col>
              </v-row>
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </v-dialog>

      <v-dialog v-model="datePicker" max-width="290px">
        <v-card outlined>
          <v-date-picker
            v-model="studyDate"
            show-current
            @click:date="datePick"
            :min="earliestDate"
            :max="latestDate"
          ></v-date-picker>
        </v-card>
      </v-dialog>
    </div>
    <!-- <v-spacer></v-spacer>

    <v-row align-content="end" justify="end" style="height: 120px;" dense>
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <div v-on="on">
            <v-btn class="c1" fab @click.stop="addChild" :disabled="!familyId">
              <v-icon>add</v-icon>
            </v-btn>
          </div>
        </template>
        <span>Add a child to this family</span>
      </v-tooltip>
    </v-row>-->
  </div>
</template>

<script>
import ExtraStudies from "@/components/ExtraStudies";
import Email from "@/components/Email";
import NextContact from "@/components/NextContact";

import child from "@/services/child";

import schedule from "@/services/schedule";
import calendar from "@/services/calendar";

import moment from "moment-timezone";

import ConfirmDlg from "@/components/ConfirmDialog";

export default {
  components: {
    ExtraStudies,
    Email,
    NextContact,
    ConfirmDlg,
  },
  props: {
    Children: Array,
    familyId: Number,
    currentFamily: Object,
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
      studyTime: null,
      selectedStudy: [],
      Experimenters: [],
      appointments: [],
      scheduleNextPage: false,
      emailSent: false,
      validScheduleDateTime: true,
      defaultAppointment: {
        index: null,
        FK_Family: null,
        FK_Child: null,
        FK_Study: null,
        FK_Schedule: null,
        PrimaryExperimenter: [],
        SecondaryExperimenter: [],
      },

      editedItem: {
        Name: null,
        Sex: null,
        DoB: new Date().toISOString(),
        FK_Family: this.familyId,
        Age: null,
        HearingLoss: 0,
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
        HearingLoss: 0,
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
        HearingLoss: 0,
        VisionLoss: 0,
        PrematureBirth: 0,
        Illness: 0,
        Note: null,
        BirthWeight: null,
        Appointments: [],
      },
      Responses: ["Confirmed", "Interested", "Left a message", "Rejected"],
      response: "Confirmed",
      currentSchedule: {
        id: null,
      },
      manualCalendar: false,
      nextContactDialog: false,
      emailDialog: false,
      emailTemplate: "",
      studyDate: null,
      skipStudyDateTimeStatus: false,
      skipConfirmationEmailStatus: false,
      skipReminderEmailStatus: false,
      primaryExperimenterList: [],
      emailButtonText: "Send email",
      scheduleButtonText: "Schedule",
      studyPlaceHolder: {
        id: 0,
        StudyName: " ",
        Experimenters: [],
      },
      scheduleNotes: "",
      loadingStatus: false,
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

      this.$store.state.studies.forEach((study) => {
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

      var potentialStudyList = this.$store.state.studies.filter((study) =>
        potentialStudies.includes(study.id)
      );

      return {
        potentialStudyList: potentialStudyList,
        selectableStudies: selectableStudies,
      };
    },

    checkPrimaryExperimenter(primaryExperimenterStatus) {
      this.primaryExperimenterList.push(primaryExperimenterStatus);
    },

    skipStudyDateTime() {
      this.skipStudyDateTimeStatus = !this.skipStudyDateTimeStatus;

      this.studyDate = moment()
        .startOf("day")
        .tz("America/Toronto")
        .format("YYYY-MM-DD");
      this.studyTime = "06:00AM";
    },

    skipConfirmationEmail() {
      this.skipConfirmationEmailStatus = !this.skipConfirmationEmailStatus;
    },

    skipReminderEmail() {
      this.skipReminderEmailStatus = !this.skipReminderEmailStatus;
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
            return (
              appointment.Study.StudyName +
              " (" +
              this.familyId +
              appointment.Child.IdWithinFamily +
              ")"
            );
          });

          studyNames = Array.from(new Set(studyNames));

          newSchedule = {
            AppointmentTime: this.studyDateTime,
            Status: this.response,
            FK_Family: this.familyId,
            Note: this.scheduleNotes,
            summary: studyNames.join(" + "),
            Appointments: this.appointments,
            ScheduledBy: this.$store.state.userID,
            location: this.$store.state.location,
            description: this.calendarDescription(
              this.scheduleNotes,
              this.appointments
            ),
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
            attendees: this.Experimenters,
          };

          if (this.skipReminderEmailStatus) {
            newSchedule.Reminded = true;
          }

          break;

        default:
          newSchedule = {
            AppointmentTime: null,
            Status: this.response,
            FK_Family: this.familyId,
            Appointments: this.appointments,
            ScheduledBy: this.$store.state.userID,
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

        var calendarEvent = Object.assign({}, newSchedule);
        calendarEvent.scheduleId = newStudySchedule.data.id;

        this.currentSchedule = newStudySchedule.data;
        this.currentSchedule.AppointmentTime = newSchedule.AppointmentTime;

        // attach schedule info to the current appointments.
        newStudySchedule.data.updatedAt = moment().toString();

        this.appointments.forEach((appointment) => {
          appointment.FK_Schedule = newStudySchedule.data.id;
        });

        console.log("New Scheduled Created!");

        // this.$emit("newSchedule");

        return { calendarEvent: calendarEvent };
      } catch (error) {
        console.log(error);
      }
    },

    async deleteUnfinishedSchedule() {
      await schedule.delete({ id: this.currentSchedule.id });
    },

    async createCalendarbyScheduleId() {
      var queryString = { id: this.currentSchedule.id };
      const currentSchedules = await schedule.search(queryString);

      const currentSchedule = currentSchedules.data[0];
      var studyNames = currentSchedule.Appointments.map((appointment) => {
        return (
          appointment.Study.StudyName +
          " (" +
          this.familyId +
          appointment.Child.IdWithinFamily +
          ")"
        );
      });

      studyNames = Array.from(new Set(studyNames));

      const attendees = [];

      currentSchedule.Appointments.forEach((appointment) => {
        appointment.Personnels.forEach((experimenter) => {
          attendees.push({
            displayName: experimenter.Name,
            email: experimenter.Calendar, // + ".CAL",
          });
        });
      });

      var calendarEvent = {
        AppointmentTime: currentSchedule.AppointmentTime,
        summary: studyNames.join(" + "),
        location: this.$store.state.location,
        description: this.calendarDescription(
          this.scheduleNotes,
          this.appointments
        ),
        // start: {
        //   dateTime: moment(currentSchedule.AppointmentTime).toISOString(true),
        //   timeZone: "America/Toronto",
        // },
        // end: {
        //   dateTime: moment(currentSchedule.AppointmentTime)
        //     .add(1, "h")
        //     .toISOString(true),
        //   timeZone: "America/Toronto",
        // },
        attendees: attendees,
        scheduleId: this.currentSchedule.id,
      };

      try {
        await calendar.create(calendarEvent);

        this.manualCalendar = false;

        if (this.e1 == 1) {
          this.e1 = 2;
          this.emailDialog = true;
        }
      } catch (error) {
        console.log(error);
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
      var validationResults = this.$refs.scheduleDateTime.validate();

      if (validationResults) {
        this.loadingStatus = true;
        this.primaryExperimenterList = [];

        for (var i = 0; i < this.appointments.length; i++) {
          this.$refs.extraStudies[i].primaryExperimenterStatus();
        }

        var scheduleInfo = {};

        if (this.scheduleButtonText == "Study Scheduled!") {
          if (
            await this.$refs.confirmD.open(
              "Beep!",
              "You just created an appointment for this family. Do you want to do it again?"
            )
          ) {
            try {
              if (
                this.response == "Confirmed" &&
                this.primaryExperimenterList.includes(0)
              ) {
                // if any appointment without an experimenter.
                await this.$refs.confirmD.open(
                  "Who is going to run the study?",
                  "Make sure to select an experimenter for this study appointment.\n If you don't see any experimenter listed, go to Study Management page to assign experimenter(s) to this study."
                );
              } else {
                if (this.currentSchedule.id) {
                  await this.deleteUnfinishedSchedule();
                }

                scheduleInfo = await this.createSchedule();

                if (
                  this.response == "Confirmed" &&
                  this.$store.state.labEmailStatus &&
                  !this.skipStudyDateTimeStatus
                ) {
                  try {
                    await this.createCalendarEvent(scheduleInfo.calendarEvent);

                    // this.emailDialog = true;
                    // this.e1 = 2;
                    this.scheduleNextPage = true;
                    this.scheduleButtonText = "Study Scheduled!";
                  } catch (error) {
                    alert(
                      "Calendar event wasn't created successfully, please try again."
                    );
                    console.log(error);
                    this.manualCalendar = true;
                  }
                } else {
                  this.scheduleButtonText = "Study Scheduled!";
                  this.scheduleNextPage = true;
                }
              }
            } catch (error) {
              console.log(error);
            }
          }
        } else {
          try {
            if (
              this.response == "Confirmed" &&
              this.primaryExperimenterList.includes(0)
            ) {
              // if any appointment without an experimenter.
              await this.$refs.confirmD.open(
                "Who is going to run the study?",
                "Make sure to select an experimenter for this study appointment.\n If you don't see any experimenter listed, go to Study Management page to assign experimenter(s) to this study."
              );
            } else {
              if (this.currentSchedule.id) {
                await this.deleteUnfinishedSchedule();
              }

              scheduleInfo = await this.createSchedule();

              if (
                this.response == "Confirmed" &&
                this.$store.state.labEmailStatus &&
                !this.skipStudyDateTimeStatus
              ) {
                try {
                  await this.createCalendarEvent(scheduleInfo.calendarEvent);

                  // this.emailDialog = true;
                  // this.e1 = 2;
                  this.scheduleNextPage = true;
                  this.scheduleButtonText = "Study Scheduled!";
                } catch (error) {
                  alert(
                    "Calendar event wasn't created successfully, please try again."
                  );
                  console.log(error);
                  this.manualCalendar = true;
                }
              } else {
                this.scheduleButtonText = "Study Scheduled!";
                this.scheduleNextPage = true;
              }
            }
          } catch (error) {
            console.log(error);
          }
        }

        this.loadingStatus = false;
      } else {
        alert("Schedule date or time is not correct.");
      }
    },

    async continue23() {
      this.loadingStatus = true;
      try {
        if (this.emailButtonText == "Email Sent!") {
          if (
            await this.$refs.confirmD.open(
              "Send again?",
              "An email was just sent to this family. Do you want to send it again?"
            )
          ) {
            await this.$refs.Email.sendEmail();
            // this.e1 = 3;
            // this.nextContactDialog = true;
            this.emailSent = true;
            this.emailButtonText = "Email sent!";
            this.scheduleNextPage = true;
          }
        } else {
          await this.$refs.Email.sendEmail();
          // this.e1 = 3;
          // this.nextContactDialog = true;
          this.emailSent = true;
          this.emailButtonText = "Email sent!";
          this.scheduleNextPage = true;
        }
      } catch (error) {
        console.log(error);
        alert("Email wasn't sent successfully, please try again.");
      }

      this.loadingStatus = false;
    },

    async completeSchedule() {
      // update next contact date and content for the family.
      try {
        await this.$refs.NextContact.updateNextContact();
        this.$emit("newSchedule");
        this.resetSchedule();
        this.closeSchedule();
      } catch (error) {
        console.log(error);
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
      this.emailButtonText = "Send email";
      this.scheduleButtonText = "Schedule";
      setTimeout(() => {
        this.e1 = 1;
        this.currentSchedule = { id: null };
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        this.scheduleNotes = "";
        // this.response = null;
        this.studyDate = null;
        this.studyTime = null;
        this.selectedStudy = [];
        this.emailDialog = false;
        this.nextContactDialog = false;
        this.emailSent = false;
        this.scheduleNextPage = false;
        this.skipStudyDateTimeStatus = false;
        this.skipConfirmationEmailStatus = false;
        this.skipReminderEmailStatus = false;
        this.Experimenters = [];
        this.primaryExperimenterList = [];
        for (var i = 0; i < this.appointments.length; i++) {
          this.$refs.extraStudies[i].resetExperimenters();
        }
        if (this.$refs.scheduleDateTime) {
          this.$refs.scheduleDateTime.resetValidation();
        }
      }, 1000);
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

    async deleteChild(currentChild, index) {
      if (
        await this.$refs.confirmD.open(
          "Beep!",
          "All the participation record of this child will be removed.<br><br>Are you sure about removing this child?"
        )
      ) {
        try {
          await child.delete(currentChild);

          alert("The child is removed from the database.");

          this.Children.splice(index, 1);
        } catch (error) {
          console.log(error);
        }
      }
    },

    birthday(DoB) {
      if (DoB) {
        return (
          moment(DoB).month() === moment().month() &&
          moment(DoB).date() === moment().date()
        );
      } else {
        return false;
      }
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

            this.$refs.formChild.resetValidation();

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
            this.editedItem.IdWithinFamily = newChild.data.IdWithinFamily;

            this.Children.push(this.editedItem);

            console.log("Child is creted and siblings are updated!");

            this.$refs.formChild.resetValidation();

            this.close();
          }
        }
      } catch (error) {
        console.log(error);
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
      if (this.currentFamily.AssignedLab) {
        alert(
          "This family is currently being scheduled by an other study.\nYou can recruit this child after they finish the current study."
        );
      } else {
        this.appointments = [];

        this.currentChildIndex = index;
        this.currentChild = Object.assign({}, child);

        var newAppointment = Object.assign({}, this.defaultAppointment);

        newAppointment.FK_Child = child.id;
        newAppointment.Child = child;
        newAppointment.FK_Family = child.FK_Family;
        newAppointment.index = this.appointments.length;
        newAppointment.Child.Family = {};
        newAppointment.Child.Family.Email = this.currentFamily.Email; // family email information used for sending email
        newAppointment.Child.Family.NamePrimary = this.currentFamily.NamePrimary; // family email information used for sending email

        this.appointments.push(newAppointment);

        this.dialogSchedule = true;
      }
    },

    datePick() {
      this.datePicker = false;
      setTimeout(() => {
        this.$refs.studyDate.focus();
      }, 100);
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

    AgeFormated(DoB) {
      var formated = "DoB is not available.";
      if (DoB) {
        if (moment().diff(DoB, "days") > 0) {
          var years = moment().diff(DoB, "years");
          var months = moment().diff(DoB, "months", true);

          months = months - years * 12;
          months = months.toFixed(1);

          var Y = years > 0 ? years + (years > 1 ? " years " : " year ") : "";
          var M =
            months > 0 ? months + (months === 1 ? " month " : " months ") : "";
          formated = Y + M;
        } else {
          formated = "Not born yet.";
        }
      }
      return formated;
    },

    languageDisplay(child) {
      var formatedLanguage =
        "<strong>Spoken Language:</strong> " +
        (child.Language ? child.Language : "NA") +
        "<br>" +
        "<strong>School Language:</strong> " +
        (child.SchoolLanguage ? child.SchoolLanguage : "NA") +
        "<br>" +
        "<strong>Home Language:</strong> " +
        (child.HomeLanguage ? child.HomeLanguage : "NA");

      return formatedLanguage;
    },

    school(child) {
      var formatedSchool =
        "<strong>School:</strong> " + (child.School ? child.School : "NA");

      return formatedSchool;
    },

    noteChild(child) {
      var Note = "<strong>Note:</strong> " + (child.Note ? child.Note : "");

      var recruitMethod =
        "<strong>Recruited from:</strong> " +
        (child.RecruitmentMethod ? child.RecruitmentMethod : "");

      return Note + "<br>" + recruitMethod;
    },

    age(child) {
      var formatedAge = "<strong>Age:</strong> " + this.AgeFormated(child.DoB);
      return formatedAge;
    },

    calendarDescription(notes, appointments) {
      const schedule = {
        Note: notes,
        Appointments: appointments,
      };
      var description = "<b>Note: </b>" + schedule.Note + "<br>";

      schedule.Appointments.forEach((appointment) => {
        description =
          description +
          "<br>==================" +
          "<br><b>" +
          appointment.Study.StudyName +
          "</b><br>" +
          "<b>E1: </b>" +
          appointment.E1 +
          "<br>" +
          "<b>E2: </b>" +
          appointment.E2 +
          "<br>";

        if (appointment.Study.StudyType == "Online")
          description =
            description +
            "<b>zoom link: </b>" +
            appointment.PrimaryExperimenter[0].ZoomLink;
      });
      return description;
    },
  },

  computed: {
    ElegibleStudies() {
      if (this.Children) {
        var elegibleStudies = this.Children.map((child) => {
          let studyIds = [];
          this.$store.state.studies.forEach((study) => {
            if (this.studyElegibility(study, child)) {
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

    UniquePreviousStudies() {
      return this.Children.map((child) => {
        let studyIds = [];
        child.Appointments.forEach((appointment) => {
          studyIds.push(appointment.FK_Study);
        });

        return studyIds;
      });
    },

    PotentialStudies() {
      var PotentialStudies = [];

      for (var i = 0; i < this.ElegibleStudies.length; i++) {
        var elegibleStudy = this.ElegibleStudies[i];
        var previousStudies = this.UniquePreviousStudies[i];

        previousStudies = Array.from(new Set(previousStudies));

        let potentialStudyIds = elegibleStudy.filter(
          (study) => !previousStudies.includes(study)
        );

        var PotentialStudyList = this.$store.state.studies.filter((study) =>
          potentialStudyIds.includes(study.id)
        );

        PotentialStudies.push(PotentialStudyList);
      }

      return PotentialStudies;
    },

    studyDateTime() {
      if (this.studyTime && this.studyDate) {
        var StudyTimeString = this.studyTime.slice(0, 5);
        var AMPM = this.studyTime.slice(5, 7);
        var StudyHour = StudyTimeString.split(":")[0];
        var StudyMin = StudyTimeString.split(":")[1];

        switch (AMPM) {
          case "PM":
            if (parseInt(StudyHour) < 12) {
              StudyHour = parseInt(StudyHour) + 12;
            }
            StudyHour = StudyHour.toString();
            break;
        }

        if (StudyHour.length == 1) {
          StudyHour = "0" + StudyHour;
        }

        if (StudyMin.length == 1) {
          StudyMin = "0" + StudyMin;
        }

        var studyDateTime = this.studyDate + "T" + StudyHour + ":" + StudyMin;

        return studyDateTime;
      } else {
        return null;
      }
    },

    earliestDate() {
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
        return moment()
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
