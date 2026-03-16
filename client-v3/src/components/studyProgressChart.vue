<template>
  <div style="position: relative; height: 300px; width: 100%">
    <Doughnut v-if="hasData" :data="chartData" :options="chartOptions" :plugins="[centerTextPlugin]" />
    <div v-else class="d-flex align-center justify-center h-100 text-muted font-weight-medium">
      <v-icon class="mr-2">mdi-chart-donut-variant</v-icon>
      No data available yet
    </div>
  </div>
</template>

<script>
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

export default {
  name: "studyProgressChart",
  components: { Doughnut },
  props: { stats: { type: Array, default: () => [] } },
  data() {
    return {
      // 1. Define the custom plugin locally
      centerTextPlugin: {
        id: 'centerText',
        beforeDraw(chart) {
          const { width, height, ctx } = chart;
          ctx.restore();
          
          // Calculate the total N
          const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          
          // Draw the Number
          const fontSize = (height / 120).toFixed(2);
          ctx.font = `bold ${fontSize}em 'Fira Sans', sans-serif`;
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#1E3A8A"; // var(--color-primary)
          const text = `${total}`;
          const textX = Math.round((width - ctx.measureText(text).width) / 2);
          const textY = height / 2 - 10;
          ctx.fillText(text, textX, textY);
          
          // Draw the Subtitle
          ctx.font = `normal ${(fontSize * 0.35).toFixed(2)}em 'Fira Sans', sans-serif`;
          ctx.fillStyle = "#64748B"; // text-muted
          const subText = "Participants";
          const subX = Math.round((width - ctx.measureText(subText).width) / 2);
          ctx.fillText(subText, subX, textY + 28);
          ctx.save();
        }
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%', // Thinner ring looks more elegant
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { family: "'Fira Sans', sans-serif", size: 13 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(30, 58, 138, 0.9)',
            titleFont: { family: "'Fira Sans', sans-serif", size: 14 },
            bodyFont: { family: "'Fira Sans', sans-serif", size: 14 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) label += ': ';
                if (context.parsed !== null) {
                  const value = context.parsed;
                  // Calculate total of the stacked bar or doughnut
                  const total = context.chart._metasets[context.datasetIndex].total || 
                                context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((value / total) * 100) + '%' : '0%';
                  label += `${value} (${percentage})`;
                }
                return label;
              }
            }
          }
        }
      },
      statusColors: {
        'Completed': '#10B981', // Success green
        'Confirmed': '#3B82F6', // Primary blue
        'TBD': '#94A3B8',       // Slate grey
        'Rescheduling': '#F59E0B',// Warning amber
        'No Show': '#F97316',   // Orange
        'Cancelled': '#EF4444', // Error red
        'Rejected': '#475569'   // Dark slate
      }
    };
  },
  computed: {
    hasData() {
      return this.stats && this.stats.length > 0;
    },
    chartData() {
      if (!this.hasData) return { labels: [], datasets: [] };

      const labels = [];
      const data = [];
      const backgroundColors = [];

      // Sort stats so Completed/Confirmed are always first
      const sortedStats = [...this.stats].sort((a, b) => b.NumberOfParticipants - a.NumberOfParticipants);

      sortedStats.forEach(stat => {
        labels.push(stat.Status);
        data.push(stat.NumberOfParticipants);
        backgroundColors.push(this.statusColors[stat.Status] || '#CBD5E1');
      });

      return {
        labels,
        datasets: [{
          data,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      };
    }
  }
};
</script>
