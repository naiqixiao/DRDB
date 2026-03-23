<template>
  <span>
    {{ studyNames(item) }}
  </span>
</template>

<script>
export default {
  props: {
    item: {},
  },
  methods: {
    studyNames(item) {
      var studyName = [];
      item.Appointments.forEach((appointment) => {
        studyName.push(appointment.Study.StudyName);
      });

      studyName = Array.from(new Set(studyName));
      return studyName.join(', ');
    },
  },
};
</script>

<style lang="scss" scoped></style>
