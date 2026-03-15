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
            :items="potentialStudies(item.Child, item.FK_Study).potentialStudyList" 
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
  </v-container>
</template>

<script>
import moment from "moment";
import { childAge } from '@/assets/JS/displayFunctions.js';

export default {
  name: "appointmentDetails",
  props: {
    Appointments: Array,
    Children: Array,
    targetChild: Object,
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
    }
  },
  methods: {
    childAge,

    potentialStudies(child, bookedStudy) {
      if (!child) return { potentialStudyList: [], selectableStudies: [] };
      
      let eligibleStudies = [];

      this.$store.state.studies.forEach((study) => {
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

      let currentSelectedStudies = [];
      this.editedAppointments.forEach((appointment) => {
        if (appointment.FK_Child === child.id) { currentSelectedStudies.push(appointment.FK_Study) }
      })

      let selectableStudies = potentialStudiesIds.filter(
        (study) => !currentSelectedStudies.includes(study)
      );

      let potentialStudyList = this.$store.state.studies.filter((study) =>
        potentialStudiesIds.includes(study.id)
      );

      return {
        potentialStudyList: potentialStudyList,
        selectableStudies: selectableStudies,
      };
    },

    studyElegibility(study, child) {
      if (!child.DoB) return false;

      const Age = Math.floor(
        (new Date() - new Date(child.DoB)) / (1000 * 60 * 60 * 24)
      );

      // 1. Age Group Check (child must fit into AT LEAST ONE age group)
      let ageEligible = false;
      if (study.AgeGroups && study.AgeGroups.length > 0) {
        ageEligible = study.AgeGroups.some(
          (group) => Age >= group.MinAge * 30.5 - 1 && Age <= group.MaxAge * 30.5 - 1
        );
      } else {
        ageEligible = true; // fallback if no age groups defined
      }

      // Past participated study IDs
      const pastStudyIds = child.Appointments
        ? child.Appointments.map((app) => app.FK_Study)
        : [];

      // 2. Prerequisite Check (child MUST HAVE participated in ALL prerequisites)
      let meetsPrereqs = true;
      if (study.Prerequisites && study.Prerequisites.length > 0) {
        meetsPrereqs = study.Prerequisites.every((prereq) =>
          pastStudyIds.includes(prereq.id)
        );
      }

      // 3. Exclusion Check (child MUST NOT have participated in ANY exclusions)
      let meetsExclusions = true;
      if (study.Exclusions && study.Exclusions.length > 0) {
        meetsExclusions = !study.Exclusions.some((excl) =>
          pastStudyIds.includes(excl.id)
        );
      }

      let asd = false;
      switch (study.ASDParticipant) {
        case "Only":
          child.Family?.AutismHistory ? (asd = true) : (asd = false);
          break;
        case "Exclude":
          child.Family?.AutismHistory ? (asd = false) : (asd = true);
          break;
        case "Include":
          asd = true;
          break;
      }

      let hearing = false;
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

      let vision = false;
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

      let premature = false;
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

      let illness = false;
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

      return ageEligible && meetsPrereqs && meetsExclusions && asd && hearing && vision && premature && illness;
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
      this.optionsE1[index] = newVal.Experimenters || [];
      this.optionsE2[index] = newVal.Experimenters || [];

      if (this.selectedExperimenters[index]) {
        this.optionsE2[index] = this.selectedStudies[index].Experimenters.filter(experimenter => this.selectedExperimenters[index].id !== experimenter.id);
      }
      if (this.selectedExperimenters_2nd[index]) {
        this.optionsE1[index] = this.selectedStudies[index].Experimenters.filter(experimenter => !this.selectedExperimenters_2nd[index].some(experimenter2nd => experimenter2nd.id === experimenter.id));
      }

      this.editedAppointments[index].FK_Study = newVal.id;
      this.readyToCreateSchedule();

      this.nSelectableStudies = this.Children.map(child => {
        return this.potentialStudies(child).selectableStudies.length
      });
    },

    optionChangedE1(newVal, index) {
      if (newVal && this.selectedStudies[index] && this.selectedStudies[index].Experimenters) {
        this.optionsE2[index] = this.selectedStudies[index].Experimenters.filter(experimenter => newVal.id !== experimenter.id);
      }
      this.readyToCreateSchedule();
    },

    optionChangedE2(newVal, index) {
      if (newVal && this.selectedStudies[index] && this.selectedStudies[index].Experimenters) {
        this.optionsE1[index] = this.selectedStudies[index].Experimenters.filter(experimenter => !newVal.some(experimenter2nd => experimenter2nd.id === experimenter.id));
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
      return this.editedAppointments.some((appointment, index) => 
        (appointment.status === "Update appointment time" || appointment.status === "Confirmed") && 
        (this.selectedExperimenters[index] && 'id' in this.selectedExperimenters[index])
      );
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
        appointment.E1 = this.selectedExperimenters[index]?.Name + " (" + this.selectedExperimenters[index]?.Email + ")";

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
          this.optionsE2[index] = this.selectedStudies[index].Experimenters.filter(experimenter => e1Id !== experimenter.id);
          this.optionsE1[index] = this.selectedStudies[index].Experimenters.filter(experimenter => !this.selectedExperimenters_2nd[index].some(experimenter2nd => experimenter2nd.id === experimenter.id));
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
          if (experimenter.Calendar) {
            attendees.push({ displayName: experimenter.Name, email: experimenter.Calendar });
          }
        });
      }
      if (appointment.SecondaryExperimenter) {
        appointment.SecondaryExperimenter.forEach((experimenter) => {
           if (experimenter.Calendar) {
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
      handler() {
        if (this.Children) {
          this.nSelectableStudies = this.Children.map(child => {
            return this.potentialStudies(child).selectableStudies.length;
          });
          this.$emit("hasRecruitableChildren", this.nSelectableStudies.some(n => n > 0));
        }
      }
    }
  },

  mounted() {
    this.resetVariables();
  }
}
</script>

<style scoped>
</style>
