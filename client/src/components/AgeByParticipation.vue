<template>
  <span v-if="item.Schedule && item.Schedule.AppointmentTime">
    {{ AgeByParticipationText(item) }}
  </span>
  <span v-else>
    NA
  </span>
</template>

<script>
export default {
  name: "AgeByParticipation",
  props: {
    item: {
      type: Object,
      required: true
    },
  },
  methods: {
    AgeByParticipationText(item) {
      if (!item.Child || !item.Child.DoB) return "NA";
      
      const Age = Math.floor(
        (new Date(item.Schedule.AppointmentTime) - new Date(item.Child.DoB)) /
          (1000 * 60 * 60 * 24)
      );

      let formated = "Not born yet.";

      if (Age > 0) {
        const years = Math.floor(Age / 365);
        let months = (Age % 365) / 30.5;
        months = months.toFixed(1);
        const Y = years > 0 ? years + " y " : "";
        const M = months + " m";
        formated = Y + M;
      }

      return formated;
    },
  },
};
</script>
