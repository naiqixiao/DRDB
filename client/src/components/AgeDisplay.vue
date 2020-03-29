<template>
  <span v-if="DoB">
    {{ AgeFormated(DoB) }}
  </span>
</template>

<script>
export default {
  props: {
    DoB: String
  },
  methods: {
    AgeFormated(DoB) {

      var Age = Math.floor(
        (new Date() - new Date(DoB)) /
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
