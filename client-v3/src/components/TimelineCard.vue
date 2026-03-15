<template>
  <v-card variant="outlined"
    style="min-width: 250px; max-width: 320px; flex-shrink: 0; z-index: 1; background-color: white;"
    class="mb-2 bg-white"
    :style="{ borderTop: '4px solid ' + statusColor }">
    <v-card-title
      class="text-subtitle-1 py-1 ds-header-gradient d-flex justify-space-between align-center">
      <span class="font-weight-bold text-truncate"
        style="max-width: 60%; font-family: var(--ds-font-family-body); font-size: 0.9rem;">
        {{ studyName }}
      </span>
      <div class="d-flex align-center" style="gap: 4px;">
        <v-chip size="small" :color="statusColor"
          class="text-white font-weight-bold" variant="flat" style="font-size: 0.70rem; height: 20px;">
          {{ statusLabel }}
        </v-chip>
        <v-btn v-if="deletable" icon="mdi-delete-outline" variant="text" density="compact" size="small" color="error"
          @click.stop="$emit('delete', schedule)" title="Delete Schedule"></v-btn>
      </div>
    </v-card-title>

    <v-card-text class="pt-2 px-3 pb-2 text-left">
      <div class="d-flex align-center mb-1">
        <v-icon size="small" class="mr-2 text-muted">mdi-calendar-clock</v-icon>
        <strong style="color: var(--ds-value-color); font-size: 0.85rem;">
          {{ formattedDate }}
        </strong>
      </div>

      <div class="d-flex align-center mb-1" v-if="childNames">
        <v-icon size="small" class="mr-2 text-muted">mdi-human-child</v-icon>
        <span class="text-caption">{{ childNames }}</span>
      </div>

      <div class="d-flex align-center mb-1" v-if="schedule.Personnel">
        <v-icon size="small" class="mr-2 text-muted">mdi-account</v-icon>
        <span class="text-caption">Scheduled by: {{ schedule.Personnel.Name }}</span>
      </div>

      <div v-if="schedule.Note" class="text-caption text-muted mt-2 pt-1"
        style="border-top: 1px solid #E2E8F0; line-height: 1.2">
        <v-icon size="small" class="mr-1">mdi-message-text-outline</v-icon>
        <em>"{{ schedule.Note }}"</em>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import moment from "moment-timezone";

export default {
  name: "TimelineCard",
  props: {
    schedule: { type: Object, required: true },
    deletable: { type: Boolean, default: false }
  },
  emits: ["delete"],
  computed: {
    studyName() {
      return this.schedule.Appointments?.[0]?.Study?.StudyName || "Unknown Study";
    },
    statusLabel() {
      return this.schedule.Status === "Confirmed" && this.schedule.Completed
        ? "Completed"
        : this.schedule.Status;
    },
    statusColor() {
      return this.getTimelineColor(this.schedule.Status, this.schedule.Completed);
    },
    formattedDate() {
      if (!this.schedule.AppointmentTime) return "TBD";
      return moment(this.schedule.AppointmentTime).format("YYYY-MM-DD HH:mm");
    },
    childNames() {
      if (!this.schedule.Appointments || this.schedule.Appointments.length === 0) return "";
      const names = this.schedule.Appointments
        .map(app => app.Child?.Name)
        .filter(Boolean)
        .map(name => name.split(" ")[0]); // first name only
      const unique = [...new Set(names)];
      return unique.length > 0 ? unique.join(", ") : "";
    }
  },
  methods: {
    getTimelineColor(status, completed) {
      switch (status) {
        case "Completed": return "#01579B";
        case "Confirmed": return completed ? "#01579B" : "light-blue-accent-2";
        case "TBD": return "teal-darken-2";
        case "Rescheduling": return "lime-darken-3";
        case "No Show": return "orange-darken-3";
        case "Cancelled": return "deep-orange-darken-1";
        case "Rejected": return "blue-grey-darken-4";
        default: return "grey";
      }
    }
  }
};
</script>
