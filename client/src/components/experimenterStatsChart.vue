<template>
  <div ref="chart" class="barChart"></div>
</template>

<script>
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default {
  name: "ProgressChart",
  props: {
    stats: Array,
  },

  async mounted() {
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/vega@5.25.0");
      await loadScript("https://cdn.jsdelivr.net/npm/vega-lite@5.16.3");
      await loadScript("https://cdn.jsdelivr.net/npm/vega-embed@6.22.2");
      this.renderChart();
    } catch (error) {
      console.error("Failed to load Vega scripts", error);
    }
  },

  methods: {
    renderChart() {
      if (typeof window.vegaEmbed === "undefined") {
        console.error("vegaEmbed is not loaded");
        return;
      }

      const spec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        width: 450,
        "height": {"step": 40},
        background: null,
        // "description": "Pie chart of participants' statuses for the study 'EmotionConsistency'.",
        data: {
          values: this.stats,
        },
        config: {
          title: {
            fontSize: 24,
            offset: 40,
          },
          axis: {
            domain: false,
            labelFontSize: 18,
            titleFontSize: 24,
          },
          headerFacet: {
            titleFontSize: 14,
            labelFontSize: 14,
          },
          text: {
            fontSize: 18,
          },
          legend: {
            titleFontSize: 24,
            labelFontSize: 18,
            offset: 40,
            orient: "top",
            layout: { top: { anchor: "middle" } },
          },
        },
        title: "Experimenter Stats",
        mark: { type: "bar", "height": 25, tooltip: true },
        encoding: {
          x: {
            aggregate: "sum",
            field: "NumberOfParticipants",
            title: "N of participants",
            scale: { zero: false },
          },
          y: {
            field: "Experimenter",
            type: "nominal",
            title: null,
            scale: { zero: false },
          },
          color: {
            field: "ROLE",
            type: "nominal",
            title: "Role",
            sort: "descending",
            scale: { range: ["#cccc00", "#ae2c21", "#4daf4a"] },
          },
        },
      };

      window
        .vegaEmbed(this.$refs.chart, spec, { actions: false })
        .then((result) => {
          // You can access the Vega view instance via result.view
          console.log("Vega view instance", result.view);
        })
        .catch((error) => console.error(error));
    },
  },
  watch: {
    stats(newVal) {
      if (newVal) {
        this.renderChart();
      }
    },
  },
};
</script>

<style scoped>
.barChart {
  padding: 20px;
}
</style>
