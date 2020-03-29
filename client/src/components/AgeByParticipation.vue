<template>
  <span v-if="item.AppointmentTime">
    {{ AgeByParticipation(item) }}
  </span>
  <span v-else>
    {{ "TBD" }}
  </span>
</template>

<script>
export default {
  props: {
    item: {}
  },
  methods: {
    AgeByParticipation(item) {
      var Age = Math.floor(
        (new Date(item.AppointmentTime) - new Date(item.Child.DoB)) /
          (1000 * 60 * 60 * 24)
      );

      var years = Math.floor(Age / 365);
      var months = (Age % 365) / 30.5;
      months = months.toFixed(1)
      // var days = Math.floor((Age % 365) % 30.5);
      var Y = years > 0 ? years + " year(s) " : "";
      var M = months + " month(s)";
      var formated = Y + M;
      return formated;
    }
  }
};
</script>
<style lang="scss" scoped></style>
