<template>
  <v-container v-if="date" class="d-flex align-content-space-around flex-wrap">
    <div class="Time text-start w-100" v-html="DateFormat(date, format, status).formatedTime"></div>
    <div class="Date text-end w-100" v-html="DateFormat(date, format, status).formatedDate"></div>
  </v-container>
  <v-container v-else>Not available</v-container>
</template>

<script>
import moment from "moment-timezone";

export default {
  name: "DateDisplay",
  props: {
    date: String,
    format: String,
    status: String,
  },
  methods: {
    DateFormat(date, format, status) {
      let formatedDate = "";
      let formatedTime = "";
      switch (format) {
        case "long":
          if (moment(date).diff(moment(), "days") >= -60) {
            formatedDate = moment(date).tz("America/Toronto").format("MMM DD (ddd)");
            formatedTime = moment(date).tz("America/Toronto").format("hh:mmA");
          } else {
            formatedDate = moment(date).tz("America/Toronto").format("MM/DD/YYYY");
            formatedTime = moment(date).tz("America/Toronto").format("hh:mm");
          }

          if (status !== "Confirmed" && status !== "Completed") {
            formatedTime = "[orig.] " + formatedTime;
          }
          break;

        default:
          formatedDate = moment(date).tz("America/Toronto").format("L");
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
