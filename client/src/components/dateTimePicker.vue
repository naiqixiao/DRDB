<template>
  <v-form ref="validScheduleDateTime" v-model="validScheduleDateTime" lazy-validation>
    <v-container
      class="pa-0 d-flex align-center"
      style="gap: 12px;"
    >
      <!-- Date: text input + calendar picker -->
      <v-menu v-model="dateMenu" :close-on-content-click="false" location="bottom start">
        <template v-slot:activator="{ props: menuProps }">
          <v-text-field
            ref="studyDateInput"
            label="Date"
            v-model="dateValue"
            :disabled="dateTimePickerDisable"
            @update:model-value="onDateTimeChange"
            hide-details
            variant="outlined"
            density="compact"
            placeholder="YYYY-MM-DD"
            style="max-width: 200px; flex-shrink: 0;"
          >
            <template v-slot:append-inner>
              <v-icon v-bind="menuProps" :disabled="dateTimePickerDisable" style="cursor:pointer">mdi-calendar</v-icon>
            </template>
          </v-text-field>
        </template>
        <v-date-picker
          v-model="datePickerValue"
          @update:model-value="onDatePickerSelect"
          hide-header
          show-adjacent-months
        ></v-date-picker>
      </v-menu>

      <!-- Hour select -->
      <v-select
        label="Hour"
        :items="hourOptions"
        v-model="hourValue"
        :disabled="dateTimePickerDisable"
        @update:model-value="onDateTimeChange"
        hide-details
        variant="outlined"
        density="compact"
        style="max-width: 90px; flex-shrink: 0;"
      ></v-select>

      <span style="font-size: 1.2rem; font-weight: 600; opacity: 0.5; margin: 0 -4px;">:</span>

      <!-- Minute select -->
      <v-select
        label="Min"
        :items="minuteOptions"
        v-model="minuteValue"
        :disabled="dateTimePickerDisable"
        @update:model-value="onDateTimeChange"
        hide-details
        variant="outlined"
        density="compact"
        style="max-width: 90px; flex-shrink: 0;"
      ></v-select>

      <span v-html="dateTimeNotice" style="flex: 1;"></span>
    </v-container>
  </v-form>
</template>

<script>
import moment from "moment";

export default {
  name: "dateTimePicker",
  props: {
    dateTimePickerDisable: Boolean,
    appointmentTime: String,
  },
  emits: ["readyToCreateSchedule"],
  data() {
    return {
      studyDateTimeReady: false,
      validScheduleDateTime: true,
      dateValue: null,
      datePickerValue: null,
      dateMenu: false,
      hourValue: 9,
      minuteValue: "00",
      hourOptions: Array.from({ length: 24 }, (_, i) => i),
      minuteOptions: ["00", "15", "30", "45"],
    }
  },
  methods: {
    studyDateTime() {
      if (this.dateValue && this.hourValue !== null) {
        const h = String(this.hourValue).padStart(2, '0');
        const m = this.minuteValue || '00';
        return `${this.dateValue}T${h}:${m}`;
      } else {
        return null;
      }
    },

    onDateTimeChange() {
      this.dateTimeValidation();
    },

    onDatePickerSelect(date) {
      if (!date) return;
      const d = new Date(date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      this.dateValue = `${yyyy}-${mm}-${dd}`;
      this.dateMenu = false;
      this.dateTimeValidation();
    },

    async dateTimeValidation() {
      const isValid = this.dateValue && this.hourValue !== null && this.minuteValue !== null;
      this.studyDateTimeReady = isValid;
      this.$emit("readyToCreateSchedule");
    },

    resetDateTime() {
      if (this.appointmentTime) {
        const m = moment(this.appointmentTime);
        this.dateValue = m.format("YYYY-MM-DD");
        this.datePickerValue = new Date(this.dateValue + 'T12:00:00');
        this.hourValue = m.hour();
        this.minuteValue = this.snapMinute(m.minute());
        this.studyDateTimeReady = true;
      } else {
        this.dateValue = moment().format("YYYY-MM-DD");
        this.datePickerValue = new Date(this.dateValue + 'T12:00:00');
        this.hourValue = 9;
        this.minuteValue = "00";
        this.studyDateTimeReady = true;
      }
    },

    assignDateTime() {
      if (this.appointmentTime) {
        const m = moment(this.appointmentTime);
        this.dateValue = m.format("YYYY-MM-DD");
        this.datePickerValue = new Date(this.dateValue + 'T12:00:00');
        this.hourValue = m.hour();
        this.minuteValue = this.snapMinute(m.minute());
      } else {
        // Default to today at 09:00
        this.dateValue = moment().format("YYYY-MM-DD");
        this.datePickerValue = new Date(this.dateValue + 'T12:00:00');
        this.hourValue = 9;
        this.minuteValue = "00";
      }
    },

    snapMinute(min) {
      // Snap to nearest 15-minute interval
      const intervals = [0, 15, 30, 45];
      let closest = "00";
      let minDiff = 60;
      for (const iv of intervals) {
        const diff = Math.abs(min - iv);
        if (diff < minDiff) {
          minDiff = diff;
          closest = String(iv).padStart(2, '0');
        }
      }
      return closest;
    }
  },
  computed: {
    studyDateTimeValue() {
      if (this.dateValue && this.hourValue !== null) {
        const h = String(this.hourValue).padStart(2, '0');
        const m = this.minuteValue || '00';
        return `${this.dateValue}  ${h}:${m}`;
      }
      return null;
    },
    dateTimeNotice() {
      if (this.studyDateTimeReady) {
        return `<p style="font-size: 14px; margin: 0px;">Appointment date and time are entered correctly!</p>`;
      } else {
        if (this.dateTimePickerDisable) {
          return `<p style="font-size: 14px; margin: 0px;">No appointment date or time is required</p>`;
        } else {
          return `<p style="color: #ff0000; font-weight: 500; font-size: 14px; margin: 0px;">Please select or update appointment date and time.</p>`;
        }
      }
    }
  },
  watch: {
    appointmentTime(newVal) {
      if (newVal) {
        this.assignDateTime();
      }
    },
    dateValue() {
      this.dateTimeValidation();
    },
  },
  mounted() {
    this.assignDateTime();
    this.dateTimeValidation();
  }
}
</script>
