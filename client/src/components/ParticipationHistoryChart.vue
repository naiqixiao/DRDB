<template>
  <v-card name="participationStatistics" outlined height="380px">
    <v-card-text v-if="family.Appointments">
      <doughnut-chart :chart-data="datacollection.chartData" :height="280"></doughnut-chart>
    </v-card-text>
  </v-card>
</template>

<script>
import DoughnutChart from "../plugins/doughnutChart";

export default {
  components: {
    DoughnutChart,
  },
  props: {
    family: Object,
  },
  data() {
    return {
      status: [
        "Completed",
        "Confirmed",
        "Rescheduled",
        "TBD",
        "Rescheduling",
        "No Show",
        "Cancelled",
        "Rejected",
      ],
      colors: [
        "#FF9F1C",
        "#FFC16E",
        "#2EC4B6",
        "#011627",
        "#182B3A",
        "#A91628",
        "#E71D36",
        "#ED5A6C",
      ],
    };
  },

  methods: {},
  computed: {
    datacollection() {
      var schedule = [];
      this.family.Appointments.forEach((appointment) => {
        schedule.push({
          id: appointment.FK_Schedule,
          status: appointment.Schedule.Status,
          AppointmentTime: appointment.Schedule.AppointmentTime,
        });
      });

      const uniqueSchedule = schedule.reduce((schedule, current) => {
        const x = schedule.find((item) => item.id === current.id);
        if (!x) {
          return schedule.concat([current]);
        } else {
          return schedule;
        }
      }, []);

      var scheduleStatus = {};
      var chartIndices = [];

      uniqueSchedule.forEach((schedule) => {
        if (scheduleStatus[schedule.status]) {
          scheduleStatus[schedule.status] += 1;
        } else {
          scheduleStatus[schedule.status] = 1;
          chartIndices.push(this.status.indexOf(schedule.status));
        }
      });

      chartIndices.sort((a, b) => {
        return a - b;
      });

      var chartColors = [];
      var chartStatus = [];

      chartIndices.forEach((index) => {
        chartColors.push(this.colors[index]);
        chartStatus.push(this.status[index]);
      });

      var scheduleCount = [];
      chartStatus.forEach((status) => {
        scheduleCount.push(scheduleStatus[status]);
      });

      return {
        chartData: {
          labels: chartStatus,

          datasets: [
            {
              backgroundColor: chartColors,
              data: scheduleCount,
            },
          ],
        },
        // options: {
        //   title: {
        //     display: true,
        //     text: "Custom Chart Title",
        //   },
        //   width: 200,
        // },
      };
    },
  },
};
</script>

<style>
</style>