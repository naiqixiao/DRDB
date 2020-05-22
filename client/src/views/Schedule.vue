<template>
  <v-container fluid>
    <v-row justify="space-around">
      <v-col cols="12" md="4">
        <v-row  dense>
          <v-col cols="12" md="12">
            <h1 class="text-left">Choose a study</h1>
          </v-col>
          <v-col cols="12" md="12">
            <v-select
              class="selection"
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
          </v-col>
        </v-row>

        <v-row>
          <v-col md="12" class="subtitle">
            <v-divider></v-divider>
            <h4 class="text-left">Study information:</h4>
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
            v-for="field in this.$studyBasicFields"
            :key="field.label"
          >
            <v-text-field
              height="48px"
              background-color="textbackground"
              hide-details
              :label="field.label"
              v-model="selectedStudy[field.field]"
              placeholder="  "
              outlined
              dense
            ></v-text-field>
          </v-col>
          <v-col md="12" class="subtitle">
            <v-textarea
              label="Study summary"
              outlined
              no-resize
              rows="3"
              solo
              v-model="selectedStudy.Description"
            ></v-textarea
          ></v-col>
        </v-row>

        <v-row>
          <v-col md="12" class="subtitle">
            <v-divider></v-divider>
            <h4 class="text-left">Study criteria:</h4>
          </v-col>

          <v-col
            cols="12"
            sm="6"
            md="4"
            v-for="field in this.$studyCriteriaFields"
            :key="field.label"
          >
            <v-text-field
              height="48px"
              background-color="textbackground"
              hide-details
              :label="field.label"
              v-model="selectedStudy[field.field]"
              placeholder="  "
              outlined
              dense
            ></v-text-field>
          </v-col>
        </v-row>
        <!-- <h4>{{ selectedStudy.StudyName }}</h4>
        <h4>{{ selectedStudy.MinAge }}</h4>
        <h4>{{ selectedStudy.MaxAge }}</h4>
        <p>{{ selectedStudy.Description }}</p>

        <v-btn @click.stop="dialogEmail = true" color="primary"
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
        ></EmailDialog> -->
      </v-col>

      <v-col cols="12" md="5">
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
        <v-row justify="start" align="center">
          <v-col md="12" class="subtitle">
            <v-divider></v-divider>
            <h4 class="text-left">Family information:</h4>
          </v-col>
          <v-col
            cols="12"
            md="5"
            v-for="field in familyField"
            :key="field.label"
          >
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
          <v-col cols="12" md="2" style="text-align: center;">
            <v-btn
              color="primary"
              fab
              @click.stop="editFamily"
              :disabled="!currentFamily.id"
              ><v-icon>edit</v-icon></v-btn
            >
          </v-col>
        </v-row>

        <v-dialog
          v-model="dialogFamilyEdit"
          max-width="1200px"
          :retain-focus="false"
        >
          <v-card outlined>
            <v-card-title>
              <span class="headline">Edit family information</span>
              <v-spacer></v-spacer>
              <span class="headline">{{
                "Family ID: " + currentFamily.id
              }}</span>
            </v-card-title>

            <v-form ref="formFamily" v-model="validFamily" lazy-validation>
              <v-row>
                <v-col md="12" class="subtitle">
                  <v-divider></v-divider>
                  <h4 class="text-left">Family information:</h4>
                </v-col>
                <v-col
                  cols="12"
                  :md="field.width"
                  v-for="field in this.$familyBasicInfo"
                  :key="field.label"
                >
                  <div v-if="field.options">
                    <v-combobox
                      justify="start"
                      :items="options[field.options]"
                      v-model="editedFamily[field.field]"
                      outlined
                      :label="field.label"
                      dense
                    ></v-combobox>
                  </div>
                  <div v-else-if="field.rules">
                    <v-text-field
                      :label="field.label"
                      :rules="rules[field.rules]"
                      v-model="editedFamily[field.field]"
                      outlined
                      hide-details
                      dense
                    ></v-text-field>
                  </div>
                  <div v-else>
                    <v-text-field
                      :label="field.label"
                      v-model="editedFamily[field.field]"
                      outlined
                      hide-details
                      dense
                    ></v-text-field>
                  </div>
                </v-col>

                <v-col md="12" class="subtitle">
                  <v-divider></v-divider>
                  <h4 class="text-left">Contact information:</h4>
                </v-col>
                <v-col
                  cols="12"
                  :md="field.width"
                  v-for="field in this.$familyContactInfo"
                  :key="field.label"
                >
                  <div v-if="field.options">
                    <v-combobox
                      justify="start"
                      :items="options[field.options]"
                      v-model="editedFamily[field.field]"
                      outlined
                      :label="field.label"
                      dense
                    ></v-combobox>
                  </div>
                  <div v-else-if="field.rules">
                    <v-text-field
                      :label="field.label"
                      :rules="rules[field.rules]"
                      v-model="editedFamily[field.field]"
                      outlined
                      hide-details
                      dense
                    ></v-text-field>
                  </div>
                  <div v-else>
                    <v-text-field
                      :label="field.label"
                      v-model="editedFamily[field.field]"
                      outlined
                      hide-details
                      dense
                    ></v-text-field>
                  </div>
                </v-col>
                <v-col md="12" class="subtitle">
                  <v-divider></v-divider>
                  <h4 class="text-left">Notes:</h4>
                </v-col>
                <v-col md="8" class="subtitle">
                  <v-textarea
                    label=""
                    outlined
                    no-resize
                    rows="3"
                    solo
                    v-model="editedFamily.Note"
                  ></v-textarea
                ></v-col>
              </v-row>
            </v-form>
            <v-card-actions>
              <v-row justify="space-between" style="height: 50px">
                <v-col md="4"></v-col>
                <v-col md="2">
                  <v-btn color="primary" @click="dialogFamilyEdit = false"
                    >Cancel</v-btn
                  >
                </v-col>
                <v-col md="2">
                  <v-btn color="primary" @click="saveFamily">Save</v-btn>
                </v-col>
                <v-col md="4"></v-col>
              </v-row>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-row justify="start" align="center">
          <v-col md="12" class="subtitle">
            <v-divider></v-divider>
            <h4 class="text-left">Child information:</h4>
          </v-col>
          <v-col
            cols="12"
            md="5"
            v-for="field in childField"
            :key="field.label"
          >
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
          <v-col cols="12" md="2" style="text-align: center;">
            <v-btn
              color="primary"
              fab
              @click.stop="editChild"
              :disabled="!currentChild.id"
              ><v-icon>edit</v-icon></v-btn
            >
          </v-col>
        </v-row>

        <v-row justify="space-around" align="center">
          <v-col md="12" class="subtitle">
            <v-divider></v-divider>
            <h4 class="text-left">Schedule a study for this child</h4>
          </v-col>
          <v-col cols="12" md="9">
            <v-select
              :items="Responses"
              v-model="response"
              label="Parents' response"
              :disabled="!currentChild.id"
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
                    v-model="editedChild.DoB"
                    show-current
                    :max="new Date().toISOString()"
                    @click:date="dobPicker = false"
                  ></v-date-picker>
                </v-col>
              </v-row>
            </v-card>
          </v-dialog>

          <v-dialog
            v-model="dialogChildEdit"
            max-width="800px"
            :retain-focus="false"
          >
            <v-card>
              <v-card-title>
                <span class="headline">Child's information</span>
              </v-card-title>

              <v-form ref="formChild" v-model="validChild" lazy-validation>
                <v-container>
                  <v-row>
                    <v-col cols="12" sm="6" md="4">
                      <v-text-field
                        v-model="editedChild.Name"
                        :rules="this.$rules.name"
                        label="Name"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6" md="4">
                      <v-text-field
                        v-model="editedChild.DoB"
                        append-icon="event"
                        @click:append="dobPicker = true"
                        :rules="this.$rules.dob"
                        label="Date of birth (YYYY-MM-DD)"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6" md="4">
                      <v-select
                        v-model="editedChild.Sex"
                        :items="this.$Sex"
                        outlined
                        hide-details
                        dense
                        label="Sex"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" sm="6" md="4">
                      <v-text-field
                        v-model="editedChild.BirthWeight"
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
                    <v-btn color="primary" @click="dialogChildEdit = false"
                      >Cancel</v-btn
                    >
                  </v-col>
                  <v-col md="2">
                    <v-btn color="primary" @click="saveChild">Save</v-btn>
                  </v-col>
                  <v-col md="4"></v-col>
                </v-row>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-dialog
            v-model="dialogSchedule"
            max-width="1000px"
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

                <v-stepper-step :complete="e1 > 2" step="2"
                  >Email</v-stepper-step
                >

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
                          :disabled="this.response != 'Confirmed'"
                          hide-details
                          dense
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="1"> </v-col>
                      <v-col cols="12" md="2">
                        <v-combobox
                          v-model="studyTime"
                          :items="this.$studyTimeSlots"
                          label="Study time"
                          :disabled="this.response != 'Confirmed'"
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
                          <v-col cols="12" md="2" class="text-left">
                            <v-btn
                              class="text-capitalize"
                              rounded
                              color="primary"
                              @click="newAppointment(currentChild)"
                              :disabled="
                                potentialStudies(currentChild).selectableStudies
                                  .length < 1
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
                              class="text-capitalize"
                              rounded
                              color="primary"
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
                  </v-card>
                  <v-divider></v-divider>
                  <v-row justify="space-between" align="center">
                    <v-col cols="12" md="2"></v-col>
                    <v-col cols="12" md="6">
                      <v-btn
                        color="primary"
                        :disabled="!studyDate"
                        @click="continue12()"
                      >
                        <v-icon dark left v-show="scheduleId"
                          >mdi-checkbox-marked-circle</v-icon
                        >
                        {{ scheduleButtonText }}
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
                    :emailTemplate="selectedStudy.EmailTemplate"
                    :data="{
                      nameMom: currentFamily.NameMom,
                      childName: currentChild.Name,
                      Email: currentFamily.Email,
                      scheduleTime: studyDateTime,
                    }"
                    :emailType="emailType"
                  ></Email>
                  <v-divider></v-divider>
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

                  <v-divider></v-divider>
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
        </v-row>
      </v-col>
      <v-col cols="12" md="3">
        <Conversation
          :Conversation="currentFamily.Conversations"
          :familyId="parseInt(currentFamily.id)"
        ></Conversation>
      </v-col>
    </v-row>

    <v-row justify="start">
      <v-col cols="12" md="9">
        <AppointmentTableBrief
          :Appointments="currentFamily.Appointments"
          :family="currentFamily"
        ></AppointmentTableBrief>
      </v-col>

      <v-col cols="12" md="3">
        <ParticipationHistory :family="currentFamily" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import store from "@/store";
import child from "@/services/child";
import study from "@/services/study";
import family from "@/services/family";

import schedule from "@/services/schedule";
import calendar from "@/services/calendar";

import moment from "moment";

import AgeDisplay from "@/components/AgeDisplay";
import ExtraStudies from "@/components/ExtraStudies";

import Conversation from "@/components/Conversation";

import Email from "@/components/Email";
import NextContact from "@/components/NextContact";

import AppointmentTableBrief from "@/components/AppointmentTableBrief";
import ParticipationHistory from "@/components/ParticipationHistory";

import Page from "@/components/Page";

export default {
  components: {
    AgeDisplay,
    Conversation,
    ExtraStudies,
    Email,
    NextContact,
    Page,
    AppointmentTableBrief,
    ParticipationHistory,
  },
  props: {},
  data() {
    return {
      scheduleId: null,
      manualCalendar: false,
      dialogEmail: false,
      e1: 1,
      emailDialog: false,
      dialogChildEdit: false,
      dialogFamilyEdit: false,
      dialogSchedule: false,
      dobPicker: false,
      datePicker: false,
      validChild: true,
      validFamily: true,
      studies: [],
      selectedStudy: {},
      Children: [],
      elegibleExperimenters: [],
      scheduleButtonIcon: "event",
      scheduleButtonText: "Schedule",
      scheduleNextPage: false,
      emailType: "Confirmation",
      emailSent: false,
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
      editedChild: {
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
      editedFamily: {},
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
      options: {
        language: ["English", "French", "Chinese", "Spanish", "Hindi"],
        race: ["Indian", "Asian", "African", "Hispanic", "Caucasian", "Arabic"],
        recruitmentMethod: [
          "Hospital",
          "Events",
          "SocialMedia",
          "PreviousParticipation",
        ],
      },

      rules: {
        name: [
          (value) => !!value || "Required.",
          (value) => {
            var pattern = /^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/;
            return pattern.test(value) || "Invalid Name.";
          },
          (value) => (value && value.length <= 30) || "Max 30 characters",
        ],
        email: [
          (value) => !!value || "Required.",
          (value) => {
            const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return pattern.test(value) || "Invalid e-mail.";
          },
          (value) => (value && value.length <= 30) || "Max 30 characters",
        ],
        phone: [
          (value) => {
            const pattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            return pattern.test(value) || "Invalid phone.";
          },
          (value) => !!value || "Required.",
          (value) => (value && value.length == 10) || "Have to be 10 digits",
        ],
        dob: [
          (value) => !!value || "Required.",
          (value) => {
            var pattern = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
            return pattern.test(value) || "Invalid Date of Birth.";
          },
        ],
        birthWeight: [
          (value) => {
            var pattern = /^[0-9]{1,2}[:.,-]?$/;
            return pattern.test(value) || "Invalid Birth Weight.";
          },
        ],
      },
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

    editFamily() {
      this.editedIndex = this.Children.indexOf(this.currentChild);
      this.editedFamily = Object.assign({}, this.currentFamily);
      this.dialogFamilyEdit = true;
    },

    editChild() {
      this.editedIndex = this.Children.indexOf(this.currentChild);
      this.editedChild = Object.assign({}, this.currentChild);
      this.dialogChildEdit = true;
    },

    async saveFamily() {
      var validationResults = this.$refs.formFamily.validate();

      if (validationResults) {
        this.editedFamily.UpdatedBy = store.state.userID;

        try {
          await family.update(this.editedFamily);

          this.currentChild.Family = this.editedFamily;

          Object.assign(this.Children[this.editedIndex], this.currentChild);

          console.log("Family Info is updated!");

          this.closeFamily();
        } catch (error) {
          console.log(error.response);
        }
      }
    },

    async saveChild() {
      try {
        var validationResults = false;

        validationResults = this.$refs.formChild.validate();

        if (validationResults) {
          this.editedChild.Age = Math.floor(
            (new Date() - new Date(this.editedChild.DoB)) / (24 * 3600 * 1000)
          );

          await child.update(this.editedChild);

          Object.assign(this.Children[this.editedIndex], this.editedChild);

          console.log("Child information updated!");

          this.closeChild();
        }
      } catch (error) {
        console.log(error.response);
      }
    },

    closeChild() {
      this.dialogChildEdit = false;
      setTimeout(() => {
        this.editedChild = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    },

    closeFamily() {
      this.dialogFamilyEdit = false;
      setTimeout(() => {
        this.editedFamily = {};
        this.editedIndex = -1;
      }, 300);
    },

    scheduleChild() {
      this.editedIndex = this.Children.indexOf(this.currentChild);
      this.editedChild = Object.assign({}, this.currentChild);

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

      this.dialogSchedule = true;
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
          var studyNames = this.appointments.map((appointment) => {
            return appointment.Study.StudyName + " (" + appointment.FK_Family + appointment.Child.IdWithinFamily + ")";
          });

          studyNames = Array.from(new Set(studyNames));

          newSchedule = {
            AppointmentTime: moment(this.studyDateTime).toISOString(true),
            Status: this.response,
            summary:
              studyNames.join(" + "),
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

        console.log("New Scheduled Created!");

        return { calendarEvent: calendarEvent };
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
        return appointment.Study.StudyName + " (" + appointment.FK_Family + appointment.Child.IdWithinFamily + ")";

      });

      studyNames = Array.from(new Set(studyNames));

      const attendees = [];

      currentSchedule.Appointments.forEach((appointment) => {
        appointment.Personnels.forEach((experimenter) => {
          attendees.push({
            displayName: experimenter.Name,
            email: experimenter.Calendar// + ".CAL",
          });
        });
      });

      var calendarEvent = {
        summary:
          studyNames.join(" + "),
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
          // this.e1 = 2;
          // this.emailDialog = true;
          this.scheduleNextPage = true;
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
        this.emailSent = false;
        this.scheduleNextPage = false;
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

    closeEmail() {
      this.dialogEmail = false;
    },

    nextContact() {
      this.e1 = 3;
    },
  },

  computed: {
    currentFamily() {
      if (this.currentChild) {
        return this.currentChild.Family;
      } else {
        return null;
      }
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
            moment(this.editedChild.DoB).add(
              Math.floor(this.selectedStudy.MinAge * 30.5),
              "days"
            )
          )
      ) {
        return moment(new Date())
          .add(1, "days")
          .toISOString(true);
      } else {
        return moment(this.editedChild.DoB)
          .add(Math.floor(this.selectedStudy.MinAge * 30.5), "days")
          .toISOString(true);
      }
    },

    latestDate: function() {
      return moment(this.editedChild.DoB)
        .add(Math.floor(this.selectedStudy.MaxAge * 30.5), "days")
        .toISOString(true);
    },
  },
  mounted: function() {
    this.searchStudies();
  },

  watch: {
    dialogChildEdit(val) {
      val || this.closeChild();
    },

    dialogFamilyEdit(val) {
      val || this.closeFamily();
    },

    dialogSchedule(val) {
      val || this.closeSchedule();
    },

    response(val) {
      switch (val) {
        case "Confirmed": {
          this.scheduleButtonIcon = "event";
          this.scheduleButtonText = "Schedule";
          this.studyTime = "09:00AM";
          this.emailType = "Confirmation";
          break;
        }
        case "Left a message":
        case "Interested": {
          this.scheduleButtonIcon = "email";
          this.scheduleButtonText = "Confirm a tentative appointment";
          this.studyTime = "";
          this.emailType = "Introduction";
          break;
        }

        case "Rejected": {
          this.scheduleButtonIcon = "sentiment_dissatisfied";
          this.scheduleButtonText = "Confirm rejection";
          this.studyTime = "";
          this.emailType = "Introduction";
          break;
        }

        default:
          this.scheduleButtonIcon = "event";
          this.scheduleButtonText = "Schedule";
          this.studyTime = "";
          break;
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
