<template>
  <v-container fluid style="max-width: 960px; margin-top: 24px">
    <!-- Page Header -->
    <div class="section-header" style="margin-top: 0">
      <v-icon class="section-header__icon">mdi-calendar-clock</v-icon>
      <h2 class="section-header__title">Calendar Test Console</h2>
    </div>
    <p class="text-muted" style="margin-bottom: 24px">
      Test the actual backend Google Calendar integration by creating, updating,
      and deleting <strong>real</strong> calendar events using the
      <code>googleCalendarService</code>.
    </p>

    <v-alert
      type="warning"
      variant="tonal"
      density="compact"
      style="margin-bottom: 20px"
    >
      <strong>Live operations:</strong> This page calls the real Google Calendar
      API. Events will appear on your lab's Google Calendar.
    </v-alert>

    <!-- Lab Configuration -->
    <v-card class="ds-card" variant="flat" style="padding: 20px; margin-bottom: 20px">
      <p class="text-label" style="margin-bottom: 10px">Lab Configuration</p>
      <v-row dense align="center">
        <v-col cols="12" md="4">
          <v-chip
            v-if="lab"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-flask-outline"
          >
            Lab {{ lab }} — {{ labName || 'Unknown' }}
          </v-chip>
          <v-alert v-else type="error" variant="tonal" density="compact">
            Not logged in. Please log in first.
          </v-alert>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="calendarId"
            label="Calendar ID"
            placeholder="primary"
            variant="outlined"
            density="compact"
            hide-details="auto"
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- Action Cards -->
    <v-row>
      <!-- CREATE -->
      <v-col cols="12" md="4">
        <v-card class="ds-card action-card" variant="flat" style="padding: 20px; height: 100%">
          <div class="action-card__header create">
            <v-icon size="28">mdi-calendar-plus</v-icon>
            <span class="text-label">Create Event</span>
          </div>

          <v-text-field
            v-model="createForm.summary"
            label="Summary"
            variant="outlined"
            density="compact"
            hide-details="auto"
            style="margin: 12px 0 8px"
          />

          <v-text-field
            v-model="createForm.dateTime"
            label="Date & Time"
            type="datetime-local"
            variant="outlined"
            density="compact"
            hide-details="auto"
            style="margin-bottom: 8px"
          />

          <v-text-field
            v-model="createForm.location"
            label="Location"
            variant="outlined"
            density="compact"
            hide-details="auto"
            style="margin-bottom: 12px"
          />

          <v-btn
            color="success"
            variant="flat"
            block
            :loading="loading.create"
            :disabled="!lab"
            @click="createEvent"
            prepend-icon="mdi-calendar-plus"
          >
            Create Event
          </v-btn>
        </v-card>
      </v-col>

      <!-- UPDATE -->
      <v-col cols="12" md="4">
        <v-card class="ds-card action-card" variant="flat" style="padding: 20px; height: 100%">
          <div class="action-card__header update">
            <v-icon size="28">mdi-calendar-edit</v-icon>
            <span class="text-label">Update Event</span>
          </div>

          <v-text-field
            v-model="updateForm.eventId"
            label="Event ID *"
            placeholder="Paste from created event"
            variant="outlined"
            density="compact"
            hide-details="auto"
            style="margin: 12px 0 8px"
          />

          <v-text-field
            v-model="updateForm.summary"
            label="New Summary"
            variant="outlined"
            density="compact"
            hide-details="auto"
            style="margin-bottom: 8px"
          />

          <v-text-field
            v-model="updateForm.dateTime"
            label="New Date & Time"
            type="datetime-local"
            variant="outlined"
            density="compact"
            hide-details="auto"
            style="margin-bottom: 12px"
          />

          <v-btn
            color="primary"
            variant="flat"
            block
            :loading="loading.update"
            :disabled="!lab || !updateForm.eventId"
            @click="updateEvent"
            prepend-icon="mdi-calendar-edit"
          >
            Update Event
          </v-btn>
        </v-card>
      </v-col>

      <!-- DELETE -->
      <v-col cols="12" md="4">
        <v-card class="ds-card action-card" variant="flat" style="padding: 20px; height: 100%">
          <div class="action-card__header delete">
            <v-icon size="28">mdi-calendar-remove</v-icon>
            <span class="text-label">Delete Event</span>
          </div>

          <v-text-field
            v-model="deleteForm.eventId"
            label="Event ID *"
            placeholder="Paste from created event"
            variant="outlined"
            density="compact"
            hide-details="auto"
            style="margin: 12px 0 12px"
          />

          <v-btn
            color="error"
            variant="flat"
            block
            :loading="loading.delete"
            :disabled="!lab || !deleteForm.eventId"
            @click="deleteEvent"
            prepend-icon="mdi-calendar-remove"
          >
            Delete Event
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Event Log -->
    <v-card class="ds-card" variant="flat" style="padding: 20px; margin-top: 20px">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
        <p class="text-label">Event Log</p>
        <v-btn
          v-if="eventLog.length > 0"
          variant="text"
          size="small"
          color="error"
          @click="eventLog = []"
          prepend-icon="mdi-delete-sweep"
        >
          Clear
        </v-btn>
      </div>

      <div v-if="eventLog.length === 0" class="text-muted" style="text-align: center; padding: 32px 0">
        No events yet. Use the actions above to test the calendar API.
      </div>

      <v-timeline v-else density="compact" side="end">
        <v-timeline-item
          v-for="(entry, i) in eventLog"
          :key="i"
          :dot-color="entry.success ? dotColor(entry.action) : 'error'"
          size="small"
        >
          <v-card variant="tonal" :color="entry.success ? dotColor(entry.action) : 'error'" style="padding: 12px">
            <div style="display: flex; justify-content: space-between; align-items: start">
              <div>
                <strong>{{ entry.action }}</strong>
                <span class="text-muted" style="margin-left: 8px; font-size: 0.75rem">
                  {{ entry.time }}
                </span>
              </div>
              <v-chip
                :color="entry.success ? 'success' : 'error'"
                size="x-small"
                variant="flat"
              >
                {{ entry.success ? 'OK' : 'FAIL' }}
              </v-chip>
            </div>
            <p style="margin-top: 6px; font-size: 0.85rem">{{ entry.message }}</p>

            <!-- Copyable Event ID for create/update -->
            <div v-if="entry.eventId" style="margin-top: 8px;">
              <v-chip
                size="small"
                variant="outlined"
                prepend-icon="mdi-identifier"
                @click="copyAndFill(entry.eventId)"
                style="cursor: pointer"
              >
                {{ entry.eventId }}
                <v-tooltip activator="parent" location="top">Click to copy & auto-fill</v-tooltip>
              </v-chip>
            </div>

            <!-- Calendar link -->
            <div v-if="entry.eventURL" style="margin-top: 4px;">
              <a :href="entry.eventURL" target="_blank" style="font-size: 0.8rem">
                Open in Google Calendar ↗
              </a>
            </div>
          </v-card>
        </v-timeline-item>
      </v-timeline>
    </v-card>
  </v-container>
</template>

<script>
import api from "@/services/api";

export default {
  name: "CalendarTest",
  data() {
    return {
      calendarId: "primary",

      createForm: {
        summary: "[TEST] DRDB Calendar Test Event",
        dateTime: "",
        location: "Psychology Building, McMaster University",
      },

      updateForm: {
        eventId: "",
        summary: "[TEST] DRDB Calendar Test Event (Updated)",
        dateTime: "",
      },

      deleteForm: {
        eventId: "",
      },

      loading: {
        create: false,
        update: false,
        delete: false,
      },

      eventLog: [],
    };
  },

  computed: {
    lab() {
      return this.$store.state.lab;
    },
    labName() {
      return this.$store.state.labName;
    },
  },

  created() {
    // Default datetimes
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    this.createForm.dateTime = this.toLocalDateTimeString(tomorrow);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(14, 30, 0, 0);
    this.updateForm.dateTime = this.toLocalDateTimeString(dayAfter);
  },

  methods: {
    toLocalDateTimeString(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const h = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");
      return `${y}-${m}-${d}T${h}:${min}`;
    },

    addLog(action, success, message, eventId, eventURL) {
      this.eventLog.unshift({
        action,
        success,
        message,
        eventId: eventId || null,
        eventURL: eventURL || null,
        time: new Date().toLocaleTimeString(),
      });
    },

    dotColor(action) {
      if (action === "CREATE") return "success";
      if (action === "UPDATE") return "primary";
      if (action === "DELETE") return "error";
      return "grey";
    },

    copyAndFill(eventId) {
      navigator.clipboard.writeText(eventId);
      this.updateForm.eventId = eventId;
      this.deleteForm.eventId = eventId;
    },

    async createEvent() {
      this.loading.create = true;
      try {
        const { data } = await api().post("calendarTest/create", {
          lab: this.lab,
          summary: this.createForm.summary,
          dateTime: this.createForm.dateTime,
          location: this.createForm.location,
          calendarId: this.calendarId,
        });
        this.addLog("CREATE", true, data.message, data.event.eventId, data.event.eventURL);
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message;
        this.addLog("CREATE", false, msg);
      }
      this.loading.create = false;
    },

    async updateEvent() {
      this.loading.update = true;
      try {
        const { data } = await api().patch("calendarTest/update", {
          lab: this.lab,
          eventId: this.updateForm.eventId,
          summary: this.updateForm.summary,
          dateTime: this.updateForm.dateTime,
          calendarId: this.calendarId,
        });
        this.addLog("UPDATE", true, data.message, data.event.eventId, data.event.eventURL);
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message;
        this.addLog("UPDATE", false, msg);
      }
      this.loading.update = false;
    },

    async deleteEvent() {
      this.loading.delete = true;
      try {
        const { data } = await api().delete("calendarTest/delete", {
          params: {
            lab: this.lab,
            eventId: this.deleteForm.eventId,
            calendarId: this.calendarId,
          },
        });
        this.addLog("DELETE", true, data.message);
        this.deleteForm.eventId = "";
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message;
        this.addLog("DELETE", false, msg);
      }
      this.loading.delete = false;
    },
  },
};
</script>

<style scoped>
.action-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 4px;
  border-bottom: 2px solid transparent;
}
.action-card__header.create {
  border-color: rgb(var(--v-theme-success));
  color: rgb(var(--v-theme-success));
}
.action-card__header.update {
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
}
.action-card__header.delete {
  border-color: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-error));
}
</style>
