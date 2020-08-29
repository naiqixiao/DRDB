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
    height="380px"
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

/* .theme--light.v-data-table /deep/ thead /deep/ tr th:hover {
  color: var(--v-secondary-base) !important;
}

.v-data-table
  /deep/
  tbody
  /deep/
  tr:hover:not(.v-data-table__expanded__content) {
  border-bottom-width: 2px !important;
  background-color: var(--v-secondary-lighten1) !important;
} */

/deep/ tr.v-data-table__selected {
  /* color: var(--v-secondary-lighten1) !important; */
  /* margin: 2px !important;
  border-style: double   !important; */
  background-color: var(--v-secondary-lighten1) !important;
}
</style>
