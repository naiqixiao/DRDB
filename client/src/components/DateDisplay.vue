<template>
  <v-container v-if="date" class="d-flex align-content-space-around flex-wrap">
    <div class="Time text-start w-100" v-html="DateFormat(date, format, status).formatedTime"></div>
    <div class="Date text-end w-100" v-html="DateFormat(date, format, status).formatedDate"></div>
  </v-container>
  <v-container v-else>Not available</v-container>
</template>

<script>
import moment from "moment-timezone";
import { useMainStore } from "@/stores/mainStore";

export default {
  name: "DateDisplay",
  setup() {
    const store = useMainStore();
    return { store };
  },
  props: {
    date: String,
    format: String,
    status: String,
  },
  methods: {
    DateFormat(date, format, status) {
      let formatedDate = "";
      let formatedTime = "";
      const tz = this.store.timeZone || "America/Toronto";

      switch (format) {
        case "long":
          if (moment(date).diff(moment(), "days") >= -60) {
            formatedDate = moment(date).tz(tz).format("MMM DD (ddd)");
            formatedTime = moment(date).tz(tz).format("hh:mmA");
          } else {
            formatedDate = moment(date).tz(tz).format("MM/DD/YYYY");
            formatedTime = moment(date).tz(tz).format("hh:mm");
          }

          if (status !== "Confirmed" && status !== "Completed") {
            formatedTime = "[orig.] " + formatedTime;
          }
          break;

        default:
          formatedDate = moment(date).tz(tz).format("L");
          break;
      }

      return { formatedTime, formatedDate };
    }
  },
};
</script>

<style scoped>
.Time {
  font-size: 22px;
  font-weight: 900;
}

.Date {
  font-size: 18px;
}
</style>
