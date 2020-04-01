<template>
  <v-container fluid>
    <v-row class="grey lighten-5" style="height: 150px;" justify="space-around">
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
          v-model="queryString.Status"
          :items="Status"
          filled
          label="Status"
          @blur="searchAppointment"
          multiple
        ></v-select>
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          @keydown.enter="searchAppointment"
          label="Before"
          v-model="queryString.AppointmentTimeBefore"
          prepend-icon="mdi-magnify"
          append-icon="event"
          @click:append="dialogPickerBefore = true"
          clearable
          dense
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          @keydown.enter="searchAppointment"
          label="After"
          v-model="queryString.AppointmentTimeAfter"
          prepend-icon="mdi-magnify"
          append-icon="event"
          @click:append="dialogPickerAfter = true"
          clearable
          dense
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row class="grey lighten-5" style="height: 700px;" justify="center">
      <v-col cols="12" md="12">
        <AppointmentTable :Appointments="Appointments"></AppointmentTable>
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
                @click:date="dialogPickerBefore = false"
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
                @click:date="dialogPickerAfter = false"
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

import appointment from "@/services/appointment";
// import store from "@/store";

export default {
  components: {
    AppointmentTable
  },
  data() {
    return {
      dialogPickerBefore: false,
      dialogPickerAfter: false,
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
      try {
        const Result = await appointment.search(this.queryString);
        this.Appointments = Result.data;

        // console.log(this.Appointments);
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

  computed: {},
  watch: {}
};
</script>

<style lang="scss" scoped></style>
