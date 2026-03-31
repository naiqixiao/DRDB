<template>
  <v-container fluid style="max-width: 1440px">
    <AlertBanner :showAdminEmail="true" />

    <div class="d-flex align-center justify-space-between mb-6 mt-2">
      <div>
        <h1
          class="text-h4 font-weight-bold"
          style="font-family: var(--ds-font-family-heading); color: var(--color-primary)"
        >
          Welcome back, {{ store.name.split(" ")[0] }}
        </h1>
        <p class="text-body-1 text-muted">
          Here is what is happening in <strong>{{ store.labName }}</strong> today.
        </p>
      </div>
      <div class="d-none d-sm-block text-right">
        <div class="text-h6 font-weight-bold" style="color: var(--color-primary)">
          {{ currentDate }}
        </div>
        <div class="text-caption text-muted text-uppercase">{{ store.role }} Access</div>
      </div>
    </div>

    <v-row class="home-dashboard-row">
      <v-col
        ref="leftCol"
        cols="12"
        lg="8"
        class="d-flex flex-column home-dashboard-main-col"
      >
        <v-card class="ds-card mb-6" variant="flat">
          <v-toolbar
            color="transparent"
            density="compact"
            class="px-2"
            style="border-bottom: 1px solid #e2e8f0"
          >
            <v-icon class="mr-2" color="primary">mdi-chart-timeline-variant</v-icon>
            <span
              class="text-subtitle-1 font-weight-bold"
              style="
                font-family: var(--ds-font-family-heading);
                color: rgb(var(--v-theme-primary));
              "
            >
              Global Recruitment Trends
            </span>
            <v-spacer></v-spacer>
            <v-chip size="small" variant="tonal" color="primary"
              >All Active Studies</v-chip
            >
          </v-toolbar>

          <v-card-text class="pt-6">
            <HistogramChart />
          </v-card-text>
        </v-card>

        <h3 class="text-subtitle-1 font-weight-bold text-muted text-uppercase mb-3 ml-1">
          Quick Actions
        </h3>
        <v-row dense>
          <v-col cols="12" sm="4">
            <v-card
              class="ds-card ds-interactive d-flex align-center pa-4 cursor-pointer"
              variant="flat"
              @click="$router.push('/family')"
            >
              <v-avatar color="primary" variant="tonal" class="mr-4"
                ><v-icon>mdi-account-multiple-plus</v-icon></v-avatar
              >
              <div>
                <div class="font-weight-bold text-primary">Add Family</div>
                <div class="text-caption text-muted">Register a new participant</div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card
              class="ds-card ds-interactive d-flex align-center pa-4 cursor-pointer"
              variant="flat"
              @click="$router.push('/schedule')"
            >
              <v-avatar color="warning" variant="tonal" class="mr-4"
                ><v-icon color="warning">mdi-calendar-plus</v-icon></v-avatar
              >
              <div>
                <div class="font-weight-bold" style="color: var(--color-cta)">
                  Schedule Study
                </div>
                <div class="text-caption text-muted">Book an appointment</div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card
              class="ds-card ds-interactive d-flex align-center pa-4 cursor-pointer"
              variant="flat"
              @click="$router.push('/study')"
            >
              <v-avatar color="success" variant="tonal" class="mr-4"
                ><v-icon color="success">mdi-flask-outline</v-icon></v-avatar
              >
              <div>
                <div class="font-weight-bold text-success">Manage Studies</div>
                <div class="text-caption text-muted">View progress & settings</div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <v-col cols="12" lg="4" class="d-flex flex-column home-dashboard-side-col">
        <v-card
          class="ds-card d-flex flex-column home-dashboard-side-card"
          variant="flat"
          :style="rightCardStyle"
        >
          <v-toolbar
            color="transparent"
            density="compact"
            class="px-2"
            style="border-bottom: 1px solid #e2e8f0"
          >
            <v-icon class="mr-2" color="primary">mdi-calendar-clock</v-icon>
            <span
              class="text-subtitle-1 font-weight-bold"
              style="
                font-family: var(--ds-font-family-heading);
                color: rgb(var(--v-theme-primary));
              "
            >
              Upcoming Schedule
            </span>
          </v-toolbar>

          <v-card-text
            class="pt-4 pb-0 flex-grow-1 home-dashboard-side-content"
            style="background-color: #f8fafc"
          >
            <UpcomingAppointments
              @selectSchedule="handleScheduleSelect"
              @showFamily="handleShowFamily"
              @updateSchedule="handleUpdateSchedule"
            />
          </v-card-text>

          <div
            class="text-center py-3"
            style="border-top: 1px solid #e2e8f0; background-color: #fff"
          >
            <v-btn
              variant="text"
              color="primary"
              append-icon="mdi-arrow-right"
              @click="$router.push('/appointment')"
            >
              View full calendar
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import AlertBanner from "@/components/AlertBanner.vue";
import HistogramChart from "@/components/HistogramChart.vue";
import UpcomingAppointments from "@/components/UpcomingAppointments.vue";
import { useMainStore } from "@/stores/mainStore";
import moment from "moment";

export default {
  name: "Home",
  components: {
    AlertBanner,
    HistogramChart,
    UpcomingAppointments,
  },
  setup() {
    const store = useMainStore();
    return { store };
  },
  data() {
    return {
      measuredLeftHeight: 0,
      isLgScreen: false,
    };
  },
  computed: {
    currentDate() {
      return moment().format("dddd, MMMM Do YYYY");
    },
    rightCardStyle() {
      if (!this.isLgScreen || !this.measuredLeftHeight) return {};
      return { height: this.measuredLeftHeight + "px" };
    },
  },
  mounted() {
    this._lgMq = window.matchMedia("(min-width: 1280px)");
    this.isLgScreen = this._lgMq.matches;
    this._lgMqHandler = (e) => {
      this.isLgScreen = e.matches;
    };
    this._lgMq.addEventListener("change", this._lgMqHandler);
    this.$nextTick(() => {
      const el = this.$refs.leftCol?.$el ?? this.$refs.leftCol;
      if (!el) return;
      this._resizeObserver = new ResizeObserver((entries) => {
        this.measuredLeftHeight = entries[0].contentRect.height;
      });
      this._resizeObserver.observe(el);
    });
  },
  beforeUnmount() {
    this._resizeObserver?.disconnect();
    this._lgMq?.removeEventListener("change", this._lgMqHandler);
  },
  methods: {
    // Basic routing handlers for the components
    handleScheduleSelect(schedule) {
      // Could open a dialog here or route to appointment page
      this.$router.push("/appointment");
    },
    handleShowFamily(family) {
      this.$router.push("/family");
    },
    handleUpdateSchedule(schedule) {
      this.$router.push("/appointment");
    },
  },
};
</script>

<style scoped>
.home-dashboard-row {
  align-items: flex-start;
}

@media (min-width: 1280px) {
  .home-dashboard-side-col {
    display: flex;
    flex-direction: column;
  }

  .home-dashboard-side-card {
    overflow: hidden;
  }

  .home-dashboard-side-content {
    flex: 1 1 auto;
    overflow-y: auto;
  }
}
</style>
