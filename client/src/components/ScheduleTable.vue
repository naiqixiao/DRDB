<template>
  <v-data-table
    hide-default-footer
    disable-pagination
    fixed-header
    :height="tableHeight"
    single-select
    no-data-text="No study schedule to display."
    :headers="this.$headersSchedule"
    :items="Schedules"
    class="elevation-1"
    @click:row="rowSelected"
    single-expand
  >
    <template #item.Child="{ item }">
      <ChildNameSchedule :item="item" />
      <!-- <v-spacer></v-spacer> -->
      <v-icon @click="showScheduleNote(item)"
        >{{ item.Note && item.Note != "null" ? "textsms" : "chat_bubble" }}
      </v-icon>
    </template>
    <template #item.Study="{ item }">
      <StudyNameSchedule :item="item" />
    </template>
    <template #item.AppointmentTime="{ item, value }">
      <DateDisplay :date="value" :format="'long'" :status="item.Status" />
    </template>
    <template #item.updatedAt="{ item, value }">
      <DateDisplay :date="value" :format="'short'" :status="item.Status" />
    </template>
    <template #item.AgeByParticipation="{ item }">
      <AgeByParticipationSchedule :item="item" />
    </template>

    <template v-slot:item.Status="{ item }">
      <v-chip :color="getColor(item.Status, item.Completed)" dark>
        {{
          item.Status == "Confirmed" && item.Completed
            ? "Completed"
            : item.Status
        }}
      </v-chip>
    </template>

    <template #item.actions="{ item }">
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            @click.stop="updateSchedule(item, 'Confirmed')"
            :disabled="item.Status === 'Confirmed' || item.Completed == true"
            v-bind="attrs"
            v-on="on"
            class="tableIcon"
            >event</v-icon
          >
        </template>
        <span>Pick study date and time</span>
      </v-tooltip>

      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            @click.stop="updateSchedule(item, 'Rescheduling')"
            :disabled="
              item.Status === 'Rescheduling' ||
              item.Status === 'No Show' ||
              item.Status === 'TBD' ||
              item.Status === 'Rejected' ||
              item.Completed == true
            "
            v-bind="attrs"
            v-on="on"
            class="tableIcon"
            >update</v-icon
          >
        </template>
        <span>Reschedule this appointment</span>
      </v-tooltip>

      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            @click.stop="updateSchedule(item, 'No Show')"
            :disabled="
              item.Status === 'Rescheduling' ||
              item.Status === 'No Show' ||
              item.Status === 'TBD' ||
              item.Status === 'Rejected' ||
              item.Completed == true
            "
            v-bind="attrs"
            v-on="on"
            class="tableIcon"
            >sentiment_dissatisfied</v-icon
          >
        </template>
        <span>No show</span>
      </v-tooltip>

      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            @click.stop="
              item.Status === 'TBD'
                ? updateSchedule(item, 'Rejected')
                : updateSchedule(item, 'Cancelled')
            "
            :disabled="
              item.Status === 'Cancelled' ||
              item.Status === 'Rejected' ||
              item.Completed == true
            "
            v-bind="attrs"
            v-on="on"
            class="tableIcon"
            >not_interested</v-icon
          >
        </template>
        <span>{{
          item.Status === "TBD"
            ? "The parent rejected participation?"
            : "Cancel this appointment"
        }}</span>
      </v-tooltip>
    </template>

    <template #item.Reminded="{ item }">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <div v-on="on">
            <v-simple-checkbox
              :value="!!item.Reminded"
              class="mr-0 pa-0"
              @input="updateSchedule(item, 'Reminded')"
              dense
              :disabled="remindIconEnable(item)"
            ></v-simple-checkbox>
          </div>
        </template>
        <span>Confirm reminder is sent</span>
      </v-tooltip>
    </template>

    <template #item.Completed="{ item }">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <div v-on="on">
            <v-simple-checkbox
              :value="!!item.Completed"
              class="mr-0 pa-0"
              @input="updateSchedule(item, 'Completed')"
              dense
            ></v-simple-checkbox>
            <!-- :disabled="completeIconEnable(item)" -->
          </div>
        </template>
        <span>Mark the study is done.</span>
      </v-tooltip>
    </template>

    <template #item.ThankYouEmail="{ item }">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <div v-on="on">
            <v-icon
              :color="item.ThankYouEmail ? 'pink darken-1' : 'primary'"
              :disabled="tyEmailEnable(item)"
              @click="tyEmail(item)"
              >{{ item.ThankYouEmail ? "favorite" : "favorite_border" }}</v-icon
            >
            <!-- :disabled="completeIconEnable(item)" -->
          </div>
        </template>
        <span>Thank you email.</span>
      </v-tooltip>
      <!-- <v-icon ></v-icon> -->
    </template>

    <template #expanded-item="{ headers, item }">
      <td :colspan="headers.length">
        <v-row
          justify="space-between"
          height="190px"
          style="background-color: rgba(0, 0, 0, 0)"
        >
          <MiniAppointmentTable
            :Schedule="item"
            :Index="Schedules.indexOf(item)"
            @updateSchedule="updateSchedule"
          ></MiniAppointmentTable>
        </v-row>
      </td>
    </template>

    <template #top>
      <ConfirmDlg ref="confirmD" />

      <v-dialog
        v-model="nextContactDialog"
        max-width="800px"
        :retain-focus="false"
        persistent
      >
        <v-card outlined>
          <v-card-title>
            <span class="headline">Notes for the next contact</span>
          </v-card-title>
          <NextContact
            ref="NextContact"
            :familyId="editedSchedule.FK_Family"
            :labId="$store.state.lab"
            :studyDate="nextContactDate"
            :contactType="contactType"
            :nextContactDialog="nextContactDialog"
            @nextContactDone="updateNextContactFrontend"
          ></NextContact>

          <v-card-actions style="padding: 16px">
            <v-row justify="space-between">
              <v-col md="4"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="nextContactDialog = false"
                  >Cancel</v-btn
                >
              </v-col>
              <v-col md="2">
                <v-btn color="primary" @click="updateNextContact">Save</v-btn>
              </v-col>
              <v-col md="4"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="dialog" max-width="1200px">
        <v-stepper v-model="e1">
          <v-stepper-header>
            <v-stepper-step
              :complete="e1 > 1"
              editable
              step="1"
              @click="emailDialog = false"
              >Reschedule</v-stepper-step
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
                    <v-row
                      style="height: 100px"
                      align="center"
                      justify="start"
                      dense
                    >
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
                          :disabled="
                            response != 'Confirmed' || skipStudyDateTimeStatus
                          "
                          hide-details
                          dense
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="1"></v-col>
                      <v-col cols="12" md="2">
                        <v-combobox
                          v-model="studyTime"
                          :items="$studyTimeSlots"
                          :rules="$rules.time"
                          label="Study time"
                          :disabled="
                            response != 'Confirmed' || skipStudyDateTimeStatus
                          "
                          hide-details
                          dense
                        ></v-combobox>
                      </v-col>
                      <v-col cols="12" md="1"></v-col>
                      <v-col cols="12" md="3">
                        <v-tooltip right>
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
                        <v-tooltip right>
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
                  <v-divider style="margin-bottom: 16px"></v-divider>
                  <div style="height: 290px; overflow-y: scroll !important">
                    <ExtraStudies
                      ref="extraStudies"
                      v-for="(
                        appointment, index
                      ) in editedSchedule.Appointments"
                      :key="appointment.id"
                      :child="appointment.Child"
                      :targetChild="appointment.Child"
                      :currentStudy="appointment.Study"
                      :index="index"
                      :response="response"
                      :potentialStudies="
                        potentialStudies(
                          appointment.Child,
                          appointment.FK_Study
                        ).potentialStudyList
                      "
                      type="reSchedule"
                      :nOfAppointments="editedSchedule.Appointments.length"
                      @selectStudy="selectStudy"
                      @deleteAppointment="deleteAppointment"
                      @emitSelectedStudy="receiveSelectedStudy"
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
                    <v-col cols="12" md="3" class="text-left">
                      <h4 class="text-left">Additional appointment(s) for:</h4>
                    </v-col>
                    <v-col
                      cols="12"
                      md="2"
                      v-for="child in editedSchedule.Family.Children"
                      :key="child.id"
                    >
                      <v-btn
                        class="text-capitalize"
                        rounded
                        color="primary"
                        @click="newAppointment(child)"
                        :disabled="
                          potentialStudies(child).selectableStudies.length < 1
                        "
                        >{{
                          !!child.Name
                            ? child.Name.split(" ")[0]
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
                        v-model="editedSchedule.Note"
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
                    color="primary"
                    :disabled="!(studyDateTime || skipStudyDateTimeStatus)"
                    @click="continue12()"
                    :loading="loadingStatus"
                  >
                    <v-icon dark left v-show="scheduleUpdated"
                      >mdi-checkbox-marked-circle</v-icon
                    >{{ scheduleButtonText }}
                  </v-btn>
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
                    :appointments="editedSchedule.Appointments"
                    :scheduleInfo="editedSchedule"
                    :familyInfo="editedSchedule.Family"
                    emailType="Confirmation"
                  ></Email>
                </v-card>
              </v-row>
              <!-- <v-divider></v-divider> -->
              <v-row
                dense
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
                      !editedSchedule.Family.Email ||
                      skipConfirmationEmailStatus ||
                      !$store.state.labEmailStatus
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
                      !!editedSchedule.Family.Email &&
                      !skipConfirmationEmailStatus
                    "
                    @click="scheduleNextStep"
                    >{{
                      !!editedSchedule.Family.Email &&
                      !skipConfirmationEmailStatus &&
                      $store.state.labEmailStatus
                        ? "Next"
                        : "Skip email"
                    }}</v-btn
                  >
                </v-col>
              </v-row>
            </v-stepper-content>

            <v-stepper-content step="3">
              <NextContact
                ref="NextContactStepper"
                :familyId="editedSchedule.FK_Family"
                :labId="$store.state.lab"
                :studyDate="studyDate"
                contactType="Confirmed"
                :nextContactDialog="nextContactDialogStepper"
                @nextContactDone="updateNextContactFrontend"
              ></NextContact>
              <!-- <v-divider></v-divider> -->
              <v-row
                dense
                justify="space-between"
                align="center"
                style="padding: 8px"
              >
                <v-col>
                  <v-btn color="primary" @click="completeSchedule"
                    >Complete</v-btn
                  >
                </v-col>
              </v-row>
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </v-dialog>

      <v-dialog v-model="dialogReminderEmail" max-width="1000px">
        <v-card outlined>
          <v-card-title>
            <span class="headline">Reminder email</span>
          </v-card-title>
          <v-row style="height: 700px" align="start" justify="center" dense>
            <Email
              ref="Email"
              :dialog="dialogReminderEmail"
              :appointments="editedSchedule.Appointments"
              :scheduleInfo="editedSchedule"
              :familyInfo="editedSchedule.Family"
              emailType="Reminder"
            ></Email>
          </v-row>
          <v-card-actions>
            <v-row justify="space-between" align="center">
              <v-col cols="12" md="2">
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <div v-on="on">
                      <v-checkbox
                        label="Skip email"
                        class="ma-0 pa-0"
                        :value="skipReminderEmailStatus"
                        @change="skipReminderEmail()"
                        dense
                      ></v-checkbox>
                    </div>
                  </template>
                  <span>Check this box to skip emailing to parents.</span>
                </v-tooltip>
              </v-col>
              <v-col cols="12" md="6">
                <v-btn
                  color="primary"
                  :disabled="
                    !!!editedSchedule.Family.Email ||
                    skipReminderEmailStatus ||
                    !$store.state.labEmailStatus
                  "
                  @click="sendReminderEmail()"
                >
                  <v-icon dark left v-show="reminderEmailStatus"
                    >mdi-checkbox-marked-circle</v-icon
                  >
                  {{ emailButtonText }}
                </v-btn>
              </v-col>
              <v-col cols="12" md="2">
                <v-btn
                  :disabled="!(reminderEmailStatus || skipReminderEmailStatus)"
                  @click="closeReminderEmail()"
                  >Complete</v-btn
                >
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="dialogTYEmail" max-width="1100px">
        <v-card outlined>
          <v-card-title>
            <span class="headline">Thank you email</span>
          </v-card-title>
          <v-row style="height: 700px" align="start" justify="center" dense>
            <Email
              ref="Email"
              :dialog="dialogTYEmail"
              :appointments="editedSchedule.Appointments"
              :scheduleInfo="editedSchedule"
              :familyInfo="editedSchedule.Family"
              emailType="ThankYou"
            ></Email>
          </v-row>
          <v-card-actions>
            <v-row justify="center" align="center">
              <v-col cols="12" md="2">
                <v-btn
                  color="primary"
                  :disabled="
                    !!!editedSchedule.Family.Email ||
                    skipReminderEmailStatus ||
                    !$store.state.labEmailStatus
                  "
                  @click="sendTYEmail()"
                >
                  <v-icon dark left v-show="reminderEmailStatus"
                    >mdi-checkbox-marked-circle</v-icon
                  >
                  {{ emailButtonText }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="dialogNote" max-width="600px">
        <v-card outlined>
          <v-card-title>
            <span class="headline">Notes for this appointment</span>
          </v-card-title>
          <v-card-text>
            <v-row justify="space-between" align="end" dense>
              <v-col class="noPadding">
                <v-textarea
                  class="conv-textarea"
                  outlined
                  no-resize
                  rows="12"
                  hide-details
                  v-model="editedSchedule.Note"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions style="padding: 16px">
            <v-row justify="space-between">
              <v-col md="2"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="closeScheduleNotes"
                  >Cancel</v-btn
                >
              </v-col>
              <v-col md="2">
                <v-btn color="primary" @click="saveScheduleNotes">Save</v-btn>
              </v-col>
              <v-col md="2"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
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
    </template>
  </v-data-table>
</template>

<script>
import DateDisplay from "@/components/DateDisplay";
import AgeByParticipationSchedule from "@/components/AgeByParticipationSchedule";
import ChildNameSchedule from "@/components/ChildNameSchedule";
import StudyNameSchedule from "@/components/StudyNameSchedule";
import MiniAppointmentTable from "@/components/MiniAppointmentTable";

import NextContact from "@/components/NextContact";
import Email from "@/components/Email";

import ConfirmDlg from "@/components/ConfirmDialog";

import schedule from "@/services/schedule";

import ExtraStudies from "@/components/ExtraStudies";

import moment from "moment-timezone";

import login from "@/services/login";

export default {
  components: {
    DateDisplay,
    AgeByParticipationSchedule,
    ChildNameSchedule,
    StudyNameSchedule,
    MiniAppointmentTable,
    Email,
    NextContact,
    ConfirmDlg,
    ExtraStudies,
  },
  props: {
    Schedules: Array,
    tableHeight: String,
  },
  data() {
    return {
      skipStudyDateTimeStatus: false,
      skipConfirmationEmailStatus: false,
      skipReminderEmailStatus: false,
      e1: 1,
      contactType: "",
      dialog: false,
      editedIndex: -1,
      editedSchedule: {
        FK_Family: 1,
        Family: { NamePrimary: "" },
        Appointments: [
          {
            FK_Family: 1,
            Study: { EmailTemplate: "" },
            Family: { NamePrimary: "" },
            Child: { Name: "" },
          },
        ],
      },
      earliestDate: new Date(),
      latestDate: new Date(),
      studyDate: null,
      studyTime: null,
      emailDialog: false,
      scheduleNextPage: false,
      emailSent: false,
      scheduleUpdated: false,
      response: "Confirmed",
      nextContactDate: "",
      nextContactDialog: false,
      nextContactDialogStepper: false,
      defaultSchedule: {
        FK_Family: 1,
        Family: { NamePrimary: "" },
        Appointments: [
          {
            FK_Family: 1,
            Study: { EmailTemplate: "" },
            Family: { NamePrimary: "" },
            Child: { Name: "" },
          },
        ],
      },
      dialogReminderEmail: false,
      dialogTYEmail: false,
      scheduleButtonText: "Confirm new study appointment",
      emailButtonText: "Send email",
      reminderEmailStatus: false,
      tyEmailStatus: false,
      dialogNote: false,
      Experimenters: [],
      primaryExperimenterList: [],
      datePicker: false,
      validScheduleDateTime: true,
      defaultAppointment: {
        index: null,
        FK_Family: null,
        FK_Child: null,
        FK_Study: null,
        Study: { StudyName: null },
        FK_Schedule: null,
        PrimaryExperimenter: [],
        SecondaryExperimenter: [],
      },
      loadingStatus: false,
    };
  },

  methods: {
    async updateSchedule(item, status) {
      try {
        await login.check_login();
        // console.log("User is already logged in.");

        var comDTitle = "";
        var comDText = "";

        switch (status) {
          case "Reminded":
            comDTitle = "Send a reminder email";
            comDText = "Do you want to send the email?";
            break;

          case "Completed":
            comDTitle = "Study appointment update";
            comDText =
              "You're going to update Study Completion status, continue?";
            break;

          default:
            comDTitle = "Study appointment update";
            comDText =
              "Are you sure you want to mark this appointment as " +
              status +
              "?";
            break;
        }

        this.editedSchedule.skipStudyDateTimeStatus =
          this.skipStudyDateTimeStatus;

        if (await this.$refs.confirmD.open(comDTitle, comDText)) {
          this.$emit("rowSelected", item.Family, this.Schedules.indexOf(item));
          this.response = status;
          switch (status) {
            case "Confirmed":
              this.editedIndex = this.Schedules.indexOf(item);
              this.editedSchedule = Object.assign({}, item);
              this.datePickerRange();
              this.editedSchedule.Appointments[0].Child.Family = {};
              this.editedSchedule.Appointments[0].Child.Family.Email =
                this.editedSchedule.Family.Email;
              this.editedSchedule.Appointments[0].Child.Family.NamePrimary =
                this.editedSchedule.Family.NamePrimary;

              // console.log(this.editedSchedule);
              // console.log(
              //   this.potentialStudies(
              //     this.editedSchedule.Appointments[0].Child,
              //     this.editedSchedule.Appointments[0].FK_Study
              //   )
              // );
              this.dialog = true;
              break;

            case "Completed":
              try {
                item.Completed = !item.Completed;
                await schedule.complete(item);
              } catch (error) {
                console.log(error);
              }

              item.updatedAt = new Date().toISOString();
              break;

            case "Reminded":
              this.editedIndex = this.Schedules.indexOf(item);
              this.editedSchedule = Object.assign({}, item);
              this.editedSchedule.Appointments[0].Child.Family = {};
              this.editedSchedule.Appointments[0].Child.Family.Email =
                this.editedSchedule.Family.Email;
              this.editedSchedule.Appointments[0].Child.Family.NamePrimary =
                this.editedSchedule.Family.NamePrimary;

              this.dialogReminderEmail = true;

              item.updatedAt = new Date().toISOString();
              item.Reminded = true;
              break;

            default:
              item.Status = status;

              // name by combining all study names within a schedule
              var studyNames = item.Appointments.map((appointment) => {
                return (
                  appointment.Study.StudyName +
                  " (" +
                  item.FK_Family +
                  appointment.Child.IdWithinFamily +
                  ")"
                );
              });

              studyNames = Array.from(new Set(studyNames));

              // Calendar event title
              item.summary =
                item.Status.toUpperCase() + " - " + studyNames.join(" + "); // " - " +

              try {
                await schedule.update(item);
                // item.AppointmentTime = null;
                item.updatedAt = new Date().toISOString();

                console.log("Study appointment updated!");

                this.editedSchedule = Object.assign({}, item);

                // next contact
                this.contactType = status;
                this.nextContactDate = this.TodaysDate;
                this.nextContactDialog = true;
              } catch (error) {
                console.log(error);
              }
              break;
          }
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$store.dispatch("setToken", null);
          this.$store.dispatch("setUser", null);
          this.$store.dispatch("setUserID", null);

          alert("Authentication failed, please login.");

          if (this.$route.name != "Login") {
            this.$router.push({
              name: "Login",
            });
          }
        }
      }
    },

    async tyEmail(item) {
      this.editedIndex = this.Schedules.indexOf(item);
      this.editedSchedule = Object.assign({}, item);
      this.editedSchedule.Appointments[0].Child.Family = {};
      this.editedSchedule.Appointments[0].Child.Family.Email =
        this.editedSchedule.Family.Email;
      this.editedSchedule.Appointments[0].Child.Family.NamePrimary =
        this.editedSchedule.Family.NamePrimary;

      item.updatedAt = new Date().toISOString();
      item.ThankYouEmail = true;

      this.dialogTYEmail = true;
    },

    async updateNextContact() {
      try {
        await this.$refs.NextContact.updateNextContact();

        this.nextContactDialog = false;
      } catch (error) {
        console.log(error);
      }
    },

    updateNextContactFrontend(nextContact) {
      this.$emit("nextContactDone", nextContact);
    },

    async reschedule() {
      this.Experimenters = [];

      for (var i = 0; i < this.editedSchedule.Appointments.length; i++) {
        this.$refs.extraStudies[i].selectStudy();
      } // check selectStudy function above to see how appointments and Experimenters are added.

      try {
        if (this.editedIndex > -1) {
          this.editedSchedule.Status = "Confirmed";

          this.editedSchedule.AppointmentTime = this.studyDateTime;

          var studyNames = this.editedSchedule.Appointments.map(
            (appointment) => {
              return (
                appointment.Study.StudyName +
                " (" +
                this.editedSchedule.FK_Family +
                appointment.Child.IdWithinFamily +
                ")"
              );
            }
          );

          studyNames = Array.from(new Set(studyNames));

          this.editedSchedule.summary = studyNames.join(" + ");

          // this.editedSchedule.start = {
          //   dateTime: moment(this.studyDateTime).toISOString(true),
          //   timeZone: "America/Toronto",
          // };
          // this.editedSchedule.end = {
          //   dateTime: moment(this.studyDateTime)
          //     .add(1, "h") // might change if multiple studies are scheduled for one visit
          //     .toISOString(true),
          //   timeZone: "America/Toronto",
          // };

          if (this.skipReminderEmailStatus) {
            this.editedSchedule.Reminded = true;
          }

          this.editedSchedule.description = this.calendarDescription(
            this.editedSchedule
          );

          this.editedSchedule.attendees = this.Experimenters;

          this.editedSchedule.skipStudyDateTimeStatus =
            this.skipStudyDateTimeStatus;

          this.editedSchedule.Reminded = 0;

          const calendarEvent = await schedule.update(this.editedSchedule);

          this.editedSchedule.calendarEventId = calendarEvent.calendarEventId;
          this.editedSchedule.eventURL = calendarEvent.eventURL;
          this.editedSchedule.updatedAt = new Date().toISOString();

          this.editedSchedule.Appointments[0].Schedule = {};
          this.editedSchedule.Appointments[0].Schedule.AppointmentTime =
            this.editedSchedule.AppointmentTime;

          Object.assign(this.Schedules[this.editedIndex], this.editedSchedule);
        }
      } catch (error) {
        console.log(error);
      }
    },

    skipStudyDateTime() {
      this.skipStudyDateTimeStatus = !this.skipStudyDateTimeStatus;

      this.studyDate = moment()
        .startOf("day")
        .tz(this.$store.state.timeZone)
        .format("YYYY-MM-DD");
      this.studyTime = "06:00AM";
    },

    skipConfirmationEmail() {
      this.skipConfirmationEmailStatus = !this.skipConfirmationEmailStatus;
    },

    skipReminderEmail() {
      this.skipReminderEmailStatus = !this.skipReminderEmailStatus;
    },

    async continue12() {
      var validationResults = this.$refs.scheduleDateTime.validate();

      if (validationResults) {
        this.primaryExperimenterList = [];

        for (var i = 0; i < this.editedSchedule.Appointments.length; i++) {
          this.$refs.extraStudies[i].primaryExperimenterStatus();
        }

        if (this.scheduleButtonText == "Study appointment updated!") {
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
                this.loadingStatus = true;
                await this.reschedule();

                this.scheduleUpdated = true;
                this.scheduleNextPage = true;
                this.scheduleButtonText = "Study appointment updated!";
              }
            } catch (error) {
              console.log(error);
              alert("Failed to update the appointment, please try again.");
            }
            this.loadingStatus = false;
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
              this.loadingStatus = true;
              await this.reschedule();

              this.scheduleUpdated = true;
              this.scheduleNextPage = true;
              this.scheduleButtonText = "Study appointment updated!";
            }
          } catch (error) {
            console.log(error);
            alert("Failed to update the appointment, please try again.");
          }

          this.loadingStatus = false;
        }
      } else {
        alert("Schedule date or time is not correct.");
      }
    },

    async continue23() {
      try {
        if (this.emailButtonText == "Email Sent!") {
          if (
            await this.$refs.confirmD.open(
              "Send again?",
              "An email was just sent to this family. Do you want to send it again?"
            )
          ) {
            this.loadingStatus = true;
            await this.$refs.Email.sendEmail();

            this.emailSent = true;
            this.emailButtonText = "Email Sent!";
            this.scheduleNextPage = true;
          }
        } else {
          this.loadingStatus = true;
          await this.$refs.Email.sendEmail();

          this.emailSent = true;
          this.emailButtonText = "Email Sent!";
          this.scheduleNextPage = true;
        }
      } catch (error) {
        console.log(error);
      }

      this.loadingStatus = false;
    },

    async completeSchedule() {
      try {
        await this.$refs.NextContactStepper.updateNextContact();
        // this.$emit("newSchedule");
        this.close();
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
            this.nextContactDialogStepper = true;
          }
          break;

        case 2:
          this.nextContactDialogStepper = true;
          break;
      }

      this.e1 += 1;
      this.scheduleNextPage = false;
    },

    close() {
      this.scheduleButtonText = "Confirm new study appointment";
      this.emailButtonText = "Send email";

      setTimeout(() => {
        this.studyDate = null;
        this.studyTime = null;
        this.e1 = 1;
        this.emailDialog = false;
        this.nextContactDialogStepper = false;
        this.emailSent = false;
        this.scheduleNextPage = false;
        this.scheduleUpdated = false;
        this.dialog = false;
        this.skipStudyDateTimeStatus = false;
        this.skipConfirmationEmailStatus = false;
        this.skipReminderEmailStatus = false;
        this.Experimenters = [];
        this.primaryExperimenterList = [];
        if (this.$refs.scheduleDateTime) {
          this.$refs.scheduleDateTime.resetValidation();
        }
      }, 1000);
    },

    rowSelected(item, row) {
      row.select(true);
      row.expand(!row.isExpanded);
      this.$emit("rowSelected", item.Family, this.Schedules.indexOf(item));
    },

    selectStudy(extraAppointments) {
      Object.assign(
        this.editedSchedule.Appointments[extraAppointments.index],
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
      this.editedSchedule.Appointments.splice(index, 1);
    },

    receiveSelectedStudy(selectedStudy) {
      this.editedSchedule.Appointments[selectedStudy.index].FK_Study =
        selectedStudy.studyId;
      this.editedSchedule.Appointments[selectedStudy.index].FK_Child =
        selectedStudy.childId;
    },

    newAppointment(child) {
      var newAppointment = Object.assign({}, this.defaultAppointment);

      newAppointment.FK_Child = child.id;
      newAppointment.Child = child;
      newAppointment.FK_Family = child.FK_Family;
      newAppointment.Study = {
        id: 0,
        StudyName: " ",
        Experimenters: [],
      };

      newAppointment.index = this.editedSchedule.Appointments.length;

      this.editedSchedule.Appointments.push(newAppointment);
    },

    checkPrimaryExperimenter(primaryExperimenterStatus) {
      this.primaryExperimenterList.push(primaryExperimenterStatus);
    },

    potentialStudies(child, currentStudy) {
      var ElegibleStudies = [];

      this.$store.state.studies.forEach((study) => {
        if (this.studyElegibility(study, child)) {
          ElegibleStudies.push(study.id);
        }
      });

      var uniquePreviousStudies = [];

      if (child.Appointments) {
        child.Appointments.forEach((appointment) => {
          uniquePreviousStudies.push(appointment.FK_Study);
        });
        uniquePreviousStudies = Array.from(new Set(uniquePreviousStudies));

        if (currentStudy) {
          const index = uniquePreviousStudies.indexOf(currentStudy);

          uniquePreviousStudies.splice(index, 1);
        }
      }

      var potentialStudies = ElegibleStudies.filter(
        (study) => !uniquePreviousStudies.includes(study)
      );

      // check the selected studies.
      var currentSelectedStudies = [];
      if (this.editedSchedule.Appointments.length > 0) {
        for (var i = 0; i < this.editedSchedule.Appointments.length; i++) {
          if (this.editedSchedule.Appointments[i].FK_Child == child.id) {
            currentSelectedStudies.push(
              this.editedSchedule.Appointments[i].FK_Study
            );
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

    datePickerRange() {
      if (this.editedSchedule.Appointments) {
        var minAges = this.editedSchedule.Appointments.map((appointment) => {
          return moment(appointment.Child.DoB).add(
            Math.floor(appointment.Study.MinAge * 30.5),
            "days"
          );
        });

        minAges.push(moment());

        var MinAge = moment.max(minAges);

        this.earliestDate = MinAge.toISOString(true);

        var maxAges = this.editedSchedule.Appointments.map((appointment) => {
          return moment(appointment.Child.DoB).add(
            Math.floor(appointment.Study.MaxAge * 30.5),
            "days"
          );
        });

        var MaxAge = moment.min(maxAges);

        this.latestDate = MaxAge.toISOString(true);
      }
    },

    remindIconEnable(item) {
      var iconDisable = true;
      var daysAheadofSchedule = 1;

      if (moment(item.AppointmentTime).day() <= 1) {
        daysAheadofSchedule = 3;
      }

      switch (item.Status) {
        case "Confirmed":
          if (
            moment(item.AppointmentTime).startOf("day") <=
              moment().startOf("day").add(daysAheadofSchedule, "d") &&
            moment(item.AppointmentTime).startOf("day") >=
              moment().startOf("day")
          ) {
            iconDisable = false;
          }

          break;
      }

      return iconDisable;
    },

    completeIconEnable(item) {
      var iconDisable = true;

      switch (item.Status) {
        case "Confirmed":
          if (new Date(item.AppointmentTime) <= new Date()) {
            iconDisable = false;
          }

          break;
      }

      return iconDisable;
    },

    tyEmailEnable(item) {
      var iconDisable = true;

      switch (item.Status) {
        case "Confirmed":
          if (new Date(item.AppointmentTime) <= new Date()) {
            iconDisable = false;
          }

          break;
      }

      return iconDisable;
    },

    async sendReminderEmail() {
      try {
        if (this.emailButtonText == "Email Sent!") {
          if (
            await this.$refs.confirmD.open(
              "Send again?",
              "An email was just sent to this family. Do you want to send it again?"
            )
          ) {
            await this.$refs.Email.sendEmail();

            this.emailButtonText = "Email Sent!";

            this.reminderEmailStatus = true;

            await schedule.remind(this.editedSchedule);
          }
        } else {
          await this.$refs.Email.sendEmail();

          this.emailButtonText = "Email Sent!";

          this.reminderEmailStatus = true;

          await schedule.remind(this.editedSchedule);
        }
      } catch (error) {
        console.log(error);
      }
    },

    async sendTYEmail() {
      try {
        if (this.emailButtonText == "Email Sent!") {
          if (
            await this.$refs.confirmD.open(
              "Send again?",
              "A 'thank you' email was just sent to this family. Do you want to send it again?"
            )
          ) {
            await this.$refs.Email.sendEmail();

            this.emailButtonText = "Email Sent!";

            this.tyEmailStatus = true;

            const updatedSchedule = {
              id: this.editedSchedule.id,
              ThankYouEmail: true,
            };

            await schedule.tyEmail(updatedSchedule);
          }
        } else {
          await this.$refs.Email.sendEmail();

          this.emailButtonText = "Email Sent!";

          this.tyEmailStatus = true;

          const updatedSchedule = {
            id: this.editedSchedule.id,
            ThankYouEmail: true,
          };

          await schedule.tyEmail(updatedSchedule);
        }

        this.closeTYEmail();
      } catch (error) {
        console.log(error);
      }
    },

    async closeReminderEmail() {
      if (this.skipReminderEmailStatus) {
        await schedule.remind(this.editedSchedule);
      }

      this.emailButtonText = "Send email";
      setTimeout(() => {
        this.dialogReminderEmail = false;
        this.skipReminderEmailStatus = false;
        this.reminderEmailStatus = false;
      }, 1000);
    },

    closeTYEmail() {
      this.emailButtonText = "Send email";
      setTimeout(() => {
        this.dialogTYEmail = false;
        this.tyEmailStatus = false;
      }, 1000);
    },

    getColor(status, completed) {
      var color = "";
      switch (status) {
        case "Completed":
          color = "#01579B";
          break;
        case "Confirmed":
          if (completed) {
            color = "#01579B";
          } else {
            color = "light-blue accent-2";
          }
          break;
        case "TBD":
          color = "teal darken-2";
          break;
        case "Rescheduling":
          color = "lime darken-3";
          break;
        case "No Show":
          color = "orange darken-3";
          break;
        case "Cancelled":
          color = "deep-orange darken-1";
          break;
        case "Rejected":
          color = "blue-grey darken-4";
          break;
      }

      return color;
    },

    showScheduleNote(item) {
      this.editedSchedule = Object.assign({}, item);
      this.editedIndex = this.Schedules.indexOf(item);
      this.dialogNote = true;
    },

    closeScheduleNotes() {
      this.dialogNote = false;
      // setTimeout(() => {

      // }, 300);
    },

    datePick() {
      this.datePicker = false;
      setTimeout(() => {
        this.$refs.studyDate.focus();
      }, 100);
    },

    async saveScheduleNotes() {
      var updatedSchedule = {
        id: this.editedSchedule.id,
        Note: this.editedSchedule.Note,
        calendarEventId: this.editedSchedule.calendarEventId,
        description: this.calendarDescription(this.editedSchedule),
      };

      try {
        await schedule.update(updatedSchedule);

        Object.assign(this.Schedules[this.editedIndex], this.editedSchedule);

        this.closeScheduleNotes();
      } catch (error) {
        console.log(error);
      }
    },

    calendarDescription(schedule) {
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
      if (this.editedSchedule.Family.Children) {
        var elegibleStudies = this.editedSchedule.Family.Children.map(
          (child) => {
            let studyIds = [];
            this.$store.state.studies.forEach((study) => {
              if (!study.Completed) {
                if (this.studyElegibility(study, child)) {
                  studyIds.push(study.id);
                }
              }
            });
            return studyIds;
          }
        );

        return elegibleStudies;
      } else {
        return [];
      }
    },

    UniquePreviousStudies() {
      return this.editedSchedule.Family.Children.map((child) => {
        let studyIds = [];
        child.Appointments.forEach((appointment) => {
          studyIds.push(appointment.FK_Study);
        });

        return studyIds;
      });
    },

    PotentialStudies() {
      // this is different from the functions in Schedule or ChildInfo

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
    TodaysDate() {
      return moment().startOf("day").tz(this.$store.state.timeZone).format("YYYY-MM-DD");
    },
    reminderEmailDisable() {
      return false;
    },
  },
  watch: {
    dialog(val) {
      val || this.close();
    },
    dialogReminderEmail(val) {
      val || this.closeReminderEmail();
    },
    dialogTYEmail(val) {
      val || this.closeTYEmail();
    },
    dialogNote(val) {
      val || this.closeScheduleNotes();
    },
  },
};
</script>

<style lang="css" scoped>
.theme--light.v-icon {
  color: var(--v-primary-base);
  font-size: 28px;
  padding-left: 2px;
  padding-right: 2px;
}

/* .theme--light.v-data-table /deep/ thead /deep/ tr th:hover {
  color: var(--v-secondary-base) !important;
} */

/* .v-data-table
  /deep/
  tbody
  /deep/
  tr:hover:not(.v-data-table__expanded__content) {
  border-bottom-width: 2px !important;
  background-color: var(--v-secondary-lighten1) !important;
} */

/deep/ tr.v-data-table__selected {
  /* color: var(--v-secondary-lighten1) !important; */
  /* margin: 2px !important;
  border-style: double   !important; */
  background-color: var(--v-secondary-lighten1) !important;
}
</style>
