<template>
  <v-container fluid>
    <div v-if="!$store.state.labEmailStatus">
      <v-alert
        border="left"
        type="error"
        color="#c73460"
        dense
        style="font-weight: 600"
        >Lab email is not been setup properly. Please set it up in the Settings
        page.</v-alert
      >
    </div>
    <div v-if="!$store.state.adminEmailStatus">
      <v-alert
        border="left"
        type="warning"
        color="#c7792c"
        dense
        style="font-weight: 600"
        >Admin email is not been setup properly. Please set it up in the
        Settings page.</v-alert
      >
    </div>
    <div v-if="$store.state.trainingMode">
      <v-alert
        border="left"
        type="warning"
        color="#c7792c"
        dense
        style="font-weight: 600"
        >You are running in a training mode.</v-alert
      >
    </div>

    <v-row justify="start">
      <v-col cols="12" md="2" v-for="item in searchingFields" :key="item.label">
        <v-text-field
          @keydown.enter="searchSchedule"
          :label="item.label"
          v-model="queryString[item.field]"
          append-icon="mdi-magnify"
          height="48px"
          background-color="textbackground"
          hide-details
          outlined
          dense
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row justify="start">
      <v-col cols="12" md="2">
        <v-select
          @blur="searchSchedule"
          v-model="queryString.StudyName"
          :items="$store.state.studies"
          :item-value="'id'"
          :item-text="'StudyName'"
          label="Study Name"
          append-icon="mdi-magnify"
          height="48px"
          multiple
          background-color="textbackground"
          hide-details
          outlined
          dense
          chip
        ></v-select>
      </v-col>
      <v-col cols="12" md="2">
        <v-select
          @blur="searchScheduleByStatus"
          v-model="queryString.Status"
          :items="Status"
          label="Status"
          multiple
          append-icon="mdi-magnify"
          height="48px"
          background-color="textbackground"
          hide-details
          outlined
          dense
          chip
        ></v-select>
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          @keydown.enter="searchSchedule"
          ref="textfieldAfter"
          label="After"
          v-model="queryString.AppointmentTimeAfter"
          append-icon="event"
          @click:append="dialogPickerAfter = true"
          height="48px"
          background-color="textbackground"
          hide-details
          outlined
          dense
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          @keydown.enter="searchSchedule"
          ref="textfieldBefore"
          label="Before"
          v-model="queryString.AppointmentTimeBefore"
          append-icon="event"
          @click:append="dialogPickerBefore = true"
          height="48px"
          background-color="textbackground"
          hide-details
          outlined
          dense
        ></v-text-field>
      </v-col>
      <!-- <v-spacer></v-spacer> -->
      <v-col cols="12" md="2">
        <v-btn-toggle dark>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-btn
                  style="color: var(--v-secondary-base);
  background-color: var(--v-primary-base) !important;"
                  large
                  @click="studiesInaPeriod('today')"
                >
                  <v-icon
                    style="color: var(--v-secondary-base);
  background-color: var(--v-primary-base) !important;"
                    >today</v-icon
                  >
                </v-btn>
              </div>
            </template>
            <span>Today's studies.</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-btn
                  style="color: var(--v-secondary-base);
  background-color: var(--v-primary-base) !important;"
                  large
                  @click="studiesInaPeriod('tomorrow')"
                >
                  <v-icon
                    style="color: var(--v-secondary-base);
  background-color: var(--v-primary-base) !important;"
                    >event</v-icon
                  >
                </v-btn>
              </div>
            </template>
            <span>Tomorrow's studies</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-btn
                  style="color: var(--v-secondary-base);
  background-color: var(--v-primary-base) !important;"
                  large
                  @click="studiesInaPeriod('thisWeek')"
                >
                  <v-icon
                    style="color: var(--v-secondary-base);
  background-color: var(--v-primary-base) !important;"
                    >date_range</v-icon
                  >
                </v-btn>
              </div>
            </template>
            <span>Studies within this week</span>
          </v-tooltip>
        </v-btn-toggle>

        <!-- <v-btn large @click="studiesInaPeriod('today')">Today's Studies</v-btn>
      </v-col>
      <v-col cols="12" md="1">
        <v-btn large @click="studiesInaPeriod('tomorrow')"
          >Tomorrow's Studies</v-btn
        >
      </v-col>
      <v-col cols="12" md="2">
        <v-btn large @click="studiesInaPeriod('thisWeek')"
          >This week's Studies</v-btn
        > -->
      </v-col>
    </v-row>

    <v-row justify="center" style="padding-top: 28px">
      <v-col cols="12" md="9">
        <ScheduleTable
          :Schedules="Schedules"
          :studyTimeSlots="this.$studyTimeSlots"
          @rowSelected="updateFamily"
          tableHeight="720px"
        ></ScheduleTable>
      </v-col>
      <v-col cols="12" md="3">
        <template>
          <FamilyInfo
            :currentFamily="currentFamily"
            @updateFamily="updateCurrentFamily"
          ></FamilyInfo>
        </template>
      </v-col>
    </v-row>

    <div>
      <v-dialog v-model="dialogPickerBefore" max-width="290px">
        <v-card outlined>
          <v-date-picker
            v-model="queryString.AppointmentTimeBefore"
            show-current
            @click:date="beforeDatePick"
          ></v-date-picker>
        </v-card>
      </v-dialog>
    </div>

    <div>
      <v-dialog v-model="dialogPickerAfter" max-width="290px">
        <v-card outlined>
          <v-date-picker
            v-model="queryString.AppointmentTimeAfter"
            show-current
            @click:date="afterDatePick"
          ></v-date-picker>
        </v-card>
      </v-dialog>
    </div>
  </v-container>
</template>

<script>
import ScheduleTable from "@/components/ScheduleTable";
import FamilyInfo from "@/components/FamilyInfo";

// import family from "@/services/family";
import schedule from "@/services/schedule";

export default {
  components: {
    ScheduleTable,
    FamilyInfo,
  },
  props: {
    training: Boolean,
  },
  data() {
    return {
      dialogPickerBefore: false,
      dialogPickerAfter: false,
      currentFamily: {},
      queryString: {
        FamilyId: null,
        Email: null,
        Phone: null,
        NamePrimary: null,
        NameSecondary: null,
        Status: null,
        AppointmentTimeBefore: null,
        AppointmentTimeAfter: null,
      },
      defaultQueryString: {
        FamilyId: null,
        Email: null,
        Phone: null,
        NamePrimary: null,
        NameSecondary: null,
        Status: null,
        AppointmentTimeBefore: null,
        AppointmentTimeAfter: null,
      },
      Schedules: [],
      searchingFields: [
        { label: "Family ID", field: "FamilyId" },
        { label: "Email", field: "Email" },
        { label: "Phone", field: "Phone" },
        { label: "Primary Caregiver", field: "NamePrimary" },
        { label: "Secondary Caregiver", field: "NameSecondary" },
        // { label: "Study Name", field: "StudyName"},
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
    async searchSchedule() {
      this.$store.dispatch("setLoadingStatus", true);

      this.queryString.trainingMode = this.$store.state.trainingMode;

      try {
        const Result = await schedule.search(this.queryString);
        this.Schedules = Result.data;

        if (this.Schedules.length == 0) {
          alert("No study appointment can be found. Sorry~");
        }
      } catch (error) {
        if (error.response.status === 401) {
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

    async searchScheduleByStatus() {
      this.$store.dispatch("setLoadingStatus", true);

      this.queryString.trainingMode = this.$store.state.trainingMode;

      if (this.queryString.Status) {
        try {
          const Result = await schedule.search(this.queryString);
          this.Schedules = Result.data;
          if (this.Schedules.length == 0) {
            alert("No study appointment can be found. Sorry~");
          }
        } catch (error) {
          if (error.response.status === 401) {
            alert("Authentication failed, please login.");
            this.$router.push({
              name: "Login",
            });
          }
        }

        this.queryString = Object.assign({}, this.defaultQueryString);
      }
      this.index = -1;
      setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 1000);
    },

    // async todayStudies() {
    //   this.$store.dispatch("setLoadingStatus", true);

    //   this.queryString.trainingMode = this.$store.state.trainingMode;

    //   try {
    //     const Result = await schedule.today(this.queryString);
    //     this.Schedules = Result.data;

    //     if (this.Schedules.length == 0) {
    //       alert("No study appointment can be found. Sorry~");
    //     }
    //   } catch (error) {
    //     if (error.response.status === 401) {
    //       alert("Authentication failed, please login.");
    //       this.$router.push({
    //         name: "Login",
    //       });
    //     } else {
    //       console.log(JSON.stringify(error.response));
    //     }
    //   }

    //   this.queryString = Object.assign({}, this.defaultQueryString);
    //   this.index = -1;
    //   setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 1000);
    // },

    async studiesInaPeriod(serchRange) {
      this.$store.dispatch("setLoadingStatus", true);

      this.queryString.trainingMode = this.$store.state.trainingMode;
      var Result = [];
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

        if (this.Schedules.length == 0) {
          alert("No study appointment can be found. Sorry~");
        }
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        } else {
          console.log(JSON.stringify(error.response));
        }
      }

      this.queryString = Object.assign({}, this.defaultQueryString);
      this.index = -1;
      setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 1000);
    },

    // async thisWeekStudies() {
    //   this.$store.dispatch("setLoadingStatus", true);

    //   this.queryString.trainingMode = this.$store.state.trainingMode;

    //   try {
    //     const Result = await schedule.week(this.queryString);
    //     this.Schedules = Result.data;
    //     if (this.Schedules.length == 0) {
    //       alert("No study appointment can be found. Sorry~");
    //     }
    //   } catch (error) {
    //     if (error.response.status === 401) {
    //       alert("Authentication failed, please login.");
    //       this.$router.push({
    //         name: "Login",
    //       });
    //     } else {
    //       console.log(JSON.stringify(error.response));
    //     }
    //   }

    //   this.queryString = Object.assign({}, this.defaultQueryString);
    //   this.index = -1;
    //   setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 1000);
    // },

    updateFamily(family, index) {
      this.index = index;
      this.currentFamily = family;
    },

    updateCurrentFamily(editedFamily) {
      this.currentFamily = Object.assign({}, editedFamily);
      this.Schedules[this.index].Family = Object.assign({}, editedFamily);
    },

    beforeDatePick() {
      this.dialogPickerBefore = false;
      setTimeout(() => {
        this.$refs.textfieldBefore.focus();
      }, 100);
    },

    afterDatePick() {
      this.dialogPickerAfter = false;
      setTimeout(() => {
        this.$refs.textfieldAfter.focus();
      }, 100);
    },
  },

  computed: {},
  watch: {
    training() {
      // console.log(`My store value for 'training' changed to ${val}`);
      this.Schedules = [];
      this.currentFamily = {};
    },
  },
};
</script>

<style lang="scss" scoped>
.theme--light.v-icon {
  color: var(--v-primary-base) !important;
}
</style>
