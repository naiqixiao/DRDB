<template>
  <span v-if="date">{{ DateFormat(new Date(date), format, status) }}</span>
  <span v-else>{{ "Not available" }}</span>
</template>

<script>
import moment from "moment";

export default {
  props: {
    date: String,
    format: String,
    status: String,
  },
  methods: {
    DateFormat(date, format, status) {
      var formatedDate = "";
      switch (format) {
        case "long":
          if (moment(date).diff(moment(), "days") >= -60) {
            formatedDate = moment(date).format("h:mmA, MMM D (ddd)");
          } else {
            formatedDate = moment(date).format("h:mm, MM/DD/YYYY");
          }

          if (status != "Confirmed") {
            formatedDate = "[orig.] " + formatedDate;
          }
          
          break;

        default:
          formatedDate = moment(date).format("L");
          break;
      }

      return formatedDate;
    },
  },
};
</script>
<style lang="scss" scoped></style>
