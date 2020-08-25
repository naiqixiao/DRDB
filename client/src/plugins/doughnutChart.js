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
        fontSize: 18,
        fontColor: "#344955",
        fontStyle: "bold",
        padding: 8
      },
      legend: {
        position: "right",
        align: "end",
        boxWidth: 15,
        fontColor: "#344955",
        padding: 4
      },
      animation: {
        duration: 700,
      },

    };

    this.renderChart(this.chartData, options)
  }
}