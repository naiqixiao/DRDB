<template>
  <v-card name="participationStatistics" outlined height="450px">
    <v-card-text v-if="family.Appointments || family.Schedules">
      <doughnut-chart
        :chart-data="datacollection.chartData"
        :height="280"
      ></doughnut-chart>
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
        "#01579B",
        "#40C4FF",
        "#009688",
        "#00796B",
        "#9E9D24",
        "#EF6C00",
        "#F4511E",
        "#263238",
      ],
    };
  },

  methods: {},
  computed: {
    datacollection() {
      var scheduleStatus = {};
      var chartIndices = [];

      if (this.family.Schedules) {
        this.family.Schedules.forEach((schedule) => {

          if (schedule.Status == "Confirmed" && schedule.Completed) {
            schedule.Status = "Completed";
          }

          if (scheduleStatus[schedule.Status]) {
            scheduleStatus[schedule.Status] += 1;
          } else {
            scheduleStatus[schedule.Status] = 1;
            chartIndices.push(this.status.indexOf(schedule.Status));
          }
        });
      } else {
        var schedule = [];
        this.family.Appointments.forEach((appointment) => {
          schedule.push({
            id: appointment.FK_Schedule,
            status: appointment.Schedule.Status,
            AppointmentTime: appointment.Schedule.AppointmentTime,
            completed: appointment.Schedule.Completed,
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

        uniqueSchedule.forEach((schedule) => {
          if (schedule.status == "Confirmed" && schedule.completed) {
            schedule.status = "Completed";
          }
        });

        uniqueSchedule.forEach((schedule) => {
          if (scheduleStatus[schedule.status]) {
            scheduleStatus[schedule.status] += 1;
          } else {
            scheduleStatus[schedule.status] = 1;
            chartIndices.push(this.status.indexOf(schedule.status));
          }
        });
      }

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

<style></style>
