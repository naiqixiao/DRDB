<template>
  <div style="position: relative; height: 300px; width: 100%">
    <Bar v-if="hasData" :data="chartData" :options="chartOptions" />
    <div v-else class="d-flex align-center justify-center h-100 text-muted font-weight-medium">
      <v-icon class="mr-2">mdi-account-hard-hat</v-icon>
      No experimenter data available
    </div>
  </div>
</template>

<script>
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
  name: "experimenterStatsChart",
  components: { Bar },
  props: {
    stats: {
      type: Array,
      default: () => []
    },
  },
  data() {
    return {
      chartOptions: {
        indexAxis: 'y', // This makes the bar chart horizontal
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            ticks: { precision: 0, font: { family: "'Fira Sans', sans-serif" } },
            border: { dash: [4, 4] },
            grid: { color: '#E2E8F0', drawBorder: false }
          },
          y: {
            stacked: true,
            grid: { display: false },
            ticks: { font: { family: "'Fira Sans', sans-serif" } }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { usePointStyle: true, boxWidth: 8, font: { family: "'Fira Sans', sans-serif" } }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(30, 58, 138, 0.9)',
            titleFont: { family: "'Fira Sans', sans-serif" },
            bodyFont: { family: "'Fira Sans', sans-serif" },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.x !== null) {
                  const value = context.parsed.x;
                  // Calculate total of the horizontal stacked bar
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
      roleColors: {
        'Primary': '#60A5FA',   // Bright Sky Blue
        'Assistant': '#A78BFA'  // Vibrant Violet
      }
    };
  },
  computed: {
    hasData() {
      return this.stats && this.stats.length > 0;
    },
    chartData() {
      if (!this.hasData) return { labels: [], datasets: [] };

      // 1. Extract all unique experimenters for the Y-axis
      const experimenters = [...new Set(this.stats.map(s => s.Experimenter))].filter(Boolean);
      
      // 2. Extract unique roles (usually 'Primary' and 'Assistant')
      const uniqueRoles = [...new Set(this.stats.map(s => s.ROLE))];

      // 3. Build a dataset for each role
      const datasets = uniqueRoles.map(role => {
        const dataForRole = experimenters.map(exp => {
          const record = this.stats.find(s => s.Experimenter === exp && s.ROLE === role);
          return record ? record.NumberOfParticipants : 0;
        });

        return {
          label: role,
          data: dataForRole,
          backgroundColor: this.roleColors[role] || '#CBD5E1',
          borderRadius: 4,
          borderSkipped: false
        };
      });

      return { labels: experimenters, datasets };
    }
  }
};
</script>
