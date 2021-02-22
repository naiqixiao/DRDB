<template>
  <span v-if="item.Schedule.AppointmentTime">
    {{ AgeByParticipation(item) }}
  </span>
  <span v-else>
    {{ "NA" }}
  </span>
</template>

<script>
export default {
  props: {
    item: {},
  },
  methods: {
    AgeByParticipation(item) {
      var Age = Math.floor(
        (new Date(item.Schedule.AppointmentTime) - new Date(item.Child.DoB)) /
          (1000 * 60 * 60 * 24)
      );

      var formated = "Not born yet.";

      if (Age > 0) {
        var years = Math.floor(Age / 365);
        var months = (Age % 365) / 30.5;
        months = months.toFixed(1);
        // var days = Math.floor((Age % 365) % 30.5);
        var Y = years > 0 ? years + " y " : "";
        var M = months + " m";
        formated = Y + M;
      }

      return formated;
    },
  },
};
</script>
<style lang="scss" scoped></style>
