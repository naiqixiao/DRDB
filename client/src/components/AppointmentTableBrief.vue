<template>
  <v-data-table
    hide-default-footer
    disable-pagination
    fixed-header
    single-select
    no-data-text="The family hasn't participated in any study or no family is selected."
    :headers="this.$headersAppointmentsBrief"
    :items="Appointments"
    class="elevation-1"
    height="450px"
    calculate-widths
  >
    <template #item.Schedule.AppointmentTime="{ item }">
      <DateDisplay
        :date="item.Schedule.AppointmentTime"
        :format="'long'"
        :status="item.Schedule.Status"
      />
    </template>
    <template #item.Schedule.updatedAt="{ item }">
      <DateDisplay
        :date="item.Schedule.updatedAt"
        :format="'short'"
        :status="item.Schedule.Status"
      />
    </template>
    <template #item.AgeByParticipation="{ item }">
      <AgeByParticipation :item="item" />
    </template>
    <template #item.Schedule.Status="{ item }">
      <v-chip
        :color="getColor(item.Schedule.Status, item.Schedule.Completed)"
        dark
      >
        {{
          item.Schedule.Status == "Confirmed" && item.Schedule.Completed
            ? "Completed"
            : item.Schedule.Status
        }}
      </v-chip>
    </template>
  </v-data-table>
</template>

<script>
import DateDisplay from "@/components/DateDisplay";
import AgeByParticipation from "@/components/AgeByParticipation";

export default {
  components: {
    DateDisplay,
    AgeByParticipation,
  },
  props: {
    Appointments: Array,
    family: Object,
  },
  data() {
    return {
      Child: {
        Name: null,
        DoB: new Date(),
      },
    };
  },
  methods: {
    getColor(status, completed) {
      var color = "";
      switch (status) {
        case "Completed":
          color = "#01579B";
          break;
        case "Confirmed":
          if (completed) {
            color = "#01579B";
          } else {
            color = "light-blue accent-2";
          }
          break;
        case "TBD":
          color = "teal darken-2";
          break;
        case "Rescheduling":
          color = "lime darken-3";
          break;
        case "No Show":
          color = "orange darken-3";
          break;
        case "Cancelled":
          color = "deep-orange darken-1";
          break;
        case "Rejected":
          color = "blue-grey darken-4";
          break;
      }

      return color;
    },
  },
  // computed: {
  //   sortableAppointments() {
  //     if (this.Appointments) {
  //       return this.Appointments.map((appointment) => {
  //         return {
  //           ...appointment,
  //           sortableAppointmentTime:
  //             appointment.Schedule.AppointmentTime &&
  //             new Date(appointment.Schedule.AppointmentTime).toISOString(),
  //         };
  //       });
  //     } else {
  //       return [];
  //     }
  //   },
  // },
};
</script>

<style lang="css" scoped>
.theme--light.v-icon {
  color: var(--v-primary-base);
  font-size: 28px;
  padding-left: 2px;
  padding-right: 2px;
}

 tr.v-data-table__selected {
  /* color: var(--v-secondary-lighten1) !important; */
  /* margin: 2px !important;
  border-style: double   !important; */
  background-color: var(--v-secondary-lighten1) !important;
}
</style>
