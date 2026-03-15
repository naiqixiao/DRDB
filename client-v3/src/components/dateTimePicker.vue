<template>
  <v-form ref="validScheduleDateTime" v-model="validScheduleDateTime" lazy-validation>
    <v-container
      class="pa-0 d-flex align-center"
      style="gap: 16px;"
    >
      <v-text-field
        ref="studyDateTimeInput"
        label="Date & Time"
        type="datetime-local"
        v-model="studyDateTimeValue"
        :disabled="dateTimePickerDisable"
        @update:model-value="dateTimeValidation"
        hide-details
        variant="outlined"
        density="compact"
        style="max-width: 250px; flex-shrink: 0;"
      ></v-text-field>

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
      studyDateTimeValue: null,
    }
  },
  methods: {
    studyDateTime() {
      if (this.studyDateTimeValue) {
        return moment(this.studyDateTimeValue).format("YYYY-MM-DDTHH:mm");
      } else {
        return null;
      }
    },

    async dateTimeValidation() {
      if (this.$refs.validScheduleDateTime) {
        const validation = await this.$refs.validScheduleDateTime.validate();
        this.studyDateTimeReady = (validation.valid && (this.studyDateTimeValue !== null));
        this.$emit("readyToCreateSchedule");
      }
    },

    resetDateTime() {
      if (this.appointmentTime) {
        this.studyDateTimeValue = moment(this.appointmentTime).format("YYYY-MM-DDTHH:mm");
        this.studyDateTimeReady = true;
      } else {
        this.studyDateTimeValue = null;
        this.studyDateTimeReady = false;
      }
    },

    assignDateTime() {
      if (this.appointmentTime) {
        this.studyDateTimeValue = moment(this.appointmentTime).format("YYYY-MM-DDTHH:mm");
      } else {
        this.studyDateTimeValue = null;
      }
    }
  },
  computed: {
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
    studyDateTimeValue(newVal) {
      if (newVal) {
        this.dateTimeValidation();
      }
    },
  },
  mounted() {
    this.assignDateTime();
  }
}
</script>
