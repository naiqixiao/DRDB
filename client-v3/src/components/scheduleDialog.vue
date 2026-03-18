<template>
  <v-dialog persistent :model-value="dialog" @update:model-value="onDialogClose" transition="dialog-bottom-transition" max-width="1200px" content-class="schedule-dialog-overlay">
    <v-card class="ds-card pb-2" variant="flat">
      <v-stepper v-model="stepperPage" elevation="0">
        <v-stepper-header>
          <v-stepper-item title="Schedule a visit" value="1" editable :complete="stepperPage > 1"></v-stepper-item>
          <v-divider></v-divider>
          <v-stepper-item title="Email" value="2" :editable="step2Editable" :complete="stepperPage > 2"></v-stepper-item>
          <v-divider></v-divider>
          <v-stepper-item title="Next Contact" value="3" :editable="step3Editable" :complete="stepperPage > 3"></v-stepper-item>
        </v-stepper-header>

        <v-stepper-window>
          <!-- Step 1, choose appointment time, studies, experimenters, and leave a note. -->
          <v-stepper-window-item value="1">
            <v-card elevation="0">
              <v-card-title class="d-flex justify-space-between align-center">
                Create / Update Study Schedule
                <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
              </v-card-title>

              <v-container class="pa-0">
                <v-card-text class="pa-2">
                  <!-- Section 1: Schedule Date & Time (collapsible) -->
                  <div class="section-header" @click="section1Open = !section1Open">
                    <v-icon size="18" class="mr-2" color="primary">mdi-clock-outline</v-icon>
                    <span class="text-caption font-weight-bold text-uppercase">Study Date & Time</span>
                    <v-chip v-if="!section1Open && $refs.dateTimePickerComp?.studyDateTimeValue" size="small" variant="tonal" color="primary" class="ml-3">
                      {{ $refs.dateTimePickerComp.studyDateTimeValue }}
                    </v-chip>
                    <v-spacer></v-spacer>
                    <v-icon size="18">{{ section1Open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  </div>
                  <v-expand-transition>
                    <div v-show="section1Open" class="section-body">
                      <dateTimePicker 
                        ref="dateTimePickerComp" 
                        :dateTimePickerDisable="dateTimePickerDisable"
                        :appointmentTime="currentSchedule?.AppointmentTime"
                        @readyToCreateSchedule="readyToCreateSchedule" 
                      />
                    </div>
                  </v-expand-transition>

                  <v-divider class="my-1"></v-divider>

                  <!-- Section 2: Appointment Details (collapsible) -->
                  <div class="section-header" @click="section2Open = !section2Open">
                    <v-icon size="18" class="mr-2" color="primary">mdi-clipboard-list-outline</v-icon>
                    <span class="text-caption font-weight-bold text-uppercase">Appointment Details</span>
                    <v-spacer></v-spacer>
                    <v-icon size="18">{{ section2Open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  </div>
                  <v-expand-transition>
                    <div v-show="section2Open" class="section-body">
                      <appointmentDetails 
                        ref="appointmentDetailsRef" 
                        :Appointments="currentSchedule?.Appointments"
                        :Children="currentFamily?.Children" 
                        :scheduleType="scheduleType"
                        :parentResponse="parentResponse"
                        :showAdditionalAppointments="scheduleEnable && hasRecruitableChildrenFlag"
                        @dateTimePickerDisableUpdate="dateTimePickerDisableUpdate"
                        @newAppointment="addAppointment" 
                        @deleteCurrentAppointment="deleteCurrentAppointment"
                        @readyToCreateSchedule="readyToCreateSchedule"
                        @hasRecruitableChildren="hasRecruitableChildrenFlag = $event"
                      />
                    </div>
                  </v-expand-transition>

                  <v-divider class="my-1"></v-divider>

                  <!-- Section 3: Notes (collapsible) -->
                  <div class="section-header" @click="section3Open = !section3Open">
                    <v-icon size="18" class="mr-2" color="primary">mdi-note-text-outline</v-icon>
                    <span class="text-caption font-weight-bold text-uppercase">Notes</span>
                    <v-chip v-if="!section3Open && Note" size="x-small" variant="tonal" color="grey" class="ml-2">has note</v-chip>
                    <v-spacer></v-spacer>
                    <v-icon size="18">{{ section3Open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  </div>
                  <v-expand-transition>
                    <div v-show="section3Open" class="section-body">
                      <v-textarea 
                        variant="outlined" 
                        class="conv-textarea" 
                        label="" 
                        no-resize 
                        rows="2"
                        hide-details 
                        v-model="Note"
                        placeholder="Add notes for this schedule..."
                        density="compact"
                      ></v-textarea>
                    </div>
                  </v-expand-transition>
                </v-card-text>
              </v-container>

              <!-- action buttons -->
              <v-card-actions class="px-4 py-2 d-flex align-center">
                <!-- Compact action log -->
                <div v-if="actionLogs.length" style="flex: 1; display: flex; flex-direction: column; gap: 2px; overflow: hidden; min-width: 0; margin-right: 16px">
                  <div v-for="(entry, i) in actionLogs" :key="i" style="display: flex; align-items: center; gap: 6px; min-width: 0">
                    <v-icon :color="entry.success ? 'success' : 'error'" size="14">{{ entry.success ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline' }}</v-icon>
                    <span style="font-size: 0.7rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; color: #555">{{ entry.action }}</span>
                    <span style="font-size: 0.65rem; white-space: nowrap; color: #999">{{ entry.time }}</span>
                    <v-chip size="x-small" :color="entry.success ? 'success' : 'error'" variant="flat" label style="min-width: 36px; justify-content: center">{{ entry.success ? 'OK' : 'FAIL' }}</v-chip>
                  </div>
                </div>
                <v-spacer></v-spacer>
                <div class="d-flex align-center" style="gap: 12px; flex-shrink: 0">
                  <v-btn 
                    variant="tonal"
                    color="primary"
                    @click="createSchedule" 
                    :disabled="!scheduleEnable"
                    :loading="loadingStatus"
                  >
                    <v-icon start v-show="scheduleButtonIconShow">mdi-checkbox-marked-circle-outline</v-icon>
                    {{ scheduleButtonText }}
                  </v-btn>
                  <v-btn variant="elevated" color="primary" @click="step12" :disabled="disableStep12">Next</v-btn>
                </div>
              </v-card-actions>
            </v-card>
          </v-stepper-window-item>

          <!-- Step 2 -->
          <v-stepper-window-item value="2">
            <v-card elevation="0">
              <!-- Header toolbar -->
              <div class="d-flex align-center px-4 pt-3 pb-1" style="gap: 12px;">
                <v-icon size="20" color="primary">mdi-email-edit-outline</v-icon>
                <span class="text-subtitle-2 font-weight-bold" style="color: rgb(var(--v-theme-primary))">Compose Email</span>
                <v-spacer></v-spacer>
                <v-select 
                  v-show="emailSelectionShow" 
                  hide-details 
                  variant="outlined" 
                  density="compact" 
                  :items="emailOptions" 
                  v-model="emailType"
                  label="Email template"
                  @update:model-value="emailTypeChange($event)"
                  style="max-width: 280px;"
                ></v-select>
                <v-btn icon="mdi-close" variant="text" size="small" @click="close"></v-btn>
              </div>

              <!-- Email component -->
              <v-card-text class="pt-2 pb-2">
                <emailComponent 
                  ref="emailComponentRef" 
                  :dialog="emailDialog" 
                  :emailType="emailType"
                  :appointments="emailAppointments" 
                  :appointmentTime="studyDateTime"
                  :familyInfo="currentFamily"
                />
              </v-card-text>

              <!-- Action bar -->
              <v-card-actions class="px-4 py-2 d-flex align-center">
                <!-- Compact action log -->
                <div v-if="actionLogs.length" style="flex: 1; display: flex; flex-direction: column; gap: 2px; overflow: hidden; min-width: 0; margin-right: 16px">
                  <div v-for="(entry, i) in actionLogs" :key="i" style="display: flex; align-items: center; gap: 6px; min-width: 0">
                    <v-icon :color="entry.success ? 'success' : 'error'" size="14">{{ entry.success ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline' }}</v-icon>
                    <span style="font-size: 0.7rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; color: #555">{{ entry.action }}</span>
                    <span style="font-size: 0.65rem; white-space: nowrap; color: #999">{{ entry.time }}</span>
                    <v-chip size="x-small" :color="entry.success ? 'success' : 'error'" variant="flat" label style="min-width: 36px; justify-content: center">{{ entry.success ? 'OK' : 'FAIL' }}</v-chip>
                  </div>
                </div>
                <v-spacer></v-spacer>
                <div class="d-flex align-center flex-wrap" style="gap: 12px; flex-shrink: 0">
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }">
                      <div v-bind="props">
                        <v-checkbox 
                          label="Skip Email" 
                          class="ma-0 pa-0"
                          :model-value="skipConfirmationEmailStatus" 
                          @update:model-value="skipConfirmationEmail"
                          density="compact"
                          hide-details
                        ></v-checkbox>
                      </div>
                    </template>
                    <span>Check this box to skip emailing to parents.</span>
                  </v-tooltip>
                  <v-btn 
                    variant="tonal"
                    color="primary"
                    @click="sendEmail" 
                    :loading="loadingStatus"
                    prepend-icon="mdi-send"
                  >
                    <v-icon start v-show="emailButtonIconShow">mdi-checkbox-marked-circle-outline</v-icon>
                    {{ emailButtonText }}
                  </v-btn>
                  <v-btn variant="elevated" color="primary" @click="step23" :disabled="disableStep23 && !skipConfirmationEmailStatus">
                    {{ step23ButtonText }}
                  </v-btn>
                </div>
              </v-card-actions>
            </v-card>
          </v-stepper-window-item>

          <!-- Step 3 -->
          <v-stepper-window-item value="3">
            <v-card elevation="0">
              <!-- Header toolbar (matches Step 2 pattern) -->
              <div class="d-flex align-center px-4 pt-3 pb-1" style="gap: 12px;">
                <v-icon size="20" color="primary">mdi-calendar-clock-outline</v-icon>
                <span class="text-subtitle-2 font-weight-bold" style="color: rgb(var(--v-theme-primary))">Next Contact</span>
                <v-chip v-if="contactDate" size="small" variant="tonal" color="primary" class="ml-1">
                  {{ contactDate }}
                </v-chip>
                <v-spacer></v-spacer>
                <v-btn icon="mdi-close" variant="text" size="small" @click="close"></v-btn>
              </div>

              <v-container class="pa-0">
                <v-card-text class="pa-2">
                  <!-- Instructional hint -->
                  <div class="text-caption text-muted px-1 mb-2" style="line-height: 1.4">
                    Set up the next contact date. This family can be contacted after this date.
                  </div>

                  <!-- Section 1: Contact Date (collapsible) -->
                  <div class="section-header" @click="step3Section1Open = !step3Section1Open">
                    <v-icon size="18" class="mr-2" color="primary">mdi-calendar-edit</v-icon>
                    <span class="text-caption font-weight-bold text-uppercase">Contact Date</span>
                    <v-chip v-if="!step3Section1Open && contactDate" size="small" variant="tonal" color="primary" class="ml-3">
                      {{ contactDate }}
                    </v-chip>
                    <v-chip v-if="!step3Section1Open && daysLate" size="x-small" variant="tonal" color="grey" class="ml-2">
                      {{ daysLate }}
                    </v-chip>
                    <v-spacer></v-spacer>
                    <v-icon size="18">{{ step3Section1Open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  </div>
                  <v-expand-transition>
                    <div v-show="step3Section1Open" class="section-body">
                      <div class="d-flex flex-wrap align-center" style="gap: 16px">
                        <v-text-field 
                          variant="outlined" 
                          density="compact" 
                          ref="contactDateRef" 
                          label="Date (YYYY-MM-DD)"
                          style="max-width: 250px" 
                          v-model="contactDate" 
                          :rules="$rules.dob" 
                          hide-details
                          prepend-inner-icon="mdi-calendar" 
                          @click:prepend-inner="datePicker = true"
                          @click="datePicker = true"
                        ></v-text-field>
                        <v-chip v-if="daysLate" variant="tonal" color="primary" size="small">
                          <v-icon start size="16">mdi-clock-outline</v-icon>
                          {{ daysLate }}
                        </v-chip>
                      </div>
                    </div>
                  </v-expand-transition>

                  <v-divider class="my-1"></v-divider>

                  <!-- Section 2: Note (collapsible) -->
                  <div class="section-header" @click="step3Section2Open = !step3Section2Open">
                    <v-icon size="18" class="mr-2" color="primary">mdi-note-text-outline</v-icon>
                    <span class="text-caption font-weight-bold text-uppercase">Note for Future Contact</span>
                    <v-chip v-if="!step3Section2Open && nextContactNote" size="x-small" variant="tonal" color="grey" class="ml-2">has note</v-chip>
                    <v-spacer></v-spacer>
                    <v-icon size="18">{{ step3Section2Open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  </div>
                  <v-expand-transition>
                    <div v-show="step3Section2Open" class="section-body">
                      <v-textarea 
                        variant="outlined" 
                        class="conv-textarea" 
                        label="" 
                        no-resize 
                        rows="3"
                        hide-details 
                        v-model="nextContactNote"
                        placeholder="Add notes for the next contact..."
                        density="compact"
                      ></v-textarea>
                    </div>
                  </v-expand-transition>
                </v-card-text>
              </v-container>

              <!-- Action bar (same pattern as Steps 1 & 2) -->
              <v-card-actions class="px-4 py-2 d-flex align-center">
                <!-- Compact action log -->
                <div v-if="actionLogs.length" style="flex: 1; display: flex; flex-direction: column; gap: 2px; overflow: hidden; min-width: 0; margin-right: 16px">
                  <div v-for="(entry, i) in actionLogs" :key="i" style="display: flex; align-items: center; gap: 6px; min-width: 0">
                    <v-icon :color="entry.success ? 'success' : 'error'" size="14">{{ entry.success ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline' }}</v-icon>
                    <span style="font-size: 0.7rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; color: #555">{{ entry.action }}</span>
                    <span style="font-size: 0.65rem; white-space: nowrap; color: #999">{{ entry.time }}</span>
                    <v-chip size="x-small" :color="entry.success ? 'success' : 'error'" variant="flat" label style="min-width: 36px; justify-content: center">{{ entry.success ? 'OK' : 'FAIL' }}</v-chip>
                  </div>
                </div>
                <v-spacer></v-spacer>
                <div class="d-flex align-center" style="gap: 12px; flex-shrink: 0">
                  <v-btn variant="elevated" color="primary" @click="finalizeSchedule">Complete</v-btn>
                </div>
              </v-card-actions>
            </v-card>
          </v-stepper-window-item>
        </v-stepper-window>

      </v-stepper>

      <v-dialog v-model="datePicker" max-width="360px">
        <v-card variant="outlined">
          <v-date-picker 
            v-model="contactDateObj" 
            show-current 
            @update:model-value="datePick"
          ></v-date-picker>
        </v-card>
      </v-dialog>

      <!-- Cancel Confirmation -->
      <v-dialog v-model="confirmCancelDialog" max-width="400px" persistent>
        <v-card>
          <v-card-title class="text-h6">Cancel schedule?</v-card-title>
          <v-card-text>
            You have created a schedule but haven't finished the rest of the steps. Do you want to delete the created schedule and Google Calendar event(s)?
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" variant="text" @click="confirmCancelDialog = false">No, continue steps</v-btn>
            <v-btn color="error" variant="text" @click="cancelSchedule">Yes, cancel & delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Update Confirmation -->
      <v-dialog v-model="confirmUpdateDialog" max-width="400px" persistent>
        <v-card>
          <v-card-title class="text-h6">Update existing schedule?</v-card-title>
          <v-card-text>
            You have already created a schedule. Do you want to update it with the new time and information? This will update the existing Google Calendar event(s).
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" variant="text" @click="confirmUpdateDialog = false">Cancel</v-btn>
            <v-btn color="primary" variant="text" @click="proceedUpdateSchedule">Yes, update</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </v-card>
  </v-dialog>
</template>

<script>
import dateTimePicker from '@/components/dateTimePicker.vue';
import appointmentDetails from '@/components/appointmentDetails.vue';
import emailComponent from '@/components/emailComponent.vue';
import moment from "moment";

import family from "@/services/family";
import schedule from "@/services/schedule";
import calendar from "@/services/calendar";
import appointment from "@/services/appointment";

import { useMainStore } from "@/stores/mainStore";

export default {
  setup() {
    const store = useMainStore();
    return { store };
  },
  name: "scheduleDialog",
  components: {
    dateTimePicker,
    appointmentDetails,
    emailComponent,
  },
  props: {
    dialog: Boolean,
    currentSchedule: Object,
    currentFamily: Object,
    scheduleType: String,
    parentResponse: String,
    dialogType: String,
  },
  emits: ["close-dialog", "newAppointment", "deleteCurrentAppointment", "newSchedule", "updatedSchedule", "completedSchedule"],
  data: () => ({
    studyDateTime: null,
    dateTimePickerDisable: true,
    stepperPage: "1",
    contactDate: null,
    contactDateObj: null,
    datePicker: false,
    scheduleEnable: false,
    Note: "",
    nextContactNote: "",
    emailDialog: false,
    emailAppointments: [],
    disableStep12: true,
    disableStep23: true,
    skipEmail: false,
    emailSelectionShow: false,
    emailUpdate: false,
    emailBody: "",
    emailSubject: "",
    skipConfirmationEmailStatus: false,
    emailType: "",
    emailOptions: ['Confirmation', 'ScheduleUpdate', 'Reminder', 'Follow-up', 'ThankYou'],
    contactType: "",
    loadingStatus: false,
    scheduleButtonIconShow: false,
    scheduleButtonText: "Create appointment",
    emailButtonIconShow: false,
    emailButtonText: "Send email",
    step23ButtonText: "Next",
    createdScheduleInSession: null,
    isFinalized: false,
    confirmCancelDialog: false,
    confirmUpdateDialog: false,
    actionLogs: [],
    section1Open: true,
    section2Open: true,
    section3Open: false,
    hasRecruitableChildrenFlag: false,
    step3Section1Open: true,
    step3Section2Open: true,
  }),
  methods: {
    addLog(action, success, message) {
      this.actionLogs.unshift({
        action,
        success,
        message,
        time: new Date().toLocaleTimeString(),
      });
    },

    deleteCurrentAppointment(index) {
      this.$emit("deleteCurrentAppointment", index);
    },
    dateTimePickerDisableUpdate(val) {
      this.dateTimePickerDisable = val;
    },
    datePick(val) {
      if (val) {
        this.contactDate = moment(val).format("YYYY-MM-DD");
      }
      this.datePicker = false;
    },
    addAppointment(app) { 
      this.$emit("newAppointment", app);
    },
    readyToCreateSchedule() {
      if (this.$refs.appointmentDetailsRef?.appointmentDetailReady && this.$refs.dateTimePickerComp?.studyDateTimeReady) {
        this.scheduleEnable = true;
        if (this.createdScheduleInSession) {
          this.scheduleButtonText = "Update Schedule Event";
        } else {
          this.scheduleButtonText = (this.scheduleType === 'create') ? "Create Schedule" : "Update Schedule";
        }
      } else {
        this.scheduleEnable = false;
        if (this.createdScheduleInSession) {
          this.scheduleButtonText = "Update Schedule Event";
        } else {
          this.scheduleButtonText = (this.scheduleType === 'create') ? "Create Schedule" : "Update Schedule";
        }
      }
    },

    async createSchedule() {
      if (this.createdScheduleInSession) {
        this.confirmUpdateDialog = true;
        return;
      }

      this.loadingStatus = true;
      try {
        const newAppointments = this.$refs.appointmentDetailsRef.generateAppointments();
        this.studyDateTime = this.$refs.dateTimePickerComp.studyDateTime();

        let newSchedule = {};
        let updatedSchedule = {};

        if (newAppointments.newAppointments.length > 0) {
          try {
            newSchedule = await this.newSchedule(newAppointments.newAppointments);
            this.createdScheduleInSession = newSchedule;
            this.scheduleButtonText = "Update Schedule Event";
            this.addLog("Create Calendar Event", true, "Successfully created calendar event.");
            this.$emit("newSchedule", newSchedule);
          } catch (error) {
            console.error(error);
            this.addLog("Create Calendar Event", false, "Failed to create calendar event.");
          }
        }

        if (newAppointments.updatedAppointments.length > 0) {
          try {
            // Normal update path (parent schedule update)
            updatedSchedule = await this.updateSchedule(newAppointments.updatedAppointments, this.currentSchedule);
            this.scheduleButtonText = "Appointment updated!";
            this.addLog("Update Calendar Event", true, "Successfully updated calendar event.");
            this.$emit("updatedSchedule", updatedSchedule);
          } catch (error) {
            console.error(error);
            this.addLog("Update Calendar Event", false, "Failed to update calendar event.");
          }
        }

        if (newAppointments.completedAppointments.length > 0) {
          await schedule.complete({
            id: newAppointments.completedAppointments[0].FK_Schedule,
            FK_Family: newAppointments.completedAppointments[0].FK_Family,
            Completed: 1
          });
          this.$emit("completedSchedule", {
            id: newAppointments.completedAppointments[0].FK_Schedule,
            FK_Family: newAppointments.completedAppointments[0].FK_Family,
            Completed: 1
          });
        }

        if (newAppointments.deletedAppointments.length > 0) {
          for (const app of newAppointments.deletedAppointments) {
            await appointment.delete({ id: app });
          }
        }

        this.scheduleButtonIconShow = true;

        const statusArray = ['Confirmed', 'Left a message', 'Interested', 'Update appointment time', 'Reschedule (need to follow-up)', 'No Show', 'Cancelled'];
        this.emailAppointments = newAppointments.newAppointments.concat(newAppointments.updatedAppointments).filter(app => {
          return statusArray.includes(app.status);
        });

        if (this.emailAppointments.length === 0) {
          this.skipEmail = true;
        }

        if (newAppointments.completedAppointments.length > 0) {
          this.contactType = "Completed";
        }

        if (newAppointments.newAppointments.length > 0) {
          switch (newSchedule.Status) {
            case 'Confirmed':
              this.contactType = "nextStudy";
              break;
            case "TBD":
              this.contactType = "followUP";
              break;
            case 'Rejected':
              this.contactType = "rejectAndFutureStudy";
              break;
          }
        }

        if (newAppointments.updatedAppointments.length > 0) {
          switch (updatedSchedule.Status) {
            case 'Confirmed':
              this.contactType = "nextStudy";
              break;
            case "Rescheduling":
              this.contactType = "followUP";
              break;
            case 'Cancelled':
              this.contactType = "followUpforCancelledAppointment";
              break;
            case 'No Show':
              this.contactType = "followUpforNoShow";
              break;
            case 'Rejected':
              this.contactType = "rejectAndFutureStudy";
              break;
          }
        }

        this.disableStep12 = false;
      } finally {
        this.loadingStatus = false;
      }
    },

    async proceedUpdateSchedule() {
      this.confirmUpdateDialog = false;
      this.loadingStatus = true;
      try {
        const newAppointments = this.$refs.appointmentDetailsRef.generateAppointments();
        this.studyDateTime = this.$refs.dateTimePickerComp.studyDateTime();

        if (newAppointments.newAppointments.length > 0) {
          // Map created schedule IDs to the new appointments so it executes as an update
          const updatedAppointmentsList = newAppointments.newAppointments.map((app, index) => {
            if (this.createdScheduleInSession.Appointments && this.createdScheduleInSession.Appointments[index]) {
              app.id = this.createdScheduleInSession.Appointments[index].id;
              app.calendarEventId = this.createdScheduleInSession.Appointments[index].calendarEventId;
              app.eventURL = this.createdScheduleInSession.Appointments[index].eventURL;
            }
            app.FK_Schedule = this.createdScheduleInSession.id;
            return app;
          });
          
          try {
            // Use createdScheduleInSession as the target schedule for the update
            const updatedSchedule = await this.updateSchedule(updatedAppointmentsList, this.createdScheduleInSession);
            this.createdScheduleInSession = updatedSchedule;
            this.addLog("Update Calendar Event", true, "Successfully updated calendar event.");
            this.$emit("updatedSchedule", updatedSchedule);
          } catch (error) {
            console.error(error);
            this.addLog("Update Calendar Event", false, "Failed to update calendar event.");
          }
        }

        this.scheduleButtonIconShow = true;
      } finally {
        this.loadingStatus = false;
      }
    },

    async newSchedule(newAppointments) {
      let statusValues = [...new Set(newAppointments.map(appointment => appointment.status))];
      let status = "";

      switch (statusValues[0]) {
        case 'Update appointment time':
          status = 'Confirmed';
          break;
        case "Left a message":
        case "Interested":
          status = "TBD";
          break;
        case 'Reschedule (need to follow-up)':
          status = 'Rescheduling';
          break;
        default:
          status = statusValues[0];
          break;
      }

      let newSchedule = {
        AppointmentTime: this.studyDateTime,
        Status: status,
        FK_Family: this.currentSchedule.FK_Family,
        Note: this.Note,
        summary: status.toUpperCase() + " - " + this.calendarSummary(newAppointments),
        Appointments: newAppointments,
        ScheduledBy: this.store.userID,
        location: this.store.location,
        description: this.calendarDescription(newAppointments, this.Note),
        Reminded: 0
      };

      let calendarEvents = [];
      newSchedule.Appointments.forEach((app) => {
        const testingRoom = this.store.testingRooms.find(room => room.id === app.Study.FK_TestingRoom);
        let calendarId = testingRoom ? testingRoom.calendarId : 'primary';
        app.calendarId = calendarId;

        calendarEvents.push({
          calendarId: app.calendarId,
          AppointmentTime: newSchedule.AppointmentTime,
          description: newSchedule.description,
          summary: newSchedule.summary,
          location: newSchedule.location,
          attendees: app.attendees,
          eventId: app.calendarEventId || newSchedule.calendarEventId || null,
          eventURL: app.eventURL || newSchedule.eventURL || null,
        });
      });

      for (const event of calendarEvents) {
        if (event.eventId) {
          try {
            await calendar.update(event);
            this.addLog("Update Google Calendar Event", true, `Updated event: ${event.summary}`);
          } catch (error) {
            console.error(error);
            this.addLog("Update Google Calendar Event", false, `Failed to update event: ${error.message}`);
          }
        } else {
          if (newSchedule.Status === 'Confirmed') {
            try {
              const createdEvent = await calendar.create(event);
              event.eventURL = createdEvent.data.eventURL;
              event.eventId = createdEvent.data.eventId;
              this.addLog("Create Google Calendar Event", true, `Created event: ${event.summary}`);
            } catch (error) {
              console.error(error);
              this.addLog("Create Google Calendar Event", false, `Failed to create event: ${error.message}`);
            }
          }
        }
      }

      newSchedule.Appointments.forEach((app, index) => {
        app.calendarEventId = calendarEvents[index].eventId;
        app.eventURL = calendarEvents[index].eventURL;

        app.Experimenters = app.PrimaryExperimenter.map(exp => exp.id);
        app.Experimenters_2nd = app.SecondaryExperimenter.map(exp => exp.id);
      });

      const createdScheduleData = await this.createScheduleBackend(newSchedule);

      // Merge backend-assigned IDs back into the rich appointment objects
      // (createScheduleBackend returns only bare DB columns; newSchedule has Study/Child/Experimenters)
      newSchedule.id = createdScheduleData.id;
      newSchedule.createdAt = createdScheduleData.createdAt;
      newSchedule.updatedAt = createdScheduleData.updatedAt;
      newSchedule.Completed = createdScheduleData.Completed || 0;
      if (createdScheduleData.Appointments) {
        newSchedule.Appointments.forEach((app, index) => {
          if (createdScheduleData.Appointments[index]) {
            app.id = createdScheduleData.Appointments[index].id;
            app.FK_Schedule = createdScheduleData.id;
          }
        });
      }
      return newSchedule;
    },

    async updateSchedule(updateAppointments, targetSchedule = null) {
      const scheduleRef = targetSchedule || this.currentSchedule;
      let statusValues = [...new Set(updateAppointments.map(appointment => appointment.status))];
      let status = "";

      switch (statusValues[0]) {
        case 'Update appointment time':
          status = 'Confirmed';
          break;
        case 'Reschedule (need to follow-up)':
          status = 'Rescheduling';
          break;
        default:
          status = statusValues[0];
          break;
      }

      let updatedSchedule = {
        id: scheduleRef.id,
        AppointmentTime: this.studyDateTime,
        Status: status,
        FK_Family: scheduleRef.FK_Family,
        Note: this.Note,
        summary: status.toUpperCase() + " - " + this.calendarSummary(updateAppointments),
        Appointments: updateAppointments,
        ScheduledBy: this.store.userID,
        location: this.store.location,
        description: this.calendarDescription(updateAppointments, this.Note),
        Reminded: 0,
      };

      let updatedCalendarEvents = [];
      updatedSchedule.Appointments.forEach((app) => {
        const testingRoom = this.store.testingRooms.find(room => room.id === app.Study.FK_TestingRoom);
        let calendarId = testingRoom ? testingRoom.calendarId : 'primary';
        app.calendarId = calendarId;

        updatedCalendarEvents.push({
          calendarId: app.calendarId,
          AppointmentTime: updatedSchedule.AppointmentTime,
          description: updatedSchedule.description,
          summary: updatedSchedule.summary,
          location: updatedSchedule.location,
          attendees: app.attendees,
          eventId: app.calendarEventId || updatedSchedule.calendarEventId || null,
          eventURL: app.eventURL || updatedSchedule.eventURL || null,
        });
      });

      for (const event of updatedCalendarEvents) {
        if (event.eventId) {
          try {
            await calendar.update(event);
            this.addLog("Update Google Calendar Event", true, `Updated event: ${event.summary}`);
          } catch (error) {
            console.error(error);
            this.addLog("Update Google Calendar Event", false, `Failed to update event: ${error.message}`);
          }
        } else {
          if (updatedSchedule.Status === 'Confirmed') {
            try {
              const createdEvent = await calendar.create(event);
              event.eventURL = createdEvent.data.eventURL;
              event.eventId = createdEvent.data.eventId;
              this.addLog("Create Google Calendar Event", true, `Created event: ${event.summary}`);
            } catch (error) {
              console.error(error);
              this.addLog("Create Google Calendar Event", false, `Failed to create event: ${error.message}`);
            }
          }
        }
      }

      updatedSchedule.Appointments.forEach((app, index) => {
        app.calendarEventId = updatedCalendarEvents[index].eventId;
        app.eventURL = updatedCalendarEvents[index].eventURL;

        app.Experimenters = app.PrimaryExperimenter.map(exp => exp.id);
        app.Experimenters_2nd = app.SecondaryExperimenter.map(exp => exp.id);
        app.FK_Schedule = updatedSchedule.id;
      });

      await this.updateScheduleBackend(updatedSchedule);
      return updatedSchedule;
    },

    async createScheduleBackend(newSchedule) {
      const createdSchedule = await schedule.create(newSchedule);
      return createdSchedule.data;
    },

    async updateScheduleBackend(updatedSchedule) {
      const rs = await schedule.update(updatedSchedule);
      return rs.data;
    },

    calendarSummary(Appointments) {
      let studyNames = Appointments.map((app) => {
        return app.Study.StudyName + "(" + app.Child.FK_Family + app.Child.IdWithinFamily + ")";
      });
      studyNames = Array.from(new Set(studyNames));
      return studyNames.join(" + ");
    },

    calendarDescription(Appointments, Note) {
      let description = "<b>Note: </b>" + Note + "<br>";
      Appointments.forEach((app) => {
        description += "<br>==================" +
          "<br><b>" + app.Study.StudyName + "</b><br>" +
          "<b>E1: </b>" + app.E1 + "<br>" +
          "<b>E2: </b>" + app.E2 + "<br>";

        if (app.Study.StudyType === "Online" && app.PrimaryExperimenter[0] && app.PrimaryExperimenter[0].ZoomLink) {
          description += "<b>zoom link: </b>" + app.PrimaryExperimenter[0].ZoomLink;
        }
      });
      return description;
    },

    emailTypeChange(newVal) {
      switch (newVal) {
        case "Reminder":
        case "ThankYou":
          this.step23ButtonText = "Complete";
          break;
        case "Follow-up":
          this.step23ButtonText = "Next";
          this.contactDate = moment().tz(this.store.timeZone).startOf("day").add(2, "days").format("YYYY-MM-DD");
          this.nextContactNote = "Sent a follow-up email on " + moment().tz(this.store.timeZone).startOf("day").format("YYYY-MM-DD") + ", follow up in 2 days to confirm the participation.";
          break;
      }
    },

    resetVariables() {
      this.studyDateTime = null;
      this.dateTimePickerDisable = true;
      this.stepperPage = "1";
      this.emailUpdate = false;
      this.emailBody = "";
      this.emailSubject = "";
      this.disableStep12 = true;
      this.disableStep23 = true;
      this.contactDate = null;
      this.contactDateObj = null;
      this.datePicker = false;
      this.scheduleEnable = false;
      this.Note = "";
      this.nextContactNote = "";
      this.emailDialog = false;
      this.emailSelectionShow = false;
      this.emailAppointments = [];
      this.skipConfirmationEmailStatus = false;
      this.skipEmail = false;
      this.emailType = "";
      this.emailOptions = ['Confirmation', 'ScheduleUpdate', 'Reminder', 'Follow-up', 'ThankYou'];
      this.contactType = "";
      this.loadingStatus = false;
      this.scheduleButtonText = "Create Appointment";
      this.emailButtonIconShow = false;
      this.emailButtonText = "Send email";
      this.scheduleButtonIconShow = false;
      this.step23ButtonText = "Next";

      this.createdScheduleInSession = null;
      this.isFinalized = false;
      this.confirmCancelDialog = false;
      this.confirmUpdateDialog = false;
      this.actionLogs = [];

      this.section1Open = true;
      this.section2Open = true;
      this.section3Open = false;
      this.hasRecruitableChildrenFlag = false;
      this.step3Section1Open = true;
      this.step3Section2Open = true;
    },

    initiateVariables(dialogType) {
      switch (dialogType) {
        case "schedule":
          this.stepperPage = "1";
          // If updating an existing schedule, pre-enable the date/time picker
          if (this.scheduleType === 'update') {
            this.dateTimePickerDisable = false;
          }
          break;
        case "email":
          this.stepperPage = "2";
          this.emailAppointments = this.currentSchedule.Appointments || [];
          this.studyDateTime = this.currentSchedule.AppointmentTime;
          this.contactDate = this.currentFamily?.NextContactDate;
          this.nextContactNote = this.currentFamily?.NextContactNote;
          this.emailDialog = true;
          this.emailSelectionShow = true;
          this.emailOptions = ['Reminder', 'Follow-up', 'ThankYou'];

          this.emailType = "Reminder";
          if (this.currentSchedule.Status === "Confirmed" && (this.currentSchedule.Completed === 1 || this.currentSchedule.Completed === true)) {
            this.emailType = "ThankYou";
          }

          if (["TBA", "Rescheduling", "No Show", "Cancelled"].includes(this.currentSchedule.Status)) {
            this.emailType = "Follow-up";
          }
          break;
      }
    },

    onDialogClose(value) {
      if (!value) {
        this.$emit('close-dialog');
      }
    },

    close() {
      if (this.createdScheduleInSession && !this.isFinalized) {
        this.confirmCancelDialog = true;
      } else {
        this.$emit('close-dialog');
      }
    },

    async cancelSchedule() {
      this.loadingStatus = true;
      if (this.createdScheduleInSession) {
        try {
          // Delete Google Calendar Events
          if (this.createdScheduleInSession.Appointments) {
            for (const app of this.createdScheduleInSession.Appointments) {
              if (app.calendarEventId) {
                await calendar.delete({ 
                  id: app.id,
                  eventId: app.calendarEventId, 
                  FK_Schedule: this.createdScheduleInSession.id,
                  lab: this.store.lab 
                });
              }
            }
          }

          // Delete Schedule
          await schedule.delete({ 
            id: this.createdScheduleInSession.id
          });
          this.addLog("Cancel Schedule", true, "Successfully cancelled schedule and deleted calendar events.");
        } catch (error) {
          console.error(error);
          this.addLog("Cancel Schedule", false, "Failed to cancel schedule.");
        }
      }
      this.loadingStatus = false;
      this.confirmCancelDialog = false;
      this.$emit('close-dialog');
    },

    async sendEmail() {
      this.loadingStatus = true;
      let success = false;
      try {
        success = await this.$refs.emailComponentRef.sendEmail();
      } catch (error) {
        console.error(error);
      }

      if (success) {
        this.emailButtonText = "Email sent!";
        this.emailButtonIconShow = true;
        this.disableStep23 = false;
        this.addLog("Send Email", true, "Successfully sent email.");
      } else {
        this.addLog("Send Email", false, "Failed to send email.");
      }
      this.loadingStatus = false;
    },

    skipConfirmationEmail(val) {
      this.skipConfirmationEmailStatus = val;
    },

    generateNextContactNote() {
      const tz = this.store.timeZone;
      switch (this.contactType) {
        case "nextStudy":
          this.contactDate = moment(this.studyDateTime).tz(tz).add(7, "days").format("YYYY-MM-DD");
          this.nextContactNote = "The family is about to participate in a study on " + moment(this.studyDateTime).tz(tz).format("YYYY-MM-DD") + ". Contact the family at least 7 days (" + moment(this.studyDateTime).add(7, "days").tz(tz).format("YYYY-MM-DD") + ") after their participation.";
          break;
        case "followUP":
        case "followUpforNoShow":
        case "followUpforCancelledAppointment":
          this.contactDate = moment().tz(tz).startOf("day").add(2, "days").format("YYYY-MM-DD");
          this.nextContactNote = "Action taken today. Follow up in 2 days to confirm their status / participation.";
          break;
        case "rejectAndFutureStudy":
          this.contactDate = moment().tz(tz).startOf("day").add(2, "w").format("YYYY-MM-DD");
          this.nextContactNote = "Rejected participation on " + moment().tz(tz).startOf("day").format("YYYY-MM-DD") + ". Recommend contacting the family for other studies after 2 weeks.";
          break;
        case "Completed":
          this.contactDate = moment(this.studyDateTime).tz(tz).startOf("day").add(1, "w").format("YYYY-MM-DD");
          this.nextContactNote = "Finished a study on " + moment(this.studyDateTime).tz(tz).startOf("day").format("YYYY-MM-DD") + ". Contact the family again for other studies at least after one week.";
          break;
      }
    },

    step12() {
      if (this.skipEmail) {
        this.stepperPage = "3";
        this.emailDialog = false;
      } else {
        for (const appointment of this.emailAppointments) {
          switch (appointment.status) {
            case 'Confirmed': this.emailType = "Confirmation"; break;
            case 'Update appointment time': this.emailType = "ScheduleUpdate"; break;
            case 'Left a message':
            case 'Interested': this.emailType = "Introduction"; break;
            case 'Reschedule (need to follow-up)': this.emailType = "Reschedule"; break;
            case 'Cancelled': this.emailType = "cancelledReminder"; break;
            case 'No Show': this.emailType = "noShowReminder"; break;
          }
        }
        this.stepperPage = "2";
        this.emailDialog = true;
      }

      this.loadingStatus = false;
      this.generateNextContactNote();
      this.emailSelectionShow = false;
    },

    step23() {
      if (this.emailType === "ThankYou" || this.emailType === "Reminder") {
        this.close();
      } else {
        this.stepperPage = "3";
        this.emailDialog = false;
      }
    },

    async finalizeSchedule() {
      try {
        await family.update({
          id: this.currentFamily?.id,
          NextContactDate: this.contactDate,
          LastContactDate: moment().tz(this.store.timeZone).startOf("day").format("YYYY-MM-DD"),
          NextContactNote: this.nextContactNote,
        });
        this.isFinalized = true;
        this.close();
      } catch (error) {
        console.error(error);
      }
    },
  },
  computed: {
    step2Editable() {
      if (Number(this.stepperPage) >= 2) return true;
      if (this.stepperPage === '3') return true;
      if (this.stepperPage === '1' && this.createdScheduleInSession) return true;
      return false;
    },
    step3Editable() {
      if (Number(this.stepperPage) >= 3) return true;
      if (this.stepperPage === '1') return false;
      if (this.stepperPage === '2' && this.isFinalized) return true;
      return false;
    },
    daysLate() {
      if (this.contactDate) {
        let differentDays = moment.duration(moment(this.contactDate).startOf("day").diff(moment().startOf("day"))).asDays();
        return differentDays + " days later";
      } else {
        return "";
      }
    },
  },
  watch: {
    dialog(val) {
      if (!val) {
        if (this.$refs.dateTimePickerComp) this.$refs.dateTimePickerComp.resetDateTime();
        if (this.$refs.appointmentDetailsRef) this.$refs.appointmentDetailsRef.resetVariables();
        this.resetVariables();
      }
    },
    currentSchedule(newVal) {
      if (newVal) {
        this.Note = newVal.Note || "";
        this.nextContactNote = newVal.nextContactNote || "";
        this.scheduleButtonText = (this.scheduleType === 'create') ? "Create Appointment" : "Update Appointment";

        this.initiateVariables(this.dialogType);
        this.dateTimePickerDisable = (this.parentResponse !== 'Confirmed');

        switch (this.parentResponse) {
          case 'Interested':
          case 'Left a message':
          case 'Rejected':
            this.scheduleEnable = true;
            break;
        }
      }
    },
  },
  mounted() {
    if (this.currentSchedule) {
      this.Note = this.currentSchedule.Note || "";
      this.nextContactNote = this.currentSchedule.nextContactNote || "";
      this.scheduleButtonText = (this.scheduleType === 'create') ? "Create Schedule" : "Update Schedule";

      this.initiateVariables(this.dialogType);
      this.dateTimePickerDisable = (this.parentResponse !== 'Confirmed');

      switch (this.parentResponse) {
        case 'Interested':
        case 'Left a message':
        case 'Rejected':
          this.scheduleEnable = true;
          break;
      }
    }
  }
}
</script>

<style scoped>
.v-card__subtitle,
.v-card__text,
.v-card__title {
  padding: 4px 16px;
}
</style>

<style>
.schedule-dialog-overlay {
  max-height: 90vh !important;
  overflow-y: auto !important;
}
</style>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  padding: 8px 4px;
  cursor: pointer;
  border-radius: 4px;
  user-select: none;
}
.section-header:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}
.section-body {
  padding: 4px 0 8px 0;
}
</style>
