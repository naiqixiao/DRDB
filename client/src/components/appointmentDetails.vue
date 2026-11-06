<template>
  <v-container class="pa-0 d-flex flex-column">
    <!-- <div class="text-caption font-weight-bold text-uppercase text-muted mb-3">Appointment details:</div> -->

    <!-- Appointment Data Table -->
    <v-container>
      <v-data-table 
        class="noFooterTable elevation-1" 
        :headers="apptHeaders" 
        :items="editedAppointments" 
        hide-default-footer
        items-per-page="-1"
      >
        <!-- Child Name -->
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.Child.Name="{ item }">
          {{ item.Child?.Name ? item.Child.Name.split(" ")[0] : "Name missing" }}
        </template>

        <!-- study & dropbox -->
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.studyName="{ item, index }">
          <v-select 
            variant="outlined" 
            density="compact" 
            :items="potentialStudies(item.Child, item.FK_Study, index).potentialStudyList" 
            item-value="id"
            item-title="StudyName" 
            v-model="selectedStudies[index]" 
            return-object 
            label="Study"
            hide-details 
            @update:model-value="optionChangedStudy($event, index, item)"
            :disabled="index === 10"
          ></v-select>
        </template>

        <!-- primary experimenter -->
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.experimenter1="{ index }">
          <v-select 
            variant="outlined" 
            density="compact" 
            :items="optionsE1[index]" 
            item-value="id" 
            item-title="Name"
            v-model="selectedExperimenters[index]" 
            label="E1" 
            hide-details 
            return-object
            @update:model-value="optionChangedE1($event, index)"
          ></v-select>
        </template>

        <!-- assistant experimenters -->
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.experimenter2="{ index }">
          <v-select 
            variant="outlined" 
            density="compact" 
            :items="optionsE2[index]" 
            item-value="id" 
            item-title="Name"
            v-model="selectedExperimenters_2nd[index]" 
            label="E2" 
            multiple 
            hide-details 
            return-object
            @update:model-value="optionChangedE2($event, index)"
          ></v-select>
        </template>

        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.actions="{ item, index }">
          <v-container class="d-flex pa-2 align-center justify-center">
            <!-- select appointment status -->
            <v-select 
              variant="outlined" 
              density="compact" 
              :items="statusOptions" 
              label="Appointment status"
              v-model="item.status" 
              hide-details 
              style="width: 75%"
              @update:model-value="optionChangedStatus($event, item)" 
              :key="item.status"
              :disabled="scheduleType === 'create'"
            ></v-select>
            <v-spacer></v-spacer>

            <!-- delete button -->
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <div v-bind="props" class="align-self-end">
                  <v-btn 
                    variant="text" 
                    icon 
                    color="primary" 
                    @click="deleteCurrentAppointment(index)"
                    :disabled="appointmentDeletable(item, index)"
                  >
                    <v-icon>{{ appointmentDeletable(item, index) ? "mdi-delete-off" : "mdi-delete" }}</v-icon>
                  </v-btn>
                </div>
              </template>
              <span>You can only delete the appointment created in this session.<br> To cancel any previously booked appointment, choose CANCEL in the dropdown menu.</span>
            </v-tooltip>
          </v-container>
        </template>

      </v-data-table>
    </v-container>

    <!-- additional possible appointments -->
    <template v-if="showAdditionalAppointments">
    <v-divider class="mb-5"></v-divider>

    <v-row dense align="baseline" justify="start" style="height: 80px">
      <v-col cols="12" class="pb-0">
        <div class="text-caption font-weight-bold text-uppercase text-muted mb-1">Additional appointment(s) for:</div>
      </v-col>
      <v-col cols="12" md="2" class="centerCol" v-for="(child, index) in Children" :key="child.id">
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <div v-bind="props" class="align-self-end">
              <v-btn 
                class="text-capitalize" 
                rounded="pill" 
                color="primary" 
                @click="newAppointment(child)"
                :disabled="nSelectableStudies[index] < 1 || parentResponse === 'Rejected' || additionalStudyButtonDisable"
              >
                {{ child.Name ? child.Name.split(" ")[0] : "Name is missing" }}
                <v-icon size="24px" class="ms-2" v-if="nSelectableStudies[index] < 10">
                  {{ "mdi-numeric-" + nSelectableStudies[index] + "-circle-outline" }}
                </v-icon>
                <v-icon size="24px" class="ms-2" v-else>
                  mdi-numeric-9-plus-circle-outline
                </v-icon>
              </v-btn>
            </div>
          </template>
          <div class="text-start" v-html="childPopUpInfo(child)"></div>
        </v-tooltip>
      </v-col>
    </v-row>
    </template>
    <!-- why is a study not listed? -->
    <div class="px-4 pb-2 flex-shrink-0">
      <v-btn variant="text" size="small" color="primary" prepend-icon="mdi-help-circle-outline"
        @click="showIneligibleReasons = !showIneligibleReasons">
        {{ showIneligibleReasons ? "Hide" : "Why isn't a study listed?" }}
      </v-btn>
      <v-sheet v-if="showIneligibleReasons" border rounded class="mt-2 pa-3 reasons-sheet">
        <div v-for="entry in ineligibilityReport" :key="entry.childId" class="mb-4">
          <div class="text-subtitle-2 font-weight-bold mb-1">
            {{ entry.childName }}
            <span class="text-caption text-medium-emphasis ml-2">{{ entry.ageLabel }}</span>
          </div>
          <div v-if="entry.rows.length === 0" class="text-caption">Eligible for every study in the list.</div>
          <v-table v-else density="compact" class="reasons-table">
            <tbody>
              <tr v-for="row in entry.rows" :key="row.studyId">
                <td class="reasons-study font-weight-medium">{{ row.studyName }}</td>
                <td class="py-1">
                  <v-chip v-for="(reason, i) in row.reasons" :key="i" size="x-small" label variant="tonal"
                    color="warning" class="mr-1 my-1 reason-chip">{{ reason }}</v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-sheet>
    </div>
  </v-container>
</template>

<script>
import { isChildEligibleForStudy, explainIneligibility } from "@/assets/JS/studyEligibility";
import moment from "moment";
import { childAge } from '@/assets/JS/displayFunctions.js';

import { useMainStore } from "@/stores/mainStore";

export default {
  setup() {
    const store = useMainStore();
    return { store };
  },
  name: "appointmentDetails",
  props: {
    Appointments: Array,
    Children: Array,
    targetChild: Object,
    // Full family record. Family.Children entries only carry a partial Family
    // (no OnlineStudyOnly), so eligibility needs the real one.
    family: Object,
    scheduleType: String,
    parentResponse: String,
    showAdditionalAppointments: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["dateTimePickerDisableUpdate", "newAppointment", "deleteCurrentAppointment", "readyToCreateSchedule", "hasRecruitableChildren"],
  data() {
    return {
      appointmentDetailReady: false,
      editedAppointments: [],
      apptHeaders: [
        { title: "Child", align: "center", key: "Child.Name", width: "12%", sortable: false },
        { title: "Study", align: "center", key: "studyName", width: "18%", sortable: false },
        { title: "Experimenter (E1)", align: "center", key: "experimenter1", sortable: false, width: "20%" },
        { title: "Asst. Experimenter (E2)", align: "center", key: "experimenter2", sortable: false, width: "20%" },
        { title: "Actions", align: "center", key: "actions", sortable: false, width: "30%" }
      ],
      selectedExperimenters: [],
      selectedExperimenters_2nd: [],
      selectedStudies: [],
      optionsE1: [],
      optionsE2: [],
      nSelectableStudies: [],
      deletedAppointments: [],
      additionalStudyButtonDisable: false,
      showIneligibleReasons: false,
    }
  },
  methods: {
    childAge,

    // Retired personnel stay linked to the study but must not be offered as E1/E2.
    activeExperimenters(study) {
      return (study?.Experimenters || []).filter((experimenter) => !experimenter.Retired);
    },

    updateSelectableStudies() {
      if (!this.Children) return;
      this.nSelectableStudies = this.Children.map(child => {
        return this.potentialStudies(child).selectableStudies.length;
      });
      this.$emit("hasRecruitableChildren", this.nSelectableStudies.some(n => n > 0));
    },

    potentialStudies(child, bookedStudy, rowIndex) {
      if (!child) return { potentialStudyList: [], selectableStudies: [] };
      
      let eligibleStudies = [];
      const allStudies = this.store.studies || [];

      allStudies.forEach((study) => {
        if (this.studyElegibility(study, child) && !study.Completed) {
          eligibleStudies.push(study.id);
        }
      });

      let uniquePreviousStudies = [];

      if (child.Appointments) {
        child.Appointments.forEach((appointment) => {
          uniquePreviousStudies.push(appointment.FK_Study);
        });
        uniquePreviousStudies = Array.from(new Set(uniquePreviousStudies));
      }

      if (bookedStudy) {
        const index = uniquePreviousStudies.indexOf(bookedStudy);
        if (index > -1) uniquePreviousStudies.splice(index, 1);
      }

      let potentialStudiesIds = eligibleStudies.filter(
        (study) => !uniquePreviousStudies.includes(study)
      );

      // Studies this child already has selected, per row. The selection can live in
      // selectedStudies (dropdown) even when FK_Study has not been synced yet.
      const selectedByRow = [];
      this.editedAppointments.forEach((appointment, i) => {
        if (String(appointment.FK_Child) !== String(child.id)) return;
        const studyId = appointment.FK_Study ?? this.selectedStudies[i]?.id ?? null;
        if (studyId != null) selectedByRow.push({ row: i, studyId });
      });
      const currentSelectedStudies = selectedByRow.map((entry) => entry.studyId);

      let selectableStudies = potentialStudiesIds.filter(
        (study) => !currentSelectedStudies.includes(study)
      );

      // A row's picker must not offer a study this child already has in ANOTHER row
      // (its own selection stays so the select can still display it).
      const studiesInOtherRows = selectedByRow
        .filter((entry) => entry.row !== rowIndex)
        .map((entry) => entry.studyId);

      let potentialStudyList = allStudies.filter((study) =>
        potentialStudiesIds.includes(study.id) && !studiesInOtherRows.includes(study.id)
      );

      return {
        potentialStudyList: potentialStudyList,
        selectableStudies: selectableStudies,
      };
    },

    studyElegibility(study, child) {
      return isChildEligibleForStudy(study, child, this.family);
    },

    optionChangedStatus(newVal, changedItem) {
      let statusArray = [];
      switch (newVal) {
        case "Cancelled":
        case "No Show":
        case "Confirmed":
        case "Interested":
        case "Left a message":
        case "Rejected":
          this.editedAppointments.forEach(item => {
            if (item.id !== changedItem.id) {
              item.status = newVal;
            }
          });
          break;

        case "Update appointment time":
          statusArray = ['Cancelled', 'No Show', 'Reschedule (need to follow-up)'];
          this.editedAppointments.forEach(item => {
            if (item.id !== changedItem.id) {
              if (statusArray.includes(item.status)) {
                item.status = null;
              }
            }
          });
          break;

        case "Reschedule (need to follow-up)":
          statusArray = ['Cancelled', 'No Show', 'Update appointment time'];
          this.editedAppointments.forEach(item => {
            if (item.id !== changedItem.id) {
              if (statusArray.includes(item.status)) {
                item.status = null;
              }
            }
          });
          break;

        default:
          changedItem.status = newVal;
          this.editedAppointments.forEach(item => {
            if (item.id !== changedItem.id) {
              if (item.status === 'Cancelled' || item.status === 'No Show') {
                item.status = null;
              }
            }
          });
          break;
      }

      if (this.editedAppointments.some(appointment => appointment.status === "Update appointment time" || appointment.status === "Confirmed")) {
        this.$emit("dateTimePickerDisableUpdate", false)
        this.additionalStudyButtonDisable = false;
      } else {
        this.$emit("dateTimePickerDisableUpdate", true)
        this.additionalStudyButtonDisable = true;
      }

      this.readyToCreateSchedule();
    },

    optionChangedStudy(newVal, index) {
      if (!newVal) return;
      this.optionsE1[index] = this.activeExperimenters(newVal);
      this.optionsE2[index] = this.activeExperimenters(newVal);

      if (this.selectedExperimenters[index]) {
        this.optionsE2[index] = this.activeExperimenters(this.selectedStudies[index]).filter(experimenter => this.selectedExperimenters[index].id !== experimenter.id);
      }
      if (this.selectedExperimenters_2nd[index]) {
        this.optionsE1[index] = this.activeExperimenters(this.selectedStudies[index]).filter(experimenter => !this.selectedExperimenters_2nd[index].some(experimenter2nd => experimenter2nd.id === experimenter.id));
      }

      this.editedAppointments[index].FK_Study = newVal.id;
      this.readyToCreateSchedule();

      this.nSelectableStudies = this.Children.map(child => {
        return this.potentialStudies(child).selectableStudies.length
      });
    },

    optionChangedE1(newVal, index) {
      if (newVal && this.selectedStudies[index] && this.selectedStudies[index].Experimenters) {
        this.optionsE2[index] = this.activeExperimenters(this.selectedStudies[index]).filter(experimenter => newVal.id !== experimenter.id);
      }
      this.readyToCreateSchedule();
    },

    optionChangedE2(newVal, index) {
      if (newVal && this.selectedStudies[index] && this.selectedStudies[index].Experimenters) {
        this.optionsE1[index] = this.activeExperimenters(this.selectedStudies[index]).filter(experimenter => !newVal.some(experimenter2nd => experimenter2nd.id === experimenter.id));
      }
      this.readyToCreateSchedule();
    },

    newAppointment(child) {
      const newAppointment = {
        FK_Child: child.id,
        FK_Family: child.FK_Family,
        FK_Schedule: this.editedAppointments.length > 0 ? (this.editedAppointments[0].FK_Schedule || null) : null,
        FK_Study: null,
        Child: child
      }

      if (this.scheduleType === 'create' && this.editedAppointments.length > 0) {
        newAppointment.status = this.editedAppointments[0].status;
      } else {
        newAppointment.status = null;
      }

      this.selectedStudies.push(null);
      this.selectedExperimenters.push(null);
      this.selectedExperimenters_2nd.push([]);
      this.optionsE1.push([]);
      this.optionsE2.push([]);

      this.editedAppointments.push(newAppointment);

      this.readyToCreateSchedule();
      this._skipWatcherReset = true;
      this.$emit("newAppointment", JSON.parse(JSON.stringify(newAppointment)));
    },

    deleteCurrentAppointment(index) {
      if (this.editedAppointments[index].id) {
        this.deletedAppointments.push(this.editedAppointments[index].id)
      }
      this.editedAppointments.splice(index, 1);
      this.selectedStudies.splice(index, 1);
      this.selectedExperimenters.splice(index, 1);
      this.selectedExperimenters_2nd.splice(index, 1);
      this.optionsE1.splice(index, 1);
      this.optionsE2.splice(index, 1);
      this._skipWatcherReset = true;
      this.$emit("deleteCurrentAppointment", index);
      this.readyToCreateSchedule();
    },

    readyToCreateSchedule() {
      let readyToCreateSchedule = false;

      if (this.editedAppointments.length > 0 && this.editedAppointments.every(appointment => 'status' in appointment && appointment.status != null)) {
        if (this.scheduleType === 'create') {
          switch (this.parentResponse) {
            case 'Confirmed':
              readyToCreateSchedule = (this.checkAppointmentsAssignedStudy() && this.checkAppointmentsAssignedExperimenter() && this.checkAppointmentsAssignedStatus());
              break;
            case 'Interested':
            case 'Left a message':
            case 'Rejected':
              readyToCreateSchedule = (this.checkAppointmentsAssignedStudy() && this.checkAppointmentsAssignedStatus());
              break;
          }
        } else {
          if (this.editedAppointments.some(appointment => appointment.status === "Update appointment time")) {
            readyToCreateSchedule = (this.checkAppointmentsAssignedStudy() && this.checkAppointmentsAssignedExperimenter() && this.checkAppointmentsAssignedStatus());
          } else {
            readyToCreateSchedule = (this.checkAppointmentsAssignedStudy() && this.checkAppointmentsAssignedStatus());
          }
        }
      } else {
        readyToCreateSchedule = false;
      }

      this.appointmentDetailReady = readyToCreateSchedule;
      this.$emit("readyToCreateSchedule");
    },

    checkAppointmentsAssignedStudy() {
      return this.editedAppointments.length > 0 && this.editedAppointments.every(appointment => appointment.FK_Study != null);
    },

    checkAppointmentsAssignedExperimenter() {
      const activeAppointments = this.editedAppointments.filter(app => app.status === "Update appointment time" || app.status === "Confirmed");
      if (activeAppointments.length === 0) return true;
      return activeAppointments.every((appointment) => {
        const index = this.editedAppointments.indexOf(appointment);
        return this.selectedExperimenters[index] && 'id' in this.selectedExperimenters[index];
      });
    },

    checkAppointmentsAssignedStatus() {
      return this.editedAppointments.every(appointment => appointment.status != null);
    },

    generateAppointments() {
      this.editedAppointments.forEach((appointment, index) => {
        appointment.PrimaryExperimenter = [this.selectedExperimenters[index]];
        appointment.SecondaryExperimenter = this.selectedExperimenters_2nd[index];
        appointment.FK_Study = this.selectedStudies[index]?.id;
        appointment.Study = this.selectedStudies[index];
        appointment.E1 = this.selectedExperimenters[index] ? this.selectedExperimenters[index].Name + " (" + this.selectedExperimenters[index].Email + ")" : "TBD";

        const experimenterNames_2nd = (this.selectedExperimenters_2nd[index] || []).map((experimenter) => {
          return experimenter.Name + " (" + experimenter.Email + ")";
        });
        appointment.E2 = experimenterNames_2nd.join(", ");
      });

      const statusValues = [...new Set(this.editedAppointments.map(appointment => appointment.status))];

      let updatedAppointments = []; 
      let newAppointments = []; 
      let completedAppointments = []; 

      if (statusValues.length > 1) {
        newAppointments = this.editedAppointments.filter(appointment => appointment.status === 'Update appointment time' || appointment.status === 'Reschedule (need to follow-up)');
        completedAppointments = this.editedAppointments.filter(appointment => appointment.status === 'Completed');
        // Collect Cancelled/No Show so their status changes are saved (not silently dropped)
        updatedAppointments = this.editedAppointments.filter(appointment => appointment.status === 'Cancelled' || appointment.status === 'No Show');
      } else if (statusValues.length === 1) {
        switch (statusValues[0]) {
          case 'Update appointment time':
          case 'Reschedule (need to follow-up)':
          case 'Cancelled':
          case 'No Show':
            updatedAppointments = this.editedAppointments;
            break;
          case 'Confirmed':
          case "Interested":
          case "Left a message":
          case 'Rejected':
            newAppointments = this.editedAppointments;
            break;
          case 'Completed':
            completedAppointments = this.editedAppointments;
            break;
        }
      }

      updatedAppointments.forEach(appointment => {
        appointment.attendees = this.generateAttendees(appointment);
      });
      newAppointments.forEach(appointment => {
        appointment.attendees = this.generateAttendees(appointment);
      });

      const deletedAppointments = this.deletedAppointments;
      return { updatedAppointments, newAppointments, deletedAppointments, completedAppointments }
    },

    assignStudyExperimenters() {
      if (!this.Appointments) return;
      this.editedAppointments = JSON.parse(JSON.stringify(this.Appointments));
      this.editedAppointments.forEach((appointment, index) => {
        this.selectedStudies[index] = appointment.Study ? Object.assign({}, appointment.Study) : null;
        this.selectedExperimenters[index] = appointment.PrimaryExperimenter && appointment.PrimaryExperimenter.length > 0 ? Object.assign({}, appointment.PrimaryExperimenter[0]) : null;
        this.selectedExperimenters_2nd[index] = appointment.SecondaryExperimenter || [];

        if (this.selectedStudies[index] && Object.keys(this.selectedStudies[index]).length > 0 && this.selectedStudies[index].Experimenters) {
          const e1Id = this.selectedExperimenters[index] ? this.selectedExperimenters[index].id : null;
          this.optionsE2[index] = this.activeExperimenters(this.selectedStudies[index]).filter(experimenter => e1Id !== experimenter.id);
          this.optionsE1[index] = this.activeExperimenters(this.selectedStudies[index]).filter(experimenter => !this.selectedExperimenters_2nd[index].some(experimenter2nd => experimenter2nd.id === experimenter.id));
        } else {
          this.optionsE1[index] = [];
          this.optionsE2[index] = [];
        }
      });
    },

    appointmentDeletable(item, index) {
      if (item.createdAt) {
        let differentDays = moment.duration(moment(item.createdAt).startOf("day").diff(moment().startOf("day"))).asDays();
        if (differentDays < 0 || index === 0) {
          return true;
        }
      }
      return false;
    },

    generateAttendees(appointment) {
      let attendees = [];
      if (appointment.PrimaryExperimenter) {
        appointment.PrimaryExperimenter.forEach((experimenter) => {
          if (experimenter && experimenter.Calendar) {
            attendees.push({ displayName: experimenter.Name, email: experimenter.Calendar });
          }
        });
      }
      if (appointment.SecondaryExperimenter) {
        appointment.SecondaryExperimenter.forEach((experimenter) => {
           if (experimenter && experimenter.Calendar) {
             attendees.push({ displayName: experimenter.Name, email: experimenter.Calendar });
           }
        });
      }
      return attendees;
    },

    childPopUpInfo(child) {
      if (!child) return "";
      const nPreviousParticipation = child.Appointments ? child.Appointments.length : 0;
      return '<strong>Age:  </strong>' + this.childAge(child) + "<br><strong>Gender: </strong>" + (child.Sex || 'N/A') + "<br><strong>Participation (N): </strong>" + nPreviousParticipation;
    },

    resetVariables() {
      this.nSelectableStudies = [];
      this.deletedAppointments = [];
      this.selectedStudies = [];
      this.selectedExperimenters = [];
      this.selectedExperimenters_2nd = [];
      this.additionalStudyButtonDisable = false;
      this.appointmentDetailReady = false;
      if (this.Appointments) {
        this.assignStudyExperimenters();
      }
    },
  },

  computed: {
    // For each child, the studies they cannot be offered and why (age groups, history, rules, ...).
    ineligibilityReport() {
      const studies = this.store.studies || [];
      return (this.Children || []).map((child) => {
        const history = new Set((child.Appointments || []).map((app) => Number(app.FK_Study)));
        const rows = [];
        studies.forEach((study) => {
          const reasons = [];
          if (study.Completed) reasons.push("Study is marked completed");
          if (history.has(Number(study.id))) reasons.push("Child already has an appointment for this study");
          reasons.push(...explainIneligibility(study, child, this.family));
          if (reasons.length) rows.push({ studyId: study.id, studyName: study.StudyName, reasons });
        });
        return { childId: child.id, childName: child.Name ? child.Name.split(" ")[0] : "Child", ageLabel: this.childAge(child), rows };
      });
    },
    statusOptions() {
      let statusOptions = [];
      switch (this.scheduleType) {
        case 'create':
          statusOptions = ["Confirmed", "Interested", "Left a message", "Rejected"];
          break;
        case 'update':
          statusOptions = ["Update appointment time", "Reschedule (need to follow-up)", "No Show", "Cancelled", "Completed"];
          break;
      }
      return statusOptions;
    }
  },

  watch: {
    Appointments: {
      deep: true,
      handler(newVal) {
        if (this._skipWatcherReset) {
          this._skipWatcherReset = false;
          return;
        }
        if (newVal) {
          this.resetVariables();
        }
      }
    },
    editedAppointments: {
      deep: true,
      handler() { this.updateSelectableStudies(); }
    },
    // The study list can be refreshed from the server while this is open.
    "store.studies"() { this.updateSelectableStudies(); }
  },

  mounted() {
    this.resetVariables();
  }
}
</script>

<style scoped>
.reasons-sheet {
  max-height: 280px;
  overflow-y: auto;
}
.reasons-table {
  background: transparent;
}
.reasons-study {
  width: 180px;
  min-width: 140px;
  vertical-align: top;
  padding-top: 8px !important;
}
.reason-chip {
  height: auto !important;
  white-space: normal;
  padding-top: 2px;
  padding-bottom: 2px;
}
</style>
