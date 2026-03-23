<template>
  <span v-if="item.AppointmentTime">
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
      var AppointmentTime = item.AppointmentTime;

      var ages = [];
      item.Appointments.forEach((appointment) => {
        var Age = Math.floor(
          (new Date(AppointmentTime) - new Date(appointment.Child.DoB)) /
            (1000 * 60 * 60 * 24)
        );

        var years = Math.floor(Age / 365);
        var months = (Age % 365) / 30.5;
        months = months.toFixed(1);
        // var days = Math.floor((Age % 365) % 30.5);
        var Y = years > 0 ? years + "y " : "";
        var M = months + "m";
        var formated = Y + M;
        ages.push(formated);
      });

      ages = Array.from(new Set(ages));

      return ages.join(", ");
    },
  },
};
</script>
<style lang="scss" scoped></style>
