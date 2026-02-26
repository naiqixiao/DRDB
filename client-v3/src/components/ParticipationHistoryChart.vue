<template>
  <v-card name="participationStatistics" variant="outlined" height="450px">
    <v-card-text v-if="family?.Appointments || family?.Schedules">
      <div style="position: relative; height: 280px; width: 100%">
        <Doughnut
          :data="datacollection.chartData"
          :options="chartOptions"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

export default {
  name: "ParticipationHistoryChart",
  components: {
    Doughnut,
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
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
      }
    };
  },
  computed: {
    datacollection() {
      const scheduleStatus = {};
      const chartIndices = [];

      if (!this.family) {
        return { chartData: { labels: [], datasets: [] } };
      }

      if (this.family.Schedules && this.family.Schedules.length > 0) {
        this.family.Schedules.forEach((schedule) => {
          let currentStatus = schedule.Status;
          if (currentStatus === "Confirmed" && schedule.Completed) {
            currentStatus = "Completed";
          }

          if (scheduleStatus[currentStatus]) {
            scheduleStatus[currentStatus] += 1;
          } else {
            scheduleStatus[currentStatus] = 1;
            chartIndices.push(this.status.indexOf(currentStatus));
          }
        });
      } else if (this.family.Appointments && this.family.Appointments.length > 0) {
        const schedule = [];
        this.family.Appointments.forEach((appointment) => {
          if (appointment.Schedule) {
            schedule.push({
              id: appointment.FK_Schedule,
              status: appointment.Schedule.Status,
              AppointmentTime: appointment.Schedule.AppointmentTime,
              completed: appointment.Schedule.Completed,
            });
          }
        });

        const uniqueSchedule = schedule.reduce((acc, current) => {
          const x = acc.find((item) => item.id === current.id);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        uniqueSchedule.forEach((sch) => {
          if (sch.status === "Confirmed" && sch.completed) {
            sch.status = "Completed";
          }
        });

        uniqueSchedule.forEach((sch) => {
          if (scheduleStatus[sch.status]) {
            scheduleStatus[sch.status] += 1;
          } else {
            scheduleStatus[sch.status] = 1;
            const idx = this.status.indexOf(sch.status);
            if (idx !== -1) {
              chartIndices.push(idx);
            }
          }
        });
      }

      chartIndices.sort((a, b) => a - b);

      const chartColors = [];
      const chartStatus = [];

      chartIndices.forEach((index) => {
        chartColors.push(this.colors[index]);
        chartStatus.push(this.status[index]);
      });

      const scheduleCount = [];
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
      };
    },
  },
};
</script>

<style scoped>
</style>
