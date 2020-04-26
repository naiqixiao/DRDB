<template>
  <v-container fluid>
    <v-row justify="start">
      <v-col cols="12" md="2" v-for="item in searchingFields" :key="item.label">
        <v-text-field
          @keydown.enter="searchSchedule"
          :label="item.label"
          v-model="queryString[item.field]"
          prepend-icon="mdi-magnify"
          dense
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="2">
        <v-select
          @blur="searchScheduleByStatus"
          v-model="queryString.Status"
          prepend-icon="mdi-magnify"
          :items="Status"
          label="Status"
          multiple
          dense
        ></v-select>
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          @keydown.enter="searchSchedule"
          ref="textfieldAfter"
          label="After"
          v-model="queryString.AppointmentTimeAfter"
          prepend-icon="mdi-magnify"
          append-icon="event"
          @click:append="dialogPickerAfter = true"
          dense
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          @keydown.enter="searchSchedule"
          ref="textfieldBefore"
          label="Before"
          v-model="queryString.AppointmentTimeBefore"
          prepend-icon="mdi-magnify"
          append-icon="event"
          @click:append="dialogPickerBefore = true"
          dense
        ></v-text-field>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="12" md="2">
        <v-btn large @click="todayStudies"
          >Today's Studies</v-btn
        >
      </v-col>
      <v-col cols="12" md="2">
        <v-btn large @click="thisWeekStudies"
          >This week's Studies</v-btn
        >
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="12" md="3">
        <template>
          <FamilyInfo :currentFamily="currentFamily"></FamilyInfo>
        </template>
      </v-col>
      <v-col cols="12" md="9">
        <ScheduleTable
          :Schedules="Schedules"
          :studyTimeSlots="this.$studyTimeSlots"
          @rowSelected="updateFamily"
        ></ScheduleTable>
      </v-col>
    </v-row>

    <div>
      <v-dialog v-model="dialogPickerBefore" max-width="360px">
        <v-card>
          <v-row align="center">
            <v-col cols="12" lg="12">
              <v-date-picker
                v-model="queryString.AppointmentTimeBefore"
                show-current
                @click:date="beforeDatePick"
              ></v-date-picker>
            </v-col>
          </v-row>
        </v-card>
      </v-dialog>
    </div>

    <div>
      <v-dialog v-model="dialogPickerAfter" max-width="360px">
        <v-card>
          <v-row align="center">
            <v-col cols="12" lg="12">
              <v-date-picker
                v-model="queryString.AppointmentTimeAfter"
                show-current
                @click:date="afterDatePick"
              ></v-date-picker>
            </v-col>
          </v-row>
        </v-card>
      </v-dialog>
    </div>
  </v-container>
</template>

<script>
import ScheduleTable from "@/components/ScheduleTable";
import FamilyInfo from "@/components/FamilyInfo";

import family from "@/services/family";
import schedule from "@/services/schedule";

export default {
  components: {
    ScheduleTable,
    FamilyInfo,
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
        NameMom: null,
        NameDad: null,
        Status: null,
        AppointmentTimeBefore: null,
        AppointmentTimeAfter: null,
      },
      defaultQueryString: {
        FamilyId: null,
        Email: null,
        Phone: null,
        NameMom: null,
        NameDad: null,
        Status: null,
        AppointmentTimeBefore: null,
        AppointmentTimeAfter: null,
      },
      Schedules: [],
      searchingFields: [
        { label: "Family ID", field: "FamilyId" },
        { label: "Email", field: "Email" },
        { label: "Phone", field: "Phone" },
        { label: "Mother's Name", field: "NameMom" },
        { label: "Father's Name", field: "NameDad" },
        { label: "Study Name", field: "StudyName" },
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
    };
  },

  methods: {
    async searchSchedule() {
      try {
        const Result = await schedule.search(this.queryString);
        this.Schedules = Result.data;
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        }
      }

      this.queryString = Object.assign({}, this.defaultQueryString);
    },

    async searchScheduleByStatus() {
      if (this.queryString.Status) {
        try {
          const Result = await schedule.search(this.queryString);
          this.Schedules = Result.data;
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
    },

    async todayStudies() {
      try {
        const Result = await schedule.today();
        this.Schedules = Result.data;
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
    },

    async thisWeekStudies() {
      try {
        const Result = await schedule.week();
        this.Schedules = Result.data;
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
    },

    async updateFamily(familyId) {
      var queryStringFamily = {
        id: familyId,
      };
      const Results = await family.search(queryStringFamily);
      this.currentFamily = Results.data[0];
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
  watch: {},
};
</script>

<style lang="scss" scoped></style>
