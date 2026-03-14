<template>
  <v-data-table
    hide-default-footer
    items-per-page="-1"
    fixed-header
    no-data-text="The family hasn't participated in any study or no family is selected."
    :headers="$headersAppointmentsBrief"
    :items="Appointments || []"
    class="elevation-1"
    height="450px"
  >
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.Schedule.AppointmentTime="{ item }">
      <DateDisplay
        v-if="item.Schedule && item.Schedule.AppointmentTime"
        :date="item.Schedule.AppointmentTime"
        format="long"
        :status="item.Schedule?.Status"
      />
    </template>
    
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.Schedule.updatedAt="{ item }">
      <DateDisplay
        v-if="item.Schedule && item.Schedule.updatedAt"
        :date="item.Schedule.updatedAt"
        format="short"
        :status="item.Schedule?.Status"
      />
    </template>

    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.AgeByParticipation="{ item }">
      <AgeByParticipation :item="item" />
    </template>

    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.Schedule.Status="{ item }">
      <v-chip
        v-if="item.Schedule"
        :color="getColor(item.Schedule.Status, item.Schedule.Completed)"
        class="text-white"
      >
        {{
          item.Schedule.Status === "Confirmed" && item.Schedule.Completed
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
      let color = "";
      switch (status) {
        case "Completed":
          color = "#01579B";
          break;
        case "Confirmed":
          if (completed) {
            color = "#01579B";
          } else {
            color = "light-blue-accent-2";
          }
          break;
        case "TBD":
          color = "teal-darken-2";
          break;
        case "Rescheduling":
          color = "lime-darken-3";
          break;
        case "No Show":
          color = "orange-darken-3";
          break;
        case "Cancelled":
          color = "deep-orange-darken-1";
          break;
        case "Rejected":
          color = "blue-grey-darken-4";
          break;
      }
      return color;
    },
  },
  computed: {
    $headersAppointmentsBrief() {
      // Assuming it's in global properties, but providing a default if not found
      return this.$store?.state?.$headersAppointmentsBrief || [
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
