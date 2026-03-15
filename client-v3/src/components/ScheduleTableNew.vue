<template>
  <div style="margin: 0px">
    <!-- Main Data Table -->
    <v-data-table 
      :headers="headers" 
      :items="Schedules" 
      :items-per-page="parseInt(nofItems)" 
      class="elevation-1"
      no-data-text="No study appointment to display." 
      item-value="id" 
      show-expand
      @click:row="rowSelected" 
      :items-per-page-options="[
        { value: parseInt(nofItems), title: nofItems },
        { value: 2 * parseInt(nofItems), title: (2 * parseInt(nofItems)).toString() }
      ]"
    >

      <!-- appointment info -->
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template #item.participantInfo="{ item }">
        <v-container class="d-flex align-center flex-wrap pa-0">
          <div class="text-start" v-html="apptInfo(item)"></div>
          <v-spacer></v-spacer>
          <v-divider class="my-2" style="flex: 0 0 100%;"></v-divider>

          <div class="text-start" v-html="parentContact(item.Family)"></div>
          <v-spacer></v-spacer>

          <div class="text-start" v-html="familyID(item.Family)"></div>

          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-account-details-outline" variant="text" size="small" density="compact"
                color="primary" class="ml-2" @click.stop="$emit('showFamily', item.Family)"></v-btn>
            </template>
            <span>View Family Details</span>
          </v-tooltip>
        </v-container>
      </template>

      <!-- appointment time -->
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template #item.AppointmentTime="{ item }">
        <DateDisplay :date="item.AppointmentTime" format="long" :status="item.Status" style="font-weight: 500;" />
        <div class="labTag">{{ "Lab: " + (item.Appointments && item.Appointments[0] ? item.Appointments[0].Study.Lab.PI : 'Unknown') }}</div>
      </template>

      <!-- appointment status -->
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template #item.Status="{ item }">
        <v-chip :color="getColor(item.Status, item.Completed)" class="text-white">
          {{ item.Status === "Confirmed" && item.Completed ? "Completed" : item.Status }}
        </v-chip>
      </template>

      <!-- action buttons -->
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template #item.actions="{ item }">
        <v-container class="d-flex align-center justify-center flex-wrap pa-0">
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <div v-bind="props" class="align-self-end">
                <v-btn 
                  variant="outlined" 
                  icon="mdi-autorenew"
                  @click.stop="showDialog(item, 'schedule')" 
                  class="tableIcon"
                  :disabled="item.Status === 'Confirmed' && item.Completed === true"
                ></v-btn>
              </div>
            </template>
            <span>Update the current appointment</span>
          </v-tooltip>

          <v-divider class="mx-4" vertical></v-divider>

          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <div v-bind="props" class="align-self-end">
                <v-btn 
                  variant="outlined" 
                  icon="mdi-email"
                  class="tableIcon" 
                  @click.stop="showDialog(item, 'email')"
                  :disabled="item.Status === 'Confirmed' && item.Completed === true"
                ></v-btn>
              </div>
            </template>
            <span>Email the family regarding the current appointment</span>
          </v-tooltip>
        </v-container>
      </template>

      <!-- expand box -->
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <v-container class="d-flex" style="width: 100%">
              <div class="text-start detailBox" style="flex: 0 0 30%" v-for="(appointment, idx) in experimenterInfo(item)" :key="idx" v-html="appointment"></div>
              <v-divider class="mx-4" v-show="item.Note" vertical></v-divider>

              <div class="text-start detailBox" v-html="'<strong>Note:</strong><br>' + item.Note" v-show="item.Note" style="flex: 0 0 40%"></div>
              <v-spacer></v-spacer>
            </v-container>
          </td>
        </tr>
      </template>
    </v-data-table>

    <!-- Dialog Component, to create or update a schedule -->
    <scheduleDialog 
      ref="scheduleDialogComponent" 
      :dialog="dialog" 
      :currentSchedule="currentSchedule" 
      :dialogType="dialogType"
      :currentFamily="currentSchedule.Family" 
      :scheduleType="scheduleType" 
      @close-dialog="closeDialog"
      @newAppointment="addAppointment" 
      @deleteCurrentAppointment="deleteCurrentAppointment" 
      @newSchedule="addSchedule"
      @updatedSchedule="updatedSchedule" 
      @completedSchedule="completedSchedule" 
    />
  </div>
</template>

<script>
import scheduleDialog from '@/components/scheduleDialog.vue';
import DateDisplay from '@/components/DateDisplay.vue';
import { childAge, childStudyAge } from '@/assets/JS/displayFunctions.js';

export default {
  name: "ScheduleTableNew",
  components: {
    scheduleDialog,
    DateDisplay
  },
  props: {
    Schedules: Array,
    tableHeight: String,
    nofItems: {
      type: [String, Number],
      default: 10
    }
  },
  emits: ["rowSelected", "updatedSchedule", "showFamily"],
  data: () => ({
    dialog: false,
    dialogType: null,
    scheduleType: 'update',
    expandedRows: [],
    currentSchedule: {
      FK_Family: 1,
      Family: { NamePrimary: "" },
      Note: "",
      Appointments: [
        {
          FK_Family: 1,
          Study: { EmailTemplate: "", Lab: { PI: "" } },
          Family: { NamePrimary: "" },
          Child: { Name: "" },
        },
      ],
    },
    headers: [
      { title: "Study Time", align: "center", key: "AppointmentTime", width: "13%" },
      { title: "Participant Info", align: "center", key: "participantInfo", width: "45%" },
      { title: "Status", align: "center", key: "Status", width: "10%" },
      { title: "Actions", align: "center", key: "actions", sortable: false, width: "15%" },
    ]
  }),
  methods: {
    childAge,
    childStudyAge,

    showDialog(item, dialogType) {
      this.currentSchedule = item;
      this.dialogType = dialogType;
      this.dialog = true;

      this.$nextTick(() => {
        if (this.$refs.scheduleDialogComponent) {
          this.$refs.scheduleDialogComponent.initiateVariables(this.dialogType);

          if (this.dialogType === "email") {
            if (this.currentSchedule.Status === "Confirmed" && this.currentSchedule.Completed === true) {
              this.$refs.scheduleDialogComponent.emailType = "ThankYou";
            }

            if (["TBA", "Rescheduling", "No Show", "Cancelled"].includes(this.currentSchedule.Status)) {
              this.$refs.scheduleDialogComponent.emailType = "Follow-up";
            }
          }
        }
      });
    },

    addAppointment(appointment) {
      if (this.currentSchedule.Appointments) {
        this.currentSchedule.Appointments.push(appointment);
      }
    },

    deleteCurrentAppointment(index) {
      if (this.currentSchedule.Appointments) {
        this.currentSchedule.Appointments.splice(index, 1);
      }
    },

    addSchedule(schedule) {
      this.$emit("updatedSchedule", schedule);
    },

    updatedSchedule(schedule) {
      this.$emit("updatedSchedule", schedule);
    },

    completedSchedule(schedule) {
      this.$emit("updatedSchedule", schedule);
    },

    parentContact(Family) {
      if (!Family) return "";
      let formated = "<strong>Parent: </strong>" + Family.NamePrimary + '<br>';
      formated += "<strong>Phone: </strong>" + this.PhoneFormated(Family.Phone) + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Email: </strong>" + Family.Email;
      return formated;
    },

    familyID(Family) {
      if (!Family) return "";
      return "<span style='font-size: 18px; font-weight: 700;''>family ID: " + Family.id + "</span>"
    },

    apptInfo(item) {
      if (!item || !item.Appointments) return "";
      let apptInfoArray = [];

      item.Appointments.forEach((appointment, index) => {
        let appointmentInfo = "<strong>" + (index + 1) + ". </strong> ";
        let age = "";
        
        if (item.AppointmentTime) {
          age = this.childStudyAge(appointment.Child, item.AppointmentTime);
        } else {
          age = this.childAge(appointment.Child);
        }

        const childInfo = "<span style='font-size: 20px; font-weight: 700'>" + appointment.Child.Name + "</span> (" + age + ", " + appointment.Child.Sex + ")";

        appointmentInfo += childInfo + " <b style='font-size: 20px;'><i>==>  " + (appointment.Study ? appointment.Study.StudyName : 'Unknown') + "</i></b><br>";
        apptInfoArray.push(appointmentInfo);
      });

      return apptInfoArray.join('');
    },

    ExperimentersNames(appointment, index) {
      let testingRoomLocation = "<strong>Room: </strong> NA";

      let E1 = "not assigned";
      if (appointment.PrimaryExperimenter && appointment.PrimaryExperimenter.length > 0) {
        E1 = appointment.PrimaryExperimenter[0].Name;
      }

      let E22 = "not assigned";
      if (appointment.SecondaryExperimenter && appointment.SecondaryExperimenter.length > 0) {
        let E2 = appointment.SecondaryExperimenter.map(exp => exp.Name);
        E22 = E2.join(", ");
      }

      let body = "<strong>Appt. " + (index + 1) + ": </strong>" +
        (appointment.Study ? appointment.Study.StudyName : 'Unknown') +
        "</strong> (" + (appointment.Study ? appointment.Study.StudyType : 'Unknown') + ")" +
        "<br>" + testingRoomLocation +
        "<br><strong>E1:</strong> " + E1 +
        "<br><strong>E2:</strong> " + E22;

      if (appointment.PrimaryExperimenter && appointment.PrimaryExperimenter.length > 0 && 
          appointment.Study && appointment.Study.StudyType === "Online" && 
          appointment.PrimaryExperimenter[0].ZoomLink) {
        body += "<br><strong><a href='" + appointment.PrimaryExperimenter[0].ZoomLink + "' target='_blank'>Zoom Link</a></strong>";
      }

      return body;
    },

    experimenterInfo(item) {
      if (!item || !item.Appointments) return [];
      return item.Appointments.map((appointment, index) => {
        return this.ExperimentersNames(appointment, index);
      });
    },

    PhoneFormated(Phone) {
      if (Phone) {
        let cleaned = ("" + Phone).replace(/\D/g, "");
        let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
          return "(" + match[1] + ") " + match[2] + "-" + match[3];
        }
      }
      return null;
    },

    getColor(status, completed) {
      let color = "";
      switch (status) {
        case "Completed": color = "#01579B"; break;
        case "Confirmed": color = completed ? "#01579B" : "light-blue-accent-2"; break;
        case "TBD": color = "teal-darken-2"; break;
        case "Rescheduling": color = "lime-darken-3"; break;
        case "No Show": color = "orange-darken-3"; break;
        case "Cancelled": color = "deep-orange-darken-1"; break;
        case "Rejected": color = "blue-grey-darken-4"; break;
      }
      return color;
    },

    rowSelected(event, { item }) {
      if (item) {
        this.$emit("rowSelected", item.Family, this.Schedules.indexOf(item));
        this.toggleExpand(item);
      }
    },

    toggleExpand(item) {
      const index = this.expandedRows.indexOf(item.id);
      if (index === -1) {
        this.expandedRows.push(item.id);
      } else {
        this.expandedRows.splice(index, 1);
      }
    },

    closeDialog() {
      this.dialog = false;
      this.dialogType = null;
    }
  }
};
</script>

<style scoped>
.detailBox {
  color: rgb(var(--v-theme-primary));
  margin: 8px !important;
}

.labTag {
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
  border-radius: 10px;
}
</style>
