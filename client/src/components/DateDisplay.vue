<template>
  <span v-if="date">
    {{ DateFormat(new Date(date), format) }}
  </span>
  <span v-else>
    {{ "TBD" }}
  </span>
</template>

<script>
import moment from "moment";

export default {
  props: {
    date: String,
    format: String
  },
  methods: {
    DateFormat(date, format) {
      var formatedDate = "";
      switch (format) {
        case "long":
          formatedDate = moment(date).format("MMM D (ddd), YYYY [at] hA");
          break;

        default:
          formatedDate = moment(date).format("L");
          break;
      }

      return formatedDate;
    }
  }
};
</script>
<style lang="scss" scoped></style>
