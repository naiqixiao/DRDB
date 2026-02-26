<template>
  <v-form ref="validScheduleDateTime" v-model="validScheduleDateTime" lazy-validation>
    <v-container
      class="pa-0 d-flex flex-wrap justify-start align-center"
      style="gap: 16px; min-height: 80px"
    >
      <h2 class="text-left ma-0 pe-4">Study date & time:</h2>

      <v-text-field
        ref="studyDate"
        label="Study date (YYYY-MM-DD)"
        v-model="studyDate"
        :rules="$rules.dob"
        :disabled="dateTimePickerDisable"
        hide-details
        prepend-inner-icon="mdi-calendar"
        @click:prepend-inner="datePicker = true"
        @click="datePicker = true"
        variant="filled"
        density="compact"
        style="max-width: 250px;"
      ></v-text-field>

      <v-combobox
        v-model="studyTime"
        :items="$studyTimeSlots"
        :rules="$rules.time"
        @update:model-value="dateTimeValidation"
        label="Study time"
        prepend-inner-icon="mdi-clock-time-nine-outline"
        :disabled="dateTimePickerDisable"
        hide-details
        variant="filled"
        density="compact"
        style="max-width: 200px;"
      ></v-combobox>
      <v-spacer></v-spacer>

      <v-dialog v-model="datePicker" max-width="360px">
        <v-card variant="outlined">
          <v-date-picker
            v-model="studyDateObj"
            show-current
            @update:model-value="datePick"
          ></v-date-picker>
        </v-card>
      </v-dialog>
    </v-container>

    <div class="text-center mt-2" v-html="dateTimeNotice"></div>
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
      datePicker: false,
      studyDateTimeReady: false,
      validScheduleDateTime: true,
      studyDate: null,
      studyDateObj: null,
      studyTime: null,
    }
  },
  methods: {
    datePick(val) {
      if (val) {
        this.studyDate = moment(val).format("YYYY-MM-DD");
      }
      this.datePicker = false;
      setTimeout(() => {
        if (this.$refs.studyDate && this.$refs.studyDate.$el) {
           const input = this.$refs.studyDate.$el.querySelector('input');
           if(input) input.focus();
        }
      }, 100);
    },

    extractHourAndMinute(timeString) {
      const parts = timeString.split(':');
      let hour = parseInt(parts[0], 10);
      const minute = parseInt(parts[1].substring(0, 2), 10);
      const amPm = parts[1].substring(2).toUpperCase();

      if (amPm === 'PM' && hour !== 12) {
        hour += 12;
      } else if (amPm === 'AM' && hour === 12) {
        hour = 0;
      }

      return { hour, minute };
    },

    studyDateTime() {
      if (this.studyTime && this.studyDate) {
        const { hour, minute } = this.extractHourAndMinute(this.studyTime);

        const StudyHour = hour.toString().padStart(2, '0');
        const StudyMin = minute.toString().padStart(2, '0');

        return this.studyDate + "T" + StudyHour + ":" + StudyMin;
      } else {
        return null;
      }
    },

    async dateTimeValidation() {
      if (this.$refs.validScheduleDateTime) {
        const validation = await this.$refs.validScheduleDateTime.validate();
        this.studyDateTimeReady = (validation.valid && (this.studyTime !== null) && (this.studyDate !== null));
        this.$emit("readyToCreateSchedule");
      }
    },

    resetDateTime() {
      if (this.appointmentTime) {
        this.studyDate = moment(this.appointmentTime).format("YYYY-MM-DD");
        this.studyDateObj = new Date(this.appointmentTime);
        this.studyTime = moment(this.appointmentTime).format("hh:mmA");
        this.studyDateTimeReady = true;
      } else {
        this.studyDate = null;
        this.studyDateObj = null;
        this.studyTime = null;
        this.studyDateTimeReady = false;
      }
    },

    assignDateTime() {
      if (this.appointmentTime) {
        this.studyDate = moment(this.appointmentTime).format("YYYY-MM-DD");
        this.studyDateObj = new Date(this.appointmentTime);
        this.studyTime = moment(this.appointmentTime).format("hh:mmA");
      } else {
        this.studyDate = null;
        this.studyDateObj = null;
        this.studyTime = null;
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
    studyDate(newVal) {
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
