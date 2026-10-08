<template>
  <div>
    <div v-if="loading" class="d-flex justify-center py-6">
      <v-progress-circular indeterminate color="primary" size="28"></v-progress-circular>
    </div>

    <div v-else-if="error" class="empty-state">
      <v-icon size="20" class="mr-1" color="grey">mdi-alert-circle-outline</v-icon>
      Could not load upcoming visits.
    </div>

    <template v-else>
      <!-- Day selector -->
      <v-chip-group v-model="selectedDay" mandatory selected-class="text-primary">
        <v-chip
          v-for="day in days"
          :key="day.key"
          :value="day.key"
          variant="outlined"
          size="small"
          :disabled="day.count === 0"
        >
          {{ day.label }}
          <v-badge v-if="day.count" :content="day.count" inline color="primary"></v-badge>
        </v-chip>
      </v-chip-group>

      <!-- Lab filter -->
      <div class="lab-filter">
        <span class="filter-label">Labs</span>
        <v-chip
          v-for="lab in labs"
          :key="lab.id"
          size="small"
          :variant="selectedLabs.includes(lab.id) ? 'tonal' : 'outlined'"
          :color="selectedLabs.includes(lab.id) ? labColor(lab.id) : 'grey'"
          @click="toggleLab(lab.id)"
        >
          <span class="lab-dot" :style="{ background: labColor(lab.id) }"></span>
          {{ lab.name }}
          <v-tooltip v-if="!lab.countsForParking" activator="parent" location="top">
            Not counted toward parking spots
          </v-tooltip>
          <v-icon v-if="!lab.countsForParking" size="14" class="ml-1">mdi-car-off</v-icon>
        </v-chip>
      </div>

      <!-- Time slots (fixed-height scroll area) -->
      <div ref="scroller" class="slots-scroll" :style="{ height: `${height}px` }">
        <div v-if="slotsForDay.length === 0" class="empty-state">
          <v-icon size="20" class="mr-1" color="grey">mdi-car-off</v-icon>
          No in-person visits for the selected day and labs.
        </div>

        <template v-for="slot in slotsForDay" :key="slot.key">
          <div v-if="slot.key === nowSlotKey" class="now-marker">
            <span>Now · {{ nowLabel }}</span>
          </div>

          <div :ref="(el) => setSlotRef(slot.key, el)" class="time-slot" :class="{ 'time-slot--past': slot.past }">
            <div class="slot-header">
              <v-icon size="16" class="mr-1" color="primary">mdi-clock-outline</v-icon>
              <span class="slot-time">{{ slot.label }}</span>
              <v-chip
                size="x-small"
                class="ml-2"
                :color="slot.parkingCount > spots ? 'error' : 'grey'"
                variant="tonal"
                prepend-icon="mdi-car"
              >
                {{ slot.parkingCount }} / {{ spots }} spots
                <v-tooltip activator="parent" location="top">
                  Families arriving at this time across all labs (excluding labs with their own parking)
                </v-tooltip>
              </v-chip>
            </div>

            <div class="slot-cards">
              <v-card
                v-for="visit in slot.visits"
                :key="visit.id"
                class="visit-card"
                variant="flat"
                :style="cardStyle(visit)"
              >
                <div class="visit-caregiver">
                  <v-icon size="16" class="mr-1">mdi-account-outline</v-icon>
                  {{ visit.caregiver }}
                  <v-chip v-if="!needsParking(visit)" size="x-small" variant="text" class="ml-auto" prepend-icon="mdi-car-off">
                    no parking
                  </v-chip>
                </div>

                <div v-for="(study, idx) in visit.studies" :key="idx" class="visit-study">
                  <div class="study-line">
                    <span class="study-name">{{ study.studyName }}</span>
                    <v-chip v-if="study.lab" size="x-small" :color="labColor(study.labId)" variant="tonal" class="ml-2">
                      {{ study.lab }}
                    </v-chip>
                  </div>
                  <div v-for="role in contactRoles(study)" :key="role.label" class="contact-line">
                    <span class="contact-role">{{ role.label }}</span>
                    <span class="contact-name">{{ role.person.name }}</span>
                    <a v-if="role.person.email" :href="`mailto:${role.person.email}`" class="contact-link">
                      <v-icon size="12">mdi-email-outline</v-icon>{{ role.person.email }}
                    </a>
                    <a v-if="role.person.phone" :href="`tel:${role.person.phone}`" class="contact-link">
                      <v-icon size="12">mdi-phone-outline</v-icon>{{ formatPhone(role.person.phone) }}
                    </a>
                  </div>
                </div>
              </v-card>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script>
import schedule from "@/services/schedule";
import moment from "moment-timezone";

const DAYS_SHOWN = 7;
// Distinct, readable lab colours (red is reserved for the over-capacity warning).
const LAB_PALETTE = ["#2563EB", "#059669", "#D97706", "#7C3AED", "#DB2777", "#0891B2", "#65A30D", "#475569"];

export default {
  name: "ParkingBoard",
  props: {
    // Number of participant parking spots available to the department.
    spots: { type: Number, default: 3 },
    // Height (px) of the scrollable time-slot area.
    height: { type: Number, default: 480 },
  },
  data() {
    return {
      visits: [],
      labs: [],
      selectedLabs: [],
      timeZone: "America/Toronto",
      selectedDay: null,
      now: moment(),
      loading: false,
      error: false,
      slotRefs: {},
    };
  },
  computed: {
    labsById() {
      return Object.fromEntries(this.labs.map((lab, i) => [lab.id, { ...lab, color: LAB_PALETTE[i % LAB_PALETTE.length] }]));
    },
    filteredVisits() {
      return this.visits.filter((v) => v.studies.some((s) => this.selectedLabs.includes(s.labId)));
    },
    todayKey() {
      return this.now.clone().tz(this.timeZone).format("YYYY-MM-DD");
    },
    days() {
      const today = this.now.clone().tz(this.timeZone).startOf("day");
      return Array.from({ length: DAYS_SHOWN }, (_, i) => {
        const day = today.clone().add(i, "days");
        const key = day.format("YYYY-MM-DD");
        return {
          key,
          label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : day.format("ddd, MMM D"),
          count: this.filteredVisits.filter((v) => this.dayKey(v.time) === key).length,
        };
      });
    },
    slotsForDay() {
      const slots = {};
      const shown = new Set(this.filteredVisits.map((v) => v.id));
      // Iterate over all visits: the lab filter only hides cards, it must not
      // hide other labs' cars from the spot count.
      for (const visit of this.visits) {
        if (this.dayKey(visit.time) !== this.selectedDay) continue;
        const t = moment(visit.time).tz(this.timeZone);
        const key = t.format("HH:mm");
        if (!slots[key]) {
          slots[key] = { key, label: t.format("h:mm A"), past: t.isBefore(this.now), visits: [], parkingCount: 0 };
        }
        if (shown.has(visit.id)) slots[key].visits.push(visit);
        if (this.needsParking(visit)) slots[key].parkingCount++;
      }
      return Object.values(slots)
        .filter((slot) => slot.visits.length > 0)
        .sort((a, b) => a.key.localeCompare(b.key));
    },
    // On today's view, the first slot that hasn't started yet; the "Now" marker
    // sits above it and the list scrolls to it.
    nowSlotKey() {
      if (this.selectedDay !== this.todayKey) return null;
      const upcoming = this.slotsForDay.find((s) => !s.past);
      return upcoming ? upcoming.key : null;
    },
    nowLabel() {
      return this.now.clone().tz(this.timeZone).format("h:mm A");
    },
  },
  watch: {
    selectedDay() {
      this.scrollToNow();
    },
    selectedLabs() {
      this.scrollToNow();
    },
  },
  mounted() {
    this.fetchBoard();
    // Keep the past/now split current while the login page stays open.
    this.clock = setInterval(() => { this.now = moment(); }, 60 * 1000);
  },
  beforeUnmount() {
    clearInterval(this.clock);
  },
  methods: {
    async fetchBoard() {
      this.loading = true;
      this.error = false;
      try {
        const { data } = await schedule.parkingBoard();
        this.timeZone = data.timeZone || this.timeZone;
        this.labs = data.labs || [];
        this.selectedLabs = this.labs.map((lab) => lab.id);
        this.visits = data.visits || [];
        const firstBusy = this.days.find((d) => d.count > 0);
        this.selectedDay = (firstBusy || this.days[0]).key;
      } catch (e) {
        console.error("Failed to load parking board:", e);
        this.error = true;
      }
      this.loading = false;
      this.scrollToNow();
    },
    setSlotRef(key, el) {
      if (el) this.slotRefs[key] = el;
      else delete this.slotRefs[key];
    },
    scrollToNow() {
      this.$nextTick(() => {
        const scroller = this.$refs.scroller;
        if (!scroller) return;
        let target = 0;
        if (this.selectedDay === this.todayKey && this.slotsForDay.length) {
          // All of today's slots have passed: show the last one.
          const key = this.nowSlotKey || this.slotsForDay[this.slotsForDay.length - 1].key;
          const el = this.slotRefs[key];
          // Leave room for the "Now" marker above the slot.
          if (el) target = Math.max(0, el.offsetTop - 36);
        }
        scroller.scrollTo({ top: target, behavior: "smooth" });
      });
    },
    toggleLab(id) {
      this.selectedLabs = this.selectedLabs.includes(id)
        ? this.selectedLabs.filter((x) => x !== id)
        : [...this.selectedLabs, id];
    },
    labColor(id) {
      return this.labsById[id]?.color || "#64748B";
    },
    // A visit needs a spot if any of its studies is run by a lab that counts for parking.
    needsParking(visit) {
      return visit.studies.some((s) => this.labsById[s.labId]?.countsForParking !== false);
    },
    cardStyle(visit) {
      const color = this.labColor(visit.studies[0]?.labId);
      return {
        borderLeft: `4px solid ${color}`,
        background: `${color}12`,
        outline: `1px solid ${color}33`,
      };
    },
    dayKey(time) {
      return moment(time).tz(this.timeZone).format("YYYY-MM-DD");
    },
    contactRoles(study) {
      return [
        { label: "Experimenter", person: study.experimenter },
        { label: "Study lead", person: study.lead },
      ].filter((r) => r.person && r.person.name);
    },
    formatPhone(phone) {
      const match = ("" + phone).replace(/\D/g, "").match(/^1?(\d{3})(\d{3})(\d{4})$/);
      return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
    },
  },
};
</script>

<style scoped>
.empty-state {
  font-size: 14px;
  color: #888;
  padding: 8px 0;
  display: flex;
  align-items: center;
}

.lab-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 4px 0 12px;
}

.filter-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  margin-right: 4px;
}

.lab-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  display: inline-block;
}

.slots-scroll {
  position: relative;
  overflow-y: auto;
  padding-right: 6px;
  border-top: 1px solid rgba(var(--v-border-color), 0.12);
  padding-top: 8px;
}

.slots-scroll::-webkit-scrollbar {
  width: 6px;
}

.slots-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 99px;
}

.now-marker {
  display: flex;
  align-items: center;
  margin: 4px 0 12px;
  font-size: 11px;
  font-weight: 700;
  color: #dc2626;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.now-marker::before,
.now-marker::after {
  content: "";
  flex: 1;
  height: 2px;
  background: #dc2626;
  opacity: 0.6;
}

.now-marker span {
  padding: 0 8px;
}

.time-slot {
  margin-bottom: 16px;
}

.time-slot--past {
  opacity: 0.55;
}

.slot-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.slot-time {
  font-weight: 700;
  font-size: 15px;
  color: rgb(var(--v-theme-primary));
}

.slot-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.visit-card {
  border-radius: 10px !important;
  padding: 10px 14px;
}

.visit-caregiver {
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.visit-study + .visit-study {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(var(--v-border-color), 0.15);
}

.study-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.study-name {
  font-size: 13px;
  font-weight: 600;
}

.contact-line {
  font-size: 12px;
  color: #475569;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 8px;
  line-height: 1.6;
}

.contact-role {
  font-weight: 600;
  color: #64748b;
  min-width: 78px;
}

.contact-link {
  color: inherit;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.contact-link:hover {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}
</style>
