<template>
  <span>
    {{ childNames(item) }}
  </span>
</template>

<script>
export default {
  props: {
    item: {},
  },
  methods: {
    childNames(item) {
      var childNames = [];
      item.Appointments.forEach((appointment) => {
        childNames.push(appointment.Child.Name);
      });

      childNames = Array.from(new Set(childNames));

      return childNames.join(', ');
    },
  },
};
</script>
<style lang="scss" scoped></style>
