<template>
  <v-container fluid>
    <v-row class="grey lighten-5" style="height: 150px;" justify="start">
      <v-col cols="12" md="2" v-for="item in searchingFields" :key="item.label">
        <v-text-field
          @keydown.enter="searchAppointment"
          :label="item.label"
          v-model="queryString[item.field]"
          prepend-icon="mdi-magnify"
          clearable
          dense
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="2">
        <v-select
          @blur="searchAppointmentByStatus"
          v-model="queryString.Status"
          :items="Status"
          label="Status"
          multiple
          dense
        ></v-select>
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          @keydown.enter="searchAppointment"
          ref="textfieldAfter"
          label="After"
          v-model="queryString.AppointmentTimeAfter"
          prepend-icon="mdi-magnify"
          append-icon="event"
          @click:append="dialogPickerAfter = true"
          clearable
          dense
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          @keydown.enter="searchAppointment"
          ref="textfieldBefore"
          label="Before"
          v-model="queryString.AppointmentTimeBefore"
          prepend-icon="mdi-magnify"
          append-icon="event"
          @click:append="dialogPickerBefore = true"
          clearable
          dense
        ></v-text-field>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="12" md="2">
        <v-btn color="purple" big text @click="todayStudies"
          >Today's Studies</v-btn
        >
      </v-col>
      <v-col cols="12" md="2">
        <v-btn color="purple" big text @click="todayStudies"
          >This week's Studies</v-btn
        >
      </v-col>
    </v-row>
    <v-row class="grey lighten-5" style="height: 700px;" justify="center">
      <v-col cols="12" md="3">
        <template>
          <FamilyInfo :currentFamily="currentFamily"></FamilyInfo>
        </template>
      </v-col>
      <v-col cols="12" md="9">
        <AppointmentTable
          :Appointments="Appointments"
          @rowSelected="updateFamily"
        ></AppointmentTable>
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
import AppointmentTable from "@/components/AppointmentTable";
import FamilyInfo from "@/components/FamilyInfo";

import family from "@/services/family";
import appointment from "@/services/appointment";

export default {
  components: {
    AppointmentTable,
    FamilyInfo
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
        AppointmentTimeAfter: null
      },
      defaultQueryString: {
        FamilyId: null,
        Email: null,
        Phone: null,
        NameMom: null,
        NameDad: null,
        Status: null,
        AppointmentTimeBefore: null,
        AppointmentTimeAfter: null
      },
      Appointments: [],
      searchingFields: [
        { label: "Family ID", field: "FamilyId" },
        { label: "Email", field: "Email" },
        { label: "Phone", field: "Phone" },
        { label: "Mother's Name", field: "NameMom" },
        { label: "Father's Name", field: "NameDad" },
        { label: "Study Name", field: "StudyName" }
      ],
      Status: [
        "Confirmed",
        "TBD",
        "Rescheduling",
        "Rescheduled",
        "No Show",
        "Cancelled",
        "Rejected"
      ]
    };
  },
  methods: {
    async searchAppointment() {
      console.log(this.queryString);

      try {
        const Result = await appointment.search(this.queryString);
        this.Appointments = Result.data;
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login"
          });
        }
      }

      this.queryString = Object.assign({}, this.defaultQueryString);
    },

    async searchAppointmentByStatus() {
      if (this.queryString.Status) {
        try {
          const Result = await appointment.search(this.queryString);
          this.Appointments = Result.data;
        } catch (error) {
          if (error.response.status === 401) {
            alert("Authentication failed, please login.");
            this.$router.push({
              name: "Login"
            });
          }
        }

        this.queryString = Object.assign({}, this.defaultQueryString);
      }
    },

    async todayStudies() {
      try {
        const Result = await appointment.today();
        this.Appointments = Result.data;
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login"
          });
        } else {
          console.log(JSON.stringify(error.response));
        }
      }

      this.queryString = Object.assign({}, this.defaultQueryString);
    },

    async updateFamily(familyId) {
      var queryStringFamily = {
        id: familyId
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
    }
  },

  computed: {},
  watch: {}
};
</script>

<style lang="scss" scoped></style>
