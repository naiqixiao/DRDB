<template>
  <div class="upcoming-section">
    <div v-if="upcomingSchedules.length === 0 && !loading" class="no-upcoming">
      <v-icon size="20" class="mr-1" color="grey">mdi-calendar-remove-outline</v-icon>
      No upcoming confirmed appointments found.
    </div>

    <div class="cards-row" v-else>
      <v-card
        v-for="schedule in upcomingSchedules"
        :key="schedule.id"
        class="upcoming-card"
        variant="outlined"
        @click="$emit('selectSchedule', schedule)"
      >
        <!-- Time banner -->
        <div class="card-time-banner" :class="timeBannerClass(schedule)">
          <v-icon size="16" class="mr-1">mdi-clock-outline</v-icon>
          <span class="card-time">{{ formatTime(schedule.AppointmentTime) }}</span>
          <span class="card-date">{{ formatDate(schedule.AppointmentTime) }}</span>
          <span class="card-relative">{{ relativeTime(schedule.AppointmentTime) }}</span>
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-autorenew" variant="text" size="x-small" density="compact"
                class="ml-1" style="color: white; opacity: 0.9;"
                :disabled="schedule.Status === 'Confirmed' && schedule.Completed === true"
                @click.stop="$emit('updateSchedule', schedule)"></v-btn>
            </template>
            <span>Update this appointment</span>
          </v-tooltip>
        </div>

        <v-card-text class="card-body">
          <!-- Studies -->
          <div v-for="(appt, idx) in schedule.Appointments" :key="idx" class="study-row">
            <div class="study-name">
              <v-icon size="14" class="mr-1" color="primary">mdi-flask-outline</v-icon>
              {{ appt.Study ? appt.Study.StudyName : 'Unknown' }}
            </div>
            <div class="child-info">
              <v-icon size="13" class="mr-1">mdi-account-child</v-icon>
              <strong>{{ appt.Child ? appt.Child.Name : 'Unknown' }}</strong>
              <span class="child-detail" v-if="appt.Child"> · {{ childAge(appt.Child) }} · {{ appt.Child.Sex }}</span>
            </div>
            <div class="experimenter-info" v-if="appt.PrimaryExperimenter && appt.PrimaryExperimenter.length > 0">
              <v-icon size="13" class="mr-1">mdi-account-hard-hat</v-icon>
              E1: {{ appt.PrimaryExperimenter[0].Name }}
            </div>
          </div>

          <v-divider class="my-2"></v-divider>

          <!-- Family info -->
          <div class="family-info" v-if="schedule.Family">
            <v-icon size="13" class="mr-1">mdi-account-group-outline</v-icon>
            {{ schedule.Family.NamePrimary }}
            <span v-if="schedule.Family.Phone" class="family-detail"> · {{ formatPhone(schedule.Family.Phone) }}</span>
            <v-spacer></v-spacer>
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon="mdi-account-details-outline" variant="text" size="x-small" density="compact"
                  color="primary" @click.stop="$emit('showFamily', schedule.Family)"></v-btn>
              </template>
              <span>View Family Details</span>
            </v-tooltip>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import schedule from "@/services/schedule";
import moment from "moment-timezone";
import { useMainStore } from "@/stores/mainStore";

export default {
  name: "UpcomingAppointments",
  setup() {
    const store = useMainStore();
    return { store };
  },
  emits: ["selectSchedule", "showFamily", "updateSchedule"],
  data() {
    return {
      upcomingSchedules: [],
      loading: false,
    };
  },
  mounted() {
    this.fetchUpcoming();
  },
  methods: {
    async fetchUpcoming() {
      this.loading = true;
      try {
        const result = await schedule.upcoming();
        this.upcomingSchedules = result.data || [];
      } catch (error) {
        console.error("Failed to fetch upcoming appointments:", error);
        this.upcomingSchedules = [];
      }
      this.loading = false;
    },

    formatTime(date) {
      return moment(date).tz("America/Toronto").format("h:mm A");
    },

    formatDate(date) {
      return moment(date).tz("America/Toronto").format("ddd, MMM D");
    },

    relativeTime(date) {
      const now = moment();
      const apptTime = moment(date);
      const diffHours = apptTime.diff(now, "hours");
      const diffDays = apptTime.diff(now, "days");

      if (diffHours < 1) {
        const diffMins = apptTime.diff(now, "minutes");
        return `in ${diffMins}m`;
      } else if (diffHours < 24) {
        return `in ${diffHours}h`;
      } else {
        return `in ${diffDays}d`;
      }
    },

    timeBannerClass(schedule) {
      const diffHours = moment(schedule.AppointmentTime).diff(moment(), "hours");
      if (diffHours < 2) return "banner-imminent";
      if (diffHours < 24) return "banner-today";
      return "banner-upcoming";
    },

    childAge(child) {
      if (!child || !child.DoB) return "";
      const months = moment().diff(moment(child.DoB), "months");
      if (months < 24) return `${months}mo`;
      const years = Math.floor(months / 12);
      const remainMonths = months % 12;
      return remainMonths > 0 ? `${years}y${remainMonths}m` : `${years}y`;
    },

    formatPhone(phone) {
      if (!phone) return "";
      let cleaned = ("" + phone).replace(/\D/g, "");
      let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
      return phone;
    },
  },

  watch: {
    "store.trainingMode"() {
      this.fetchUpcoming();
    },
  },
};
</script>

<style scoped>
.upcoming-section {
  margin-bottom: 20px;
}

.upcoming-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.upcoming-title {
  font-size: 18px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

.no-upcoming {
  font-size: 14px;
  color: #888;
  padding: 8px 0;
  display: flex;
  align-items: center;
}

.cards-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.upcoming-card {
  flex: 1 1 0;
  min-width: 220px;
  max-width: 340px;
  border-radius: 10px !important;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
}

.upcoming-card:hover {
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.13);
  transform: translateY(-2px);
}

.card-time-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.banner-imminent {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.banner-today {
  background: linear-gradient(135deg, #e67e22, #d35400);
}

.banner-upcoming {
  background: linear-gradient(135deg, #2980b9, #1a5276);
}

.card-time {
  font-size: 15px;
  font-weight: 800;
}

.card-date {
  font-size: 13px;
  opacity: 0.9;
}

.card-relative {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.85;
  font-style: italic;
}

.card-body {
  padding: 10px 14px !important;
}

.study-row {
  margin-bottom: 6px;
}

.study-name {
  font-size: 14px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
}

.child-info {
  font-size: 13px;
  padding-left: 2px;
  display: flex;
  align-items: center;
}

.child-detail {
  font-size: 12px;
  color: #777;
}

.experimenter-info {
  font-size: 12px;
  color: #666;
  padding-left: 2px;
  display: flex;
  align-items: center;
}

.family-info {
  font-size: 13px;
  display: flex;
  align-items: center;
}

.family-detail {
  font-size: 12px;
  color: #888;
}
</style>
