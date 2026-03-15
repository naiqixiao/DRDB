<template>
  <v-container fluid>
    <div v-if="!$store.state.labEmailStatus" class="mb-4">
      <v-alert border="start" type="error" color="#c73460" density="compact" style="font-weight: 600">
        Lab email is not setup properly. Please set it up in the Settings page.
      </v-alert>
    </div>
    <div v-if="!$store.state.adminEmailStatus" class="mb-4">
      <v-alert border="start" type="warning" color="#c7792c" density="compact" style="font-weight: 600">
        Admin email is not setup properly. Please set it up in the Settings page.
      </v-alert>
    </div>
    <div v-if="$store.state.trainingMode" class="mb-4">
      <v-alert border="start" type="warning" color="#c7792c" density="compact" style="font-weight: 600">
        You are running in a training mode.
      </v-alert>
    </div>

    <v-row dense>
      <v-col cols="12" md="9">
        <UpcomingAppointments class="mb-4" @selectSchedule="onSelectUpcoming" />
        <v-row justify="start">
          <v-col cols="12" v-for="item in searchingFields" :md="item.width" :key="item.label">
            <v-text-field 
              @keydown.enter="searchSchedule" 
              @update:model-value="getSearchKeys(item.field, $event)" 
              :label="item.label"
              v-model="queryString[item.field]" 
              append-inner-icon="mdi-magnify" 
              bg-color="textbackground"
              hide-details 
              variant="outlined" 
              density="compact"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row justify="start">
          <v-col cols="12" md="3">
            <v-select 
              @update:model-value="getSearchKeys('StudyName', $event)" 
              v-model="queryString.StudyName"
              @keydown.enter="searchSchedule" 
              :items="$store.state.studies" 
              item-value="id" 
              item-title="StudyName"
              label="Study Name" 
              append-inner-icon="mdi-magnify" 
              multiple 
              bg-color="textbackground"
              hide-details 
              variant="outlined" 
              density="compact" 
              chips
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select 
              @update:model-value="getSearchKeys('Status', $event)" 
              v-model="queryString.Status"
              @keydown.enter="searchSchedule" 
              :items="Status" 
              label="Status" 
              multiple 
              append-inner-icon="mdi-magnify"
              bg-color="textbackground" 
              hide-details 
              variant="outlined" 
              density="compact" 
              chips
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field 
              @update:model-value="getSearchKeys('AppointmentTimeAfter', $event)" 
              @keydown.enter="searchSchedule" 
              ref="textfieldAfter"
              label="After" 
              v-model="queryString.AppointmentTimeAfter" 
              append-inner-icon="mdi-calendar"
              @click:append-inner="dialogPickerAfter = true" 
              bg-color="textbackground" 
              hide-details
              variant="outlined" 
              density="compact"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field 
              @keydown.enter="searchSchedule" 
              @update:model-value="getSearchKeys('AppointmentTimeBefore', $event)" 
              ref="textfieldBefore"
              label="Before" 
              v-model="queryString.AppointmentTimeBefore" 
              append-inner-icon="mdi-calendar"
              @click:append-inner="dialogPickerBefore = true" 
              bg-color="textbackground" 
              hide-details
              variant="outlined" 
              density="compact"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row justify="space-around">
          <v-col cols="12" md="10">
            <div class="text-center" v-html="searchNotice"></div>
          </v-col>
        </v-row>
        <v-row justify="space-around" class="align-center">
          <h2 class="ma-0">Short-cuts:</h2>
          <v-col cols="12" md="3">
            <v-btn-toggle>
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <div v-bind="props">
                    <v-btn 
                      rounded="0"
                      size="large" 
                      @click="studiesInaPeriod('today')"
                      style="color: rgb(var(--v-theme-secondary)); background-color: rgb(var(--v-theme-primary)) !important;"
                    >
                      <v-icon>mdi-calendar-today</v-icon>
                    </v-btn>
                  </div>
                </template>
                <span>Today's studies.</span>
              </v-tooltip>
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <div v-bind="props">
                    <v-btn 
                      rounded="0"
                      size="large" 
                      @click="studiesInaPeriod('tomorrow')"
                      style="color: rgb(var(--v-theme-secondary)); background-color: rgb(var(--v-theme-primary)) !important;"
                    >
                      <v-icon>mdi-calendar-arrow-right</v-icon>
                    </v-btn>
                  </div>
                </template>
                <span>Tomorrow's studies</span>
              </v-tooltip>
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <div v-bind="props">
                    <v-btn 
                      rounded="0"
                      size="large" 
                      @click="studiesInaPeriod('thisWeek')"
                      style="color: rgb(var(--v-theme-secondary)); background-color: rgb(var(--v-theme-primary)) !important;"
                    >
                      <v-icon>mdi-calendar-range</v-icon>
                    </v-btn>
                  </div>
                </template>
                <span>Studies within this week</span>
              </v-tooltip>
            </v-btn-toggle>
          </v-col>

          <v-col cols="12" md="3" class="text-center">
            <v-btn size="large" @click="followupSearch">
              <v-icon start>mdi-phone</v-icon>Follow-ups
            </v-btn>
          </v-col>

          <v-col cols="12" md="2" class="text-center">
            <v-btn 
              size="large" 
              @click="searchSchedule" 
              :disabled="!(
                queryString.Email ||
                queryString.AppointmentTimeAfter ||
                queryString.AppointmentTimeBefore ||
                queryString.Status.length > 0 ||
                queryString.StudyName.length > 0 ||
                queryString.Phone ||
                queryString.NamePrimary ||
                queryString.NameSecondary ||
                queryString.FamilyId
              )"
            >
              <v-icon start>mdi-magnify</v-icon>Search
            </v-btn>
          </v-col>
        </v-row>

        <v-row justify="center" style="padding-top: 28px">
          <v-col>
            <ScheduleTable 
              :Schedules="Schedules" 
              @rowSelected="updateFamily" 
              nofItems="6"
              @updatedSchedule="updatedSchedule"
            ></ScheduleTable>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" md="3">
        <FamilyInfo :currentFamily="currentFamily" @updateFamily="updateCurrentFamily"></FamilyInfo>
      </v-col>
    </v-row>

    <v-dialog v-model="dialogPickerBefore" max-width="360px">
      <v-card variant="outlined">
        <v-date-picker 
          v-model="beforeDateObj" 
          show-current 
          @update:model-value="beforeDatePick"
        ></v-date-picker>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogPickerAfter" max-width="360px">
      <v-card variant="outlined">
        <v-date-picker 
          v-model="afterDateObj" 
          show-current 
          @update:model-value="afterDatePick"
        ></v-date-picker>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import ScheduleTable from "@/components/ScheduleTableNew.vue";
import FamilyInfo from "@/components/FamilyInfo.vue";
import UpcomingAppointments from "@/components/UpcomingAppointments.vue";
import schedule from "@/services/schedule";
import moment from "moment";

export default {
  name: "Appointment",
  components: {
    ScheduleTable,
    FamilyInfo,
    UpcomingAppointments,
  },
  props: {
    training: Boolean,
  },
  data() {
    return {
      searchNotice: "<p style='color: #ff0000; font-weight: 600; font-size: 16px; margin: 0px;''>To facilitate your search, you could enter <i>MULTIPLE</i> search criteria (e.g., Study Name, Status, Appointment Time) before clicking Search button.<br>You could also use the short-cuts below to search for studies in a period of time.</p>",
      dialogPickerBefore: false,
      dialogPickerAfter: false,
      beforeDateObj: null,
      afterDateObj: null,
      currentFamily: {},
      queryString: {
        FamilyId: null,
        Email: null,
        Phone: null,
        NamePrimary: null,
        NameSecondary: null,
        Status: [],
        StudyName: [],
        AppointmentTimeBefore: null,
        AppointmentTimeAfter: null,
      },
      defaultQueryString: {
        FamilyId: null,
        Email: null,
        Phone: null,
        NamePrimary: null,
        NameSecondary: null,
        Status: [],
        StudyName: [],
        AppointmentTimeBefore: null,
        AppointmentTimeAfter: null,
      },
      Schedules: [],
      searchingFields: [
        { label: "Family ID", field: "FamilyId", width: 2 },
        { label: "Email", field: "Email", width: 3 },
        { label: "Phone", field: "Phone", width: 3 },
        { label: "Primary Caregiver", field: "NamePrimary", width: 2 },
        { label: "Secondary Caregiver", field: "NameSecondary", width: 2 },
      ],
      Status: [
        "Confirmed",
        "TBD",
        "Rescheduling",
        "Rescheduled",
        "No Show",
        "Cancelled",
        "Rejected",
      ],
      index: -1,
    };
  },

  methods: {
    getSearchKeys(field, value) {
      if (value !== null && value !== undefined && field) {
        this.queryString[field] = value;
      }
    },

    async searchSchedule() {
      this.$store.dispatch("setLoadingStatus", true);
      this.queryString.trainingMode = this.$store.state.trainingMode;

      try {
        const Result = await schedule.search(this.queryString);
        this.Schedules = Result.data;

        if (this.Schedules && this.Schedules.length > 0) {
          this.currentFamily = this.Schedules[0].Family;
        } else {
          this.currentFamily = {};
          alert("No study appointment can be found. Sorry~");
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        } else {
          console.error(error);
        }
      }

      this.queryString = Object.assign({}, this.defaultQueryString);
      this.index = -1;
      setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 1000);
    },

    async followupSearch() {
      this.$store.dispatch("setLoadingStatus", true);
      this.queryString.trainingMode = this.$store.state.trainingMode;

      try {
        const Result = await schedule.searchFollowUps(this.queryString);
        this.Schedules = Result.data;

        if (this.Schedules && this.Schedules.length > 0) {
          this.currentFamily = this.Schedules[0].Family;
        } else {
          this.currentFamily = {};
          alert("No study appointment can be found. Sorry~");
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        }
      }

      this.queryString = Object.assign({}, this.defaultQueryString);
      this.index = -1;
      setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 1000);
    },

    async studiesInaPeriod(serchRange) {
      this.$store.dispatch("setLoadingStatus", true);
      this.queryString.trainingMode = this.$store.state.trainingMode;
      let Result = [];
      
      try {
        switch (serchRange) {
          case "today":
            Result = await schedule.today(this.queryString);
            break;
          case "tomorrow":
            Result = await schedule.tomorrow(this.queryString);
            break;
          case "thisWeek":
            Result = await schedule.week(this.queryString);
            break;
        }
        
        this.Schedules = Result.data;

        if (this.Schedules && this.Schedules.length > 0) {
          this.currentFamily = this.Schedules[0].Family;
        } else {
          this.currentFamily = {};
          alert("No study appointment can be found. Sorry~");
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        } else {
          console.error(error);
        }
      }

      this.queryString = Object.assign({}, this.defaultQueryString);
      this.index = -1;
      setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 1000);
    },

    updatedSchedule(schedule) {
      let index = this.Schedules.findIndex((item) => item.id === schedule.id);

      if (index < 0) {
        if (this.index >= 0) {
          this.Schedules.splice(this.index, 0, schedule);
        } else {
          this.Schedules.push(schedule);
        }
      } else {
        if (schedule.Completed === 1) {
          this.Schedules[index].Completed = 1;
        } else {
          this.Schedules[index] = Object.assign(this.Schedules[index], schedule);
        }
      }
    },

    updateFamily(family, index) {
      this.index = index;
      this.currentFamily = family;
    },

    onSelectUpcoming(schedule) {
      if (schedule && schedule.Family) {
        this.currentFamily = schedule.Family;
      }
    },

    updateCurrentFamily(editedFamily) {
      this.currentFamily = Object.assign({}, editedFamily);
      if (this.index >= 0 && this.Schedules[this.index]) {
        this.Schedules[this.index].Family = Object.assign({}, editedFamily);
      }
    },

    beforeDatePick(val) {
      if (val) {
        this.queryString.AppointmentTimeBefore = moment(val).format("YYYY-MM-DD");
      }
      this.dialogPickerBefore = false;
    },

    afterDatePick(val) {
      if (val) {
        this.queryString.AppointmentTimeAfter = moment(val).format("YYYY-MM-DD");
      }
      this.dialogPickerAfter = false;
    },
  },

  watch: {
    training() {
      this.Schedules = [];
      this.currentFamily = {};
    },
  },
};
</script>

<style scoped>
</style>
