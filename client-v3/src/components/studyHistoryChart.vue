<template>
  <div style="position: relative; height: 300px; width: 100%">
    <Bar v-if="hasData" :data="chartData" :options="chartOptions" />
    <div v-else class="d-flex align-center justify-center h-100 text-muted font-weight-medium">
      <v-icon class="mr-2">mdi-chart-bar</v-icon>
      No recruitment history available
    </div>
  </div>
</template>

<script>
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import moment from 'moment'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
  name: "studyHistoryChart",
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
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { font: { family: "'Fira Sans', sans-serif" } }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { precision: 0, font: { family: "'Fira Sans', sans-serif" } },
            border: { dash: [4, 4] },
            grid: { color: '#E2E8F0', drawBorder: false }
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
                if (context.parsed.y !== null) {
                  const value = context.parsed.y;
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
        'Completed': '#10B981', 
        'Confirmed': '#3B82F6', 
        'TBD': '#94A3B8',       
        'Rescheduling': '#F59E0B',
        'No Show': '#F97316',   
        'Cancelled': '#EF4444', 
        'Rejected': '#475569'   
      }
    };
  },
  computed: {
    hasData() {
      return this.stats && this.stats.length > 0;
    },
    chartData() {
      if (!this.hasData) return { labels: [], datasets: [] };

      // 1. Extract and sort all unique weeks
      const uniqueWeeks = [...new Set(this.stats.map(s => s.WeekStartDate))].sort((a, b) => new Date(a) - new Date(b));
      
      // 2. Format labels for X-axis
      const labels = uniqueWeeks.map(date => moment(date).format('MMM D, YYYY'));

      // 3. Extract all unique statuses present in the data
      const uniqueStatuses = [...new Set(this.stats.map(s => s.Status))];

      // 4. Build a dataset for each status
      const datasets = uniqueStatuses.map(status => {
        const dataForStatus = uniqueWeeks.map(week => {
          // Find if there is a record for this week AND this status
          const record = this.stats.find(s => s.WeekStartDate === week && s.Status === status);
          return record ? record.NumberOfParticipants : 0;
        });

        return {
          label: status,
          data: dataForStatus,
          backgroundColor: this.statusColors[status] || '#CBD5E1',
          borderRadius: 4,
          borderSkipped: false
        };
      });

      return { labels, datasets };
    }
  }
};
</script>
