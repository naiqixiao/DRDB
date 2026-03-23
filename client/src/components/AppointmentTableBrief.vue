<template>
  <v-data-table hide-default-footer items-per-page="-1" fixed-header
    no-data-text="The family hasn't participated in any study or no family is selected."
    :headers="$headersAppointmentsBrief" :items="Appointments || []" class="elevation-1" height="450px">
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.Schedule.AppointmentTime="{ item }">
      <DateDisplay v-if="item.Schedule && item.Schedule.AppointmentTime" :date="item.Schedule.AppointmentTime"
        format="long" :status="item.Schedule?.Status" />
    </template>

    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.Schedule.updatedAt="{ item }">
      <DateDisplay v-if="item.Schedule && item.Schedule.updatedAt" :date="item.Schedule.updatedAt" format="short"
        :status="item.Schedule?.Status" />
    </template>

    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.AgeByParticipation="{ item }">
      <AgeByParticipation :item="item" />
    </template>

    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.Schedule.Status="{ item }">
      <v-chip v-if="item.Schedule" :color="getColor(item.Schedule.Status, item.Schedule.Completed)" variant="outlined"
        class="font-weight-bold" size="default">
        {{
          item.Schedule.Status === "Confirmed" && (item.Schedule.Completed === true || item.Schedule.Completed === 1)
            ? "Completed"
            : item.Schedule.Status
        }}
      </v-chip>
    </template>

    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.Study.StudyName="{ item }">
      {{ item.Study ? "[ Lab: " + (item.Study.Lab?.PI || 'Unknown') + " ] " + item.Study.StudyName : '' }}
    </template>
  </v-data-table>
</template>

<script>
import DateDisplay from "@/components/DateDisplay.vue";
import AgeByParticipation from "@/components/AgeByParticipation.vue";

export default {
  name: "AppointmentTableBrief",
  components: {
    DateDisplay,
    AgeByParticipation,
  },
  props: {
    Appointments: {
      type: Array,
      default: () => []
    },
    family: {
      type: Object,
      default: () => ({})
    },
  },
  methods: {
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
  },
  computed: {
    $headersAppointmentsBrief() {
      return [
        { title: "Study Time", key: "Schedule.AppointmentTime", width: "15%" },
        { title: "Study", key: "Study.StudyName", width: "40%" },
        { title: "Child", key: "Child.Name", width: "15%" },
        { title: "Age", key: "AgeByParticipation", width: "10%" },
        { title: "Status", key: "Schedule.Status", width: "10%" },
        { title: "Updated", key: "Schedule.updatedAt", width: "10%" }
      ];
    }
  }
};
</script>

<style scoped>
.v-data-table {
  font-size: 14px;
}
</style>
