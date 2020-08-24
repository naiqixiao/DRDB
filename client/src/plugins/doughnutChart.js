import { Doughnut, mixins } from 'vue-chartjs'
const { reactiveProp } = mixins

export default {
  extends: Doughnut,
  mixins: [reactiveProp],
  mounted() {
    // this.chartData is created in the mixin.
    // If you want to pass options please create a local options object
    var options = {
      title: {
        display: true,
        text: "Participation history",
        fontSize: 16
      },
      legend: {
        position: "right",
        align: "start"
      },
      animation: {
        duration: 300
      },

    };

    this.renderChart(this.chartData, options)
  }
}