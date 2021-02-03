<template>
  <v-card name="participationStatistics" outlined height="450px">
    <v-card-text v-if="family.Appointments">
      <!-- {{ "Number of participated studies: " + family.Appointments.length }} -->
      <GChart
        type="PieChart"
        :data="scheduleStatistics().chartData"
        :options="scheduleStatistics().chartOptions"
      />
    </v-card-text>
  </v-card>
</template>

<script>
import { GChart } from "vue-google-charts";

export default {
  components: { GChart },
  props: {
    family: Object
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
        "Rejected"
      ],
      colors: [
        "#FF9F1C",
        "#FFC16E",
        "#2EC4B6",
        "#011627",
        "#182B3A",
        "#A91628",
        "#E71D36",
        "#ED5A6C"
      ]
    };
  },

  methods: {
    scheduleStatistics() {
      var schedule = [];
      this.family.Appointments.forEach(appointment => {
        schedule.push({
          id: appointment.FK_Schedule,
          status: appointment.Schedule.Status,
          AppointmentTime: appointment.Schedule.AppointmentTime
        });
      });

      const uniqueSchedule = schedule.reduce((schedule, current) => {
        const x = schedule.find(item => item.id === current.id);
        if (!x) {
          return schedule.concat([current]);
        } else {
          return schedule;
        }
      }, []);

      var scheduleStatus = {};
      var chartIndices = [];

      uniqueSchedule.forEach(schedule => {
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

      chartIndices.forEach(index => {
        chartColors.push(this.colors[index]);
        chartStatus.push(this.status[index]);
      });

      var chartData = [["Status", "Count"]];

      chartStatus.forEach(status => {
        chartData.push([status, scheduleStatus[status]]);
      });

      var chartOptions = {
        colors: chartColors,
        title: "Family participation history",
        width: 400,
        height: 300,
        chartArea: { left: 20, top:40, width: "80%", height: "80%" },
        fontSize: 12,
        backgroundColor: { fill: "transparent" },
        titleTextStyle: {
          fontSize: 18,
          bold: true
        }
      };

      return { chartData: chartData, chartOptions: chartOptions };
    }
  }
};
</script>

<style scoped></style>
