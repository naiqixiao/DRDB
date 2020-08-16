<template>
  <span v-if="date">{{ DateFormat(new Date(date), format) }}</span>
  <span v-else>{{ "TBD" }}</span>
</template>

<script>
import moment from "moment";

export default {
  props: {
    date: String,
    format: String,
  },
  methods: {
    DateFormat(date, format) {
      var formatedDate = "";
      switch (format) {
        case "long":
          if (moment(date).diff(moment(), "days") >= -60) {
            formatedDate = moment(date).format("h:mmA, MMM D (ddd)");
          } else {
            formatedDate = moment(date).format("h:mm, MM/DD/YYYY");
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
