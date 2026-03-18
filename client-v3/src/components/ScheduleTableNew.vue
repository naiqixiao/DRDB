<template>
  <div style="margin: 0px">
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

      <template #item.participantInfo="{ item }">
        <v-container class="pa-2">
          <div v-for="(appt, idx) in item.Appointments" :key="idx" class="mb-1">
            <strong>{{ idx + 1 }}.</strong> 
            <span class="text-subtitle-1 font-weight-bold ml-1">{{ appt.Child?.Name || 'Unknown' }}</span> 
            <span class="text-caption text-muted ml-1">
              ({{ item.AppointmentTime ? childStudyAge(appt.Child, item.AppointmentTime) : childAge(appt.Child) }}, {{ appt.Child?.Sex }})
            </span>
            <v-icon size="small" color="primary" class="mx-2">mdi-arrow-right-thick</v-icon>
            <span class="font-weight-bold text-primary">{{ appt.Study?.StudyName || 'Unknown' }}</span>
          </div>

          <v-divider class="my-2"></v-divider>

          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-body-2">
                <strong>Parent:</strong> {{ item.Family?.NamePrimary || 'Unknown' }}
              </div>
              <div class="text-caption text-muted">
                <strong>Phone:</strong> {{ PhoneFormated(item.Family?.Phone) }} &nbsp;|&nbsp; 
                <strong>Email:</strong> {{ item.Family?.Email }}
              </div>
            </div>
            
            <div class="d-flex align-center">
              <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-identifier">
                Family ID: {{ item.Family?.id }}
              </v-chip>
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-account-details-outline" variant="text" size="small" density="compact"
                    color="primary" class="ml-2" @click.stop="$emit('showFamily', item.Family)"></v-btn>
                </template>
                <span>View Family Details</span>
              </v-tooltip>
            </div>
          </div>
        </v-container>
      </template>

      <template #item.AppointmentTime="{ item }">
        <DateDisplay :date="item.AppointmentTime" format="long" :status="item.Status" style="font-weight: 500;" />
        <v-chip size="x-small" variant="outlined" color="primary" class="mt-1 font-weight-bold">
          Lab: {{ item.Appointments?.[0]?.Study?.Lab?.PI || 'Unknown' }}
        </v-chip>
      </template>

      <template #item.Status="{ item }">
        <v-chip :color="getColor(item.Status, item.Completed)" variant="outlined" class="font-weight-bold" size="default">
          {{ item.Status === "Confirmed" && item.Completed ? "Completed" : item.Status }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex align-center justify-center">
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn 
                v-bind="props"
                variant="outlined" 
                icon="mdi-autorenew"
                size="default"
                color="primary"
                @click.stop="showDialog(item, 'schedule')" 
                :disabled="item.Status === 'Confirmed' && item.Completed === true"
              ></v-btn>
            </template>
            <span>Update the current appointment</span>
          </v-tooltip>

          <v-divider vertical class="mx-3" style="height: 28px; align-self: center;"></v-divider>

          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn 
                v-bind="props"
                variant="outlined" 
                icon="mdi-email"
                size="default"
                color="secondary"
                @click.stop="showDialog(item, 'email')"
                :disabled="item.Status === 'Confirmed' && item.Completed === true"
              ></v-btn>
            </template>
            <span>Email the family regarding the current appointment</span>
          </v-tooltip>
        </div>
      </template>

      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
            <v-row>
              <v-col cols="12" md="7">
                <div v-for="(appt, idx) in item.Appointments" :key="idx" class="mb-3">
                  <div class="text-subtitle-2 font-weight-bold text-primary">
                    Appt {{ idx + 1 }}: {{ appt.Study?.StudyName || 'Unknown' }} ({{ appt.Study?.StudyType || 'Unknown' }})
                  </div>
                  <div class="text-caption">
                    <strong>E1:</strong> {{ appt.PrimaryExperimenter?.[0]?.Name || 'Not assigned' }}<br>
                    <strong>E2:</strong> {{ appt.SecondaryExperimenter?.length ? appt.SecondaryExperimenter.map(e => e.Name).join(', ') : 'Not assigned' }}
                  </div>
                  <div class="text-caption mt-1" v-if="appt.Study?.StudyType === 'Online' && appt.PrimaryExperimenter?.[0]?.ZoomLink">
                    <a :href="appt.PrimaryExperimenter[0].ZoomLink" target="_blank" class="font-weight-bold text-decoration-none">
                      <v-icon size="small" start>mdi-video</v-icon>Zoom Link
                    </a>
                  </div>
                </div>
              </v-col>
              
              <v-col cols="12" md="5" v-if="item.Note" style="border-left: 2px solid #E2E8F0;">
                <div class="text-caption font-weight-bold text-uppercase text-muted mb-1">Schedule Note</div>
                <div class="text-body-2" style="white-space: pre-wrap;">{{ item.Note }}</div>
              </v-col>
            </v-row>
          </td>
        </tr>
      </template>
    </v-data-table>

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
  components: { scheduleDialog, DateDisplay },
  props: {
    Schedules: Array,
    nofItems: { type: [String, Number], default: 10 }
  },
  emits: ["rowSelected", "updatedSchedule", "showFamily"],
  data: () => ({
    dialog: false,
    dialogType: null,
    scheduleType: 'update',
    expandedRows: [],
    currentSchedule: {
      FK_Family: 1, Family: { NamePrimary: "" }, Note: "",
      Appointments: [{ FK_Family: 1, Study: { EmailTemplate: "", Lab: { PI: "" } }, Family: { NamePrimary: "" }, Child: { Name: "" } }],
    },
    headers: [
      { title: "Study Time", align: "center", key: "AppointmentTime", width: "18%" },
      { title: "Participant Info", align: "start", key: "participantInfo", width: "42%" },
      { title: "Status", align: "center", key: "Status", width: "14%" },
      { title: "Actions", align: "center", key: "actions", sortable: false, width: "18%" },
    ]
  }),
  methods: {
    childAge, childStudyAge,
    
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
            } else if (["TBA", "Rescheduling", "No Show", "Cancelled"].includes(this.currentSchedule.Status)) {
              this.$refs.scheduleDialogComponent.emailType = "Follow-up";
            }
          }
        }
      });
    },

    PhoneFormated(Phone) {
      if (!Phone) return "N/A";
      let cleaned = ("" + Phone).replace(/\D/g, "");
      let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      return match ? `(${match[1]}) ${match[2]}-${match[3]}` : Phone;
    },

    getColor(status, completed) {
      switch (status) {
        case "Completed":
          return "#002B4D"; // very dark blue
        case "Confirmed":
          return completed ? "#002B4D" : "#004D8C"; // dark blue
        case "TBD":
          return "#003D33"; // dark teal
        case "Rescheduling":
          return "#424900"; // dark olive
        case "No Show":
          return "#8C2900"; // dark burnt orange
        case "Cancelled":
          return "#941F00"; // dark rust red
        case "Rejected":
          return "#1C272C"; // очень dark grey-blue
        default:
          return "#263238"; // dark grey fallback
      }
    },

    rowSelected(event, { item }) {
      if (item) {
        this.$emit("rowSelected", item.Family, this.Schedules.indexOf(item));
        this.toggleExpand(item);
      }
    },

    toggleExpand(item) {
      const index = this.expandedRows.indexOf(item.id);
      if (index === -1) this.expandedRows.push(item.id);
      else this.expandedRows.splice(index, 1);
    },

    closeDialog() {
      this.dialog = false;
      this.dialogType = null;
    },

    addAppointment(appointment) { if (this.currentSchedule.Appointments) this.currentSchedule.Appointments.push(appointment); },
    deleteCurrentAppointment(index) { if (this.currentSchedule.Appointments) this.currentSchedule.Appointments.splice(index, 1); },
    addSchedule(schedule) { this.$emit("updatedSchedule", schedule); },
    updatedSchedule(schedule) { this.$emit("updatedSchedule", schedule); },
    completedSchedule(schedule) { this.$emit("updatedSchedule", schedule); }
  }
};
</script>
