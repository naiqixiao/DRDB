<template>
  <div style="position: relative; height: 350px; width: 100%">
    <Bar v-if="hasData" :data="chartData" :options="chartOptions" />
    <div v-else-if="loading" class="d-flex align-center justify-center h-100 text-muted font-weight-medium">
      <v-progress-circular indeterminate color="primary" size="32" class="mr-3"></v-progress-circular>
      Loading global statistics...
    </div>
    <div v-else class="d-flex align-center justify-center h-100 text-muted font-weight-medium">
      <v-icon class="mr-2">mdi-chart-bar-off</v-icon>
      No global recruitment data available
    </div>
  </div>
</template>

<script>
import appointment from "@/services/appointment";
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import moment from 'moment'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
  name: "HistogramChart",
  components: { Bar },
  data() {
    return {
      rawData: [],
      loading: true,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { 
              font: { family: "'Fira Sans', sans-serif" },
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'N of Participants',
              font: { family: "'Fira Sans', sans-serif", weight: 'bold' }
            },
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
      // Color palette for different study types
      typeColors: {
        'Behavioural': '#3B82F6',  // Blue
        'Online': '#10B981',       // Green
        'EEG/ERP': '#8B5CF6',      // Purple
        'EyeTracking': '#F59E0B',  // Amber
        'fNIRS': '#EC4899',        // Pink
      }
    };
  },
  computed: {
    hasData() {
      return this.rawData && this.rawData.length > 0;
    },
    chartData() {
      if (!this.hasData) return { labels: [], datasets: [] };

      // 1. Extract all unique months (Chronological sort)
      const uniqueMonths = [...new Set(this.rawData.map(d => d.YearMonth))]
        .sort((a, b) => new Date(a) - new Date(b));
      
      // Format labels for X-axis (e.g. "Apr 2021")
      const labels = uniqueMonths.map(date => moment(date, "MMM D YYYY").format('MMM YYYY'));

      // 2. Extract all unique Study Types present in the data
      const uniqueTypes = [...new Set(this.rawData.map(d => d.StudyType))].filter(Boolean);

      // 3. Build a dataset for each Study Type
      const datasets = uniqueTypes.map((type, index) => {
        const dataForType = uniqueMonths.map(month => {
          // Find if there is a record for this month AND this study type
          const record = this.rawData.find(d => d.YearMonth === month && d.StudyType === type);
          return record ? record.NumberOfParticipants : 0;
        });

        // Use predefined color or fallback to a generated color based on index
        const colorPalette = Object.values(this.typeColors);
        const bgColor = this.typeColors[type] || colorPalette[index % colorPalette.length];

        return {
          label: type,
          data: dataForType,
          backgroundColor: bgColor,
          borderRadius: 4,
          borderSkipped: false
        };
      });

      return { labels, datasets };
    }
  },
  async mounted() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const response = await appointment.monthYearN();
        // Depending on your API, response.data might be an array of arrays or just the array.
        // Assuming it's wrapped based on your previous Vega implementation:
        this.rawData = response.data[0] || response.data; 
      } catch (error) {
        console.error("Failed to fetch histogram data", error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
