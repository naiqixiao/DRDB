<template>
  <v-container fluid>
    <AlertBanner :showAdminEmail="true" />
    <ConfirmDlg ref="confirmD" />

    <!-- SECTION 1: Upcoming Appointments (Collapsible) -->
    <v-card class="ds-card mb-6" variant="flat">
      <v-toolbar color="transparent" density="compact" class="px-2" style="cursor: pointer" @click="upcomingExpanded = true">
        <v-icon class="mr-2" color="primary">mdi-calendar-clock</v-icon>
        <span class="text-subtitle-1 font-weight-bold" style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">
          Upcoming Appointments
        </span>
        <v-btn
          icon="mdi-refresh"
          variant="text"
          size="small"
          @click.stop="upcomingExpanded = true; refreshUpcoming()"
          class="ml-1"
        ></v-btn>
        <v-spacer></v-spacer>
        <v-btn
          :icon="upcomingExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          variant="text"
          size="small"
          @click="upcomingExpanded = !upcomingExpanded"
        ></v-btn>
      </v-toolbar>
      <v-expand-transition>
        <div v-show="upcomingExpanded">
          <v-divider></v-divider>
          <v-card-text class="pt-3 pb-4">
            <UpcomingAppointments
              ref="upcomingRef"
              layout="horizontal"
              @selectSchedule="onSelectUpcoming"
              @showFamily="openFamilyDialog"
              @updateSchedule="openScheduleDialog"
            />
          </v-card-text>
        </div>
      </v-expand-transition>
    </v-card>

    <!-- SECTION 2: Search Appointments -->
    <v-card class="ds-card mb-6" variant="flat" @focusin="upcomingExpanded = false">
      <v-toolbar color="transparent" density="compact" class="px-2">
        <v-icon class="mr-2" color="primary">mdi-magnify</v-icon>
        <span class="text-subtitle-1 font-weight-bold" style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">
          Search Appointments
        </span>
      </v-toolbar>
      <v-divider></v-divider>
      <v-card-text class="pt-4">
        <!-- Text search fields -->
        <v-row justify="start" dense>
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

        <!-- Select and date fields -->
        <v-row justify="start" dense class="mt-2">
          <v-col cols="12" md="3">
            <v-select 
              @update:model-value="getSearchKeys('StudyName', $event)" 
              v-model="queryString.StudyName"
              @keydown.enter="searchSchedule" 
              :items="store.studies" 
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
            <v-menu v-model="dateMenuAfter" :close-on-content-click="false" location="bottom start">
              <template v-slot:activator="{ props: menuProps }">
                <v-text-field
                  @update:model-value="getSearchKeys('AppointmentTimeAfter', $event)"
                  @keydown.enter="searchSchedule"
                  ref="textfieldAfter"
                  label="After"
                  v-model="queryString.AppointmentTimeAfter"
                  bg-color="textbackground"
                  hide-details
                  variant="outlined"
                  density="compact"
                  placeholder="YYYY-MM-DD"
                >
                  <template v-slot:append-inner>
                    <v-icon v-bind="menuProps" style="cursor:pointer">mdi-calendar</v-icon>
                  </template>
                </v-text-field>
              </template>
              <v-date-picker
                v-model="datePickerAfter"
                @update:model-value="onDatePickerAfter"
                hide-header
                show-adjacent-months
              ></v-date-picker>
            </v-menu>
          </v-col>
          <v-col cols="12" md="3">
            <v-menu v-model="dateMenuBefore" :close-on-content-click="false" location="bottom start">
              <template v-slot:activator="{ props: menuProps }">
                <v-text-field
                  @keydown.enter="searchSchedule"
                  @update:model-value="getSearchKeys('AppointmentTimeBefore', $event)"
                  ref="textfieldBefore"
                  label="Before"
                  v-model="queryString.AppointmentTimeBefore"
                  bg-color="textbackground"
                  hide-details
                  variant="outlined"
                  density="compact"
                  placeholder="YYYY-MM-DD"
                >
                  <template v-slot:append-inner>
                    <v-icon v-bind="menuProps" style="cursor:pointer">mdi-calendar</v-icon>
                  </template>
                </v-text-field>
              </template>
              <v-date-picker
                v-model="datePickerBefore"
                @update:model-value="onDatePickerBefore"
                hide-header
                show-adjacent-months
              ></v-date-picker>
            </v-menu>
          </v-col>
        </v-row>

        <!-- Tip notice -->
        <v-alert type="info" variant="tonal" density="compact" class="mt-4 mb-2" border="start" closable>
          Enter <strong>multiple</strong> search criteria (e.g., Study Name, Status, Appointment Time) before clicking Search. You can also use the shortcuts below.
        </v-alert>

        <!-- Shortcut buttons row -->
        <div class="d-flex flex-wrap align-center mt-3" style="gap: 10px;">
          <span class="text-caption font-weight-bold text-uppercase text-muted mr-1">Quick search:</span>

          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" variant="tonal" color="primary" size="small" prepend-icon="mdi-calendar-today" @click="studiesInaPeriod('today')">
                Today
              </v-btn>
            </template>
            <span>Today's studies</span>
          </v-tooltip>

          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" variant="tonal" color="primary" size="small" prepend-icon="mdi-calendar-arrow-right" @click="studiesInaPeriod('tomorrow')">
                Tomorrow
              </v-btn>
            </template>
            <span>Tomorrow's studies</span>
          </v-tooltip>

          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" variant="tonal" color="primary" size="small" prepend-icon="mdi-calendar-range" @click="studiesInaPeriod('thisWeek')">
                This Week
              </v-btn>
            </template>
            <span>Studies within this week</span>
          </v-tooltip>

          <v-btn variant="tonal" color="secondary" size="small" prepend-icon="mdi-phone-clock" @click="followupSearch">
            Follow-ups
          </v-btn>

          <v-spacer></v-spacer>

          <v-btn 
            color="primary" 
            variant="flat" 
            prepend-icon="mdi-magnify" 
            @click="searchSchedule" 
            :disabled="isSearchDisabled"
          >
            Search
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- RESULTS TABLE -->
    <v-card class="ds-card mb-6" variant="flat" v-if="Schedules.length > 0">
      <v-toolbar color="transparent" density="compact" class="px-2">
        <v-icon class="mr-2" color="primary">mdi-table</v-icon>
        <span class="text-subtitle-1 font-weight-bold" style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">
          Results
        </span>
        <v-chip class="ml-3" size="small" variant="tonal" color="primary">
          Showing {{ currentScheduleResultStart }}-{{ currentScheduleResultEnd }} of {{ scheduleSearchTotal }}
        </v-chip>
        <v-chip class="ml-2" size="small" variant="outlined" color="primary">
          Page {{ currentScheduleResultsPage }} / {{ totalScheduleResultPages }}
        </v-chip>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-page-first" variant="text" density="comfortable" @click="previousScheduleResultsPage"
          :disabled="!hasPreviousScheduleResultsPage"></v-btn>
        <v-btn icon="mdi-page-next" variant="text" density="comfortable" @click="nextScheduleResultsPage"
          :disabled="!hasNextScheduleResultsPage"></v-btn>
      </v-toolbar>
      <v-divider></v-divider>
      <v-alert v-if="showScheduleRefineHint" type="warning" variant="tonal" density="compact" border="start" class="ma-4 mb-0">
        This search returned {{ scheduleSearchTotal }} appointments. Refine the search filters if you need a narrower result set.
      </v-alert>
      <v-card-text class="pa-0">
        <ScheduleTable 
          :Schedules="Schedules" 
          @rowSelected="updateFamily" 
          nofItems="6"
          @updatedSchedule="updatedSchedule"
          @showFamily="openFamilyDialog"
        ></ScheduleTable>
      </v-card-text>
    </v-card>

    <!-- Family Details Dialog -->
    <FamilyDetailsDialog v-model="familyDialogVisible" :family="familyDialogData" />

    <!-- Schedule Update Dialog (for upcoming cards) -->
    <scheduleDialog 
      ref="upcomingScheduleDialog" 
      :dialog="scheduleDialogVisible" 
      :currentSchedule="scheduleDialogData"
      :dialogType="'schedule'" 
      :currentFamily="scheduleDialogData.Family" 
      scheduleType="update"
      @close-dialog="scheduleDialogVisible = false"
      @newAppointment="onNewAppointment" 
      @deleteCurrentAppointment="onDeleteAppointment" 
      @newSchedule="updatedSchedule"
      @updatedSchedule="updatedSchedule" 
      @completedSchedule="updatedSchedule" 
    />
  </v-container>
</template>

<script>
import ScheduleTable from "@/components/ScheduleTableNew.vue";
import UpcomingAppointments from "@/components/UpcomingAppointments.vue";
import AlertBanner from "@/components/AlertBanner.vue";
import FamilyDetailsDialog from "@/components/FamilyDetailsDialog.vue";
import scheduleDialog from "@/components/scheduleDialog.vue";
import ConfirmDlg from "@/components/ConfirmDialog.vue";
import schedule from "@/services/schedule";
import moment from "moment";
import { useMainStore } from "@/stores/mainStore";

export default {
  name: "Appointment",
  components: {
    ScheduleTable,
    UpcomingAppointments,
    AlertBanner,
    FamilyDetailsDialog,
    scheduleDialog,
    ConfirmDlg,
  },
  setup() {
    const store = useMainStore();
    return { store };
  },
  props: {
    training: Boolean,
  },
  data() {
    return {
      upcomingExpanded: true,
      familyDialogVisible: false,
      familyDialogData: {},
      scheduleDialogVisible: false,
      scheduleDialogData: {
        FK_Family: 1,
        Family: { NamePrimary: "" },
        Note: "",
        Appointments: [{
          FK_Family: 1,
          Study: { EmailTemplate: "", Lab: { PI: "" } },
          Family: { NamePrimary: "" },
          Child: { Name: "" },
        }],
      },

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
      dateMenuAfter: false,
      dateMenuBefore: false,
      datePickerAfter: null,
      datePickerBefore: null,
      Schedules: [],
      scheduleSearchLimit: 100,
      scheduleSearchOffset: 0,
      scheduleSearchTotal: 0,
      scheduleSearchActive: false,
      scheduleResultsMode: null,
      lastScheduleQuery: null,
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
    openFamilyDialog(family) {
      if (family) {
        this.familyDialogData = family;
        this.familyDialogVisible = true;
      }
    },

    refreshUpcoming() {
      if (this.$refs.upcomingRef) {
        this.$refs.upcomingRef.fetchUpcoming();
      }
    },

    openScheduleDialog(scheduleItem) {
      this.scheduleDialogData = scheduleItem;
      this.scheduleDialogVisible = true;

      this.$nextTick(() => {
        if (this.$refs.upcomingScheduleDialog) {
          this.$refs.upcomingScheduleDialog.initiateVariables('schedule');
        }
      });
    },

    onNewAppointment(appointment) {
      if (this.scheduleDialogData.Appointments) {
        this.scheduleDialogData.Appointments.push(appointment);
      }
    },

    onDeleteAppointment(index) {
      if (this.scheduleDialogData.Appointments) {
        this.scheduleDialogData.Appointments.splice(index, 1);
      }
    },

    getSearchKeys(field, value) {
      if (value !== null && value !== undefined && field) {
        this.queryString[field] = value;
      }
    },

    onDatePickerAfter(date) {
      if (!date) return;
      const d = new Date(date);
      const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      this.queryString.AppointmentTimeAfter = formatted;
      this.getSearchKeys('AppointmentTimeAfter', formatted);
      this.dateMenuAfter = false;
    },

    onDatePickerBefore(date) {
      if (!date) return;
      const d = new Date(date);
      const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      this.queryString.AppointmentTimeBefore = formatted;
      this.getSearchKeys('AppointmentTimeBefore', formatted);
      this.dateMenuBefore = false;
    },

    resetScheduleSearchState() {
      this.scheduleSearchLimit = 100;
      this.scheduleSearchOffset = 0;
      this.scheduleSearchTotal = 0;
      this.scheduleSearchActive = false;
      this.scheduleResultsMode = null;
      this.lastScheduleQuery = null;
    },

    resetScheduleSearchForm() {
      this.queryString = Object.assign({}, this.defaultQueryString);
      this.queryString.Status = [];
      this.queryString.StudyName = [];
      this.index = -1;
    },

    async loadScheduleResults(mode, offset = 0) {
      const requestParams = {
        ...(this.lastScheduleQuery || {}),
        trainingMode: this.store.trainingMode,
        limit: this.scheduleSearchLimit,
        offset,
      };

      let result;
      switch (mode) {
        case "followups":
          result = await schedule.searchFollowUps(requestParams);
          break;
        case "today":
          result = await schedule.today(requestParams);
          break;
        case "tomorrow":
          result = await schedule.tomorrow(requestParams);
          break;
        case "thisWeek":
          result = await schedule.week(requestParams);
          break;
        default:
          result = await schedule.search(requestParams);
          break;
      }

      const payload = result.data || {};
      this.Schedules = payload.schedules || [];

      const pagination = payload.pagination || {};
      this.scheduleSearchLimit = pagination.limit || this.scheduleSearchLimit;
      this.scheduleSearchOffset = pagination.offset || 0;
      this.scheduleSearchTotal = pagination.total || 0;
      this.scheduleSearchActive = true;
      this.scheduleResultsMode = mode;

      if (!this.Schedules || this.Schedules.length === 0) {
        this.$refs.confirmD.open('No Results', 'No study appointment can be found. Sorry~', { color: 'warning', noconfirm: true });
      }
    },

    async searchSchedule() {
      this.store.setLoadingStatus(true);

      try {
        this.lastScheduleQuery = { ...this.queryString };
        await this.loadScheduleResults("search", 0);
      } catch (error) {
        if (error.response?.status !== 401) console.error(error);
      }

      this.resetScheduleSearchForm();
      setTimeout(() => this.store.setLoadingStatus(false), 1000);
    },

    async followupSearch() {
      this.store.setLoadingStatus(true);

      try {
        this.lastScheduleQuery = {};
        await this.loadScheduleResults("followups", 0);
      } catch (error) {
        if (error.response?.status !== 401) console.error(error);
      }

      this.resetScheduleSearchForm();
      setTimeout(() => this.store.setLoadingStatus(false), 1000);
    },

    async studiesInaPeriod(serchRange) {
      this.store.setLoadingStatus(true);
      
      try {
        this.lastScheduleQuery = {};
        await this.loadScheduleResults(serchRange, 0);
      } catch (error) {
        if (error.response?.status !== 401) console.error(error);
      }

      this.resetScheduleSearchForm();
      setTimeout(() => this.store.setLoadingStatus(false), 1000);
    },

    async nextScheduleResultsPage() {
      if (!this.hasNextScheduleResultsPage || !this.scheduleResultsMode) return;
      this.store.setLoadingStatus(true);
      try {
        await this.loadScheduleResults(this.scheduleResultsMode, this.scheduleSearchOffset + this.scheduleSearchLimit);
      } catch (error) {
        if (error.response?.status !== 401) console.error(error);
      }
      setTimeout(() => this.store.setLoadingStatus(false), 1000);
    },

    async previousScheduleResultsPage() {
      if (!this.hasPreviousScheduleResultsPage || !this.scheduleResultsMode) return;
      this.store.setLoadingStatus(true);
      try {
        await this.loadScheduleResults(this.scheduleResultsMode, Math.max(0, this.scheduleSearchOffset - this.scheduleSearchLimit));
      } catch (error) {
        if (error.response?.status !== 401) console.error(error);
      }
      setTimeout(() => this.store.setLoadingStatus(false), 1000);
    },

    updatedSchedule(schedule) {
      let index = this.Schedules.findIndex((item) => item.id === schedule.id);

      if (index >= 0) {
        if (schedule.Completed === 1) {
          this.Schedules[index].Completed = 1;
        } else {
          Object.assign(this.Schedules[index], schedule);
        }
      }

      // Refresh upcoming appointments if the component is available
      if (this.$refs.upcomingRef) {
        this.$refs.upcomingRef.fetchUpcoming();
      }
    },

    updateFamily(family, index) {
      this.index = index;
      this.openFamilyDialog(family);
    },

    onSelectUpcoming(schedule) {
      if (schedule && schedule.Family) {
        this.openFamilyDialog(schedule.Family);
      }
    },


  },

  computed: {
    currentScheduleResultStart() {
      if (!this.scheduleSearchActive || this.Schedules.length === 0) return 0;
      return this.scheduleSearchOffset + 1;
    },
    currentScheduleResultEnd() {
      if (!this.scheduleSearchActive || this.Schedules.length === 0) return 0;
      return this.scheduleSearchOffset + this.Schedules.length;
    },
    currentScheduleResultsPage() {
      if (!this.scheduleSearchActive) return 0;
      return Math.floor(this.scheduleSearchOffset / this.scheduleSearchLimit) + 1;
    },
    totalScheduleResultPages() {
      if (!this.scheduleSearchActive) return 0;
      return Math.ceil(this.scheduleSearchTotal / this.scheduleSearchLimit);
    },
    hasPreviousScheduleResultsPage() {
      return this.scheduleSearchActive && this.scheduleSearchOffset > 0;
    },
    hasNextScheduleResultsPage() {
      return this.scheduleSearchActive && this.currentScheduleResultEnd < this.scheduleSearchTotal;
    },
    showScheduleRefineHint() {
      return this.scheduleSearchActive && this.scheduleSearchTotal > 300;
    },
    isSearchDisabled() {
      const q = this.queryString;
      return !(
        q.Email || q.AppointmentTimeAfter || q.AppointmentTimeBefore ||
        q.Status.length > 0 || q.StudyName.length > 0 || q.Phone ||
        q.NamePrimary || q.NameSecondary || q.FamilyId
      );
    },
  },

  watch: {
    training() {
      this.Schedules = [];
      this.resetScheduleSearchState();
    },
  },
};
</script>

<style scoped>
</style>
