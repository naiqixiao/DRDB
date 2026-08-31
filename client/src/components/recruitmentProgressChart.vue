<template>
  <div class="chart-viewport">
    <div class="chart-surface" :style="chartSurfaceStyle">
      <Bar v-if="hasData" :data="chartData" :options="chartOptions" />
      <div v-else class="d-flex align-center justify-center h-100 text-muted font-weight-medium">
        <v-icon class="mr-2">mdi-account-search</v-icon>
        No recruitment data available
      </div>
    </div>
  </div>
</template>

<script>
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
  name: "recruitmentProgressChart",
  components: { Bar },
  props: {
    stats: {
      type: Array,
      default: () => []
    },
    researchers: {
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
                  // Calculate total of the stacked bar
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
        'Completed': '#34D399', 
        'Confirmed': '#60A5FA', 
        'TBD': '#A78BFA',       
        'Rescheduling': '#FBBF24',
        'No Show': '#FB923C',   
        'Cancelled': '#F87171', 
        'Rejected': '#94A3B8'   
      }
    };
  },
  computed: {
    hasData() {
      return this.recruiterRoster.length > 0;
    },
    recruiterRoster() {
      const roster = new Map();
      this.researchers.forEach((researcher) => {
        const id = Number(researcher.PersonnelId);
        if (Number.isInteger(id)) roster.set(`id:${id}`, {
          key: `id:${id}`,
          id,
          name: researcher.Name || 'Unknown researcher',
          retired: Boolean(Number(researcher.Retired)),
        });
      });
      this.stats.forEach((stat) => {
        const id = Number(stat.RecruiterId);
        const key = Number.isInteger(id) ? `id:${id}` : `name:${stat.RecruitedBy || 'Unknown researcher'}`;
        if (!roster.has(key)) roster.set(key, {
          key,
          id,
          name: stat.RecruitedBy || 'Unknown researcher',
          retired: Boolean(Number(stat.Retired)),
        });
      });
      return [...roster.values()];
    },
    chartSurfaceStyle() {
      return {
        height: '320px',
        minWidth: `${Math.max(520, this.recruiterRoster.length * 105)}px`,
      };
    },
    chartData() {
      if (!this.hasData) return { labels: [], datasets: [] };

      // 1. Extract all unique recruiters for the X-axis
      const recruiters = this.recruiterRoster;
      
      // 2. Extract all unique statuses present in the data
      const uniqueStatuses = [...new Set(this.stats.map(s => s.Status).filter(Boolean))];
      if (!uniqueStatuses.length) uniqueStatuses.push('No recorded recruitment');

      // 3. Build a dataset for each status
      const datasets = uniqueStatuses.map(status => {
        const dataForStatus = recruiters.map(recruiter => {
          return this.stats
            .filter(stat => {
              const statId = Number(stat.RecruiterId);
              const statKey = Number.isInteger(statId)
                ? `id:${statId}`
                : `name:${stat.RecruitedBy || 'Unknown researcher'}`;
              return statKey === recruiter.key && stat.Status === status;
            })
            .reduce((total, stat) => total + (Number(stat.NumberOfParticipants) || 0), 0);
        });

        return {
          label: status,
          data: dataForStatus,
          backgroundColor: this.statusColors[status] || '#CBD5E1',
          borderRadius: 4,
          borderSkipped: false
        };
      });

      return {
        labels: recruiters.map(researcher => `${researcher.name}${researcher.retired ? ' (Retired)' : ''}`),
        datasets,
      };
    }
  }
};
</script>

<style scoped>
.chart-viewport {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
}

.chart-surface {
  position: relative;
  width: 100%;
}
</style>
