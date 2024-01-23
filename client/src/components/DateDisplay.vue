<template>
  <v-container v-if="date" style = "display: flex; align-content: space-around; flex-wrap: wrap;">

    <body align="start" class='Time' v-html="DateFormat(date, format, status).formatedTime"></body>

    <body align="end" class='Date'  v-html="DateFormat(date, format, status).formatedDate"></body>

  </v-container>
  <v-container v-else>{{ "Not available" }}</v-container>
</template>

<script>
import moment from "moment-timezone";

export default {
  props: {
    date: String,
    format: String,
    status: String,
  },
  methods: {
    DateFormat(date, format, status) {
      var formatedDate = "";
      var formatedTime = "";
      switch (format) {
        case "long":
          if (moment(date).diff(moment(), "days") >= -60) {
            formatedDate = moment(date).tz("America/Toronto").format("MMM DD (ddd)");
            formatedTime = moment(date).tz("America/Toronto").format("hh:mmA");
          } else {
            formatedDate = moment(date).tz("America/Toronto").format("MM/DD/YYYY");
            formatedTime = moment(date).tz("America/Toronto").format("hh:mm");
          }

          if (status != "Confirmed") {
            formatedTime = "[orig.] " + formatedTime;
          }

          break;

        default:
          formatedDate = moment(date).tz("America/Toronto").format("L");
          break;
      }

      return { formatedTime, formatedDate };
    },
    htmlTime(formatedTime) {
      var outputTime = "<span class='Time'>" + formatedTime + "</span>"
      return outputTime
    },
    htmlData(formatedDate) {
      var outputDate = "<span class='Date'>" + formatedDate + "</span>"
      return outputDate
    }
  },
};
</script>

<style scoped>
.Time {
  font-size: 22px;
  font-weight: 900;
  flex: 0 0 100%;
}

.Date {
  font-size: 18px;
  flex: 0 0 100%;
  /* font-weight: 900; */

}
</style>
