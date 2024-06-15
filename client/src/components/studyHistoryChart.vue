<template>
  <div ref="chart" class="histogramChart"></div>
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
  name: "histogramChart",
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
        background: null,
        data: {
          values: this.stats,
        },
        // width: 700,
        config: {
          title: { fontSize: 24, offset: 40 },
          axis: {
            domain: false,
            labelFontSize: 18,
            titleFontSize: 24,
          },
          headerFacet: { titleFontSize: 14, labelFontSize: 14 },
          text: { fontSize: 18 },
          //   legend: {
          //     titleFontSize: 24,
          //     labelFontSize: 18,
          //     offset: 40,
          //     orient: "bottom",
          //     layout: { bottom: { anchor: "middle" } },
          //   },
        },
        title: "Number of participants recruited per week",
        facet: {
          field: "Status",
          legend: null,
          type: "nominal",
          title: "",
          header: {
            titleColor: "black",
            titleFontSize: 24,
            titleAnchor: "start",
            labelColor: "balck",
            labelFontSize: 24,
            labelAnchor: "start",
            labelAlign: "left",
            labelPadding: 0,
            labelFontWeight: "bold",
          },
          sort: [
            "Confirmed",
            "TBD",
            "Rescheduling",
            "No Show",
            "Cancelled",
            "Rejected",
          ],
        },
        spacing: 40,
        columns: 2,
        resolve: { axis: { y: "independent" }, scale: { y: "independent" } },
        spec: {
          width: 500,
          layer: [
            {
              selection: { brush: { type: "interval", encodings: ["x"] } },
              mark: "bar",
              transform: [
                {
                  calculate:
                    "datetime(datetime(datum.WeekStartDate) + 7 * 24 * 60 * 60 * 1000)",
                  as: "NextWeekDate",
                },
              ],
              encoding: {
                x: {
                  title: null,
                  binned: true,
                  timeUnit: "binnedyearweek",
                  field: "WeekStartDate",
                  type: "temporal",
                  axis: { labelAngle: -30, format: "%Y-%b" },
                  scale: { zero: false },
                  // "bin": {"maxbins": 160},
                },
                x2: {
                  field: "NextWeekDate",
                  timeUnit: "binnedyearweek",
                  type: "temporal",
                },
                y: {
                  aggregate: "mean",
                  title: "N of participants",
                  field: "NumberOfParticipants",
                  type: "quantitative",
                  scale: { zero: false },
                },
                tooltip: [
                  { field: "WeekStartDate", type: "temporal" },
                  {
                    field: "NumberOfParticipants",
                    type: "quantitative",
                    title: "N of participants",
                  },
                ],
                color: {
                  field: "Status",
                  type: "nominal",
                  scale: {
                    domain: [
                      "Confirmed",
                      "TBD",
                      "Rescheduling",
                      "No Show",
                      "Cancelled",
                      "Rejected",
                    ],
                    range: [
                      "#4E4E4E",
                      "#FFBF78",
                      "#ACD793",
                      "#BC5A94",
                      "#C80036",
                      "#EE4E4E",
                    ],
                  },
                  sort: [
                    "Confirmed",
                    "TBD",
                    "Rescheduling",
                    "No Show",
                    "Cancelled",
                    "Rejected",
                  ],
                  legend: null,
                },
                opacity: {
                  condition: { selection: "brush", value: 1 },
                  value: 0.7,
                },
              },
            },
            {
              transform: [
                { filter: { selection: "brush" } },
                {
                  aggregate: [
                    {
                      op: "mean",
                      field: "NumberOfParticipants",
                      as: "total_value",
                    },
                  ],
                  groupby: ["WeekStartDate"],
                },
              ],
              mark: "rule",
              encoding: {
                y: {
                  aggregate: "mean",
                  field: "total_value",
                  type: "quantitative",
                },
                tooltip: [
                  {
                    aggregate: "mean",
                    field: "total_value",
                    type: "quantitative",
                    title: "Mean",
                    format: ".0f",
                  },
                ],
                color: { value: "firebrick" },
                size: { value: 3 },
              },
            },
            {
              transform: [
                { filter: { selection: "brush" } },
                {
                  aggregate: [
                    {
                      op: "mean",
                      field: "NumberOfParticipants",
                      as: "total_value",
                    },
                  ],
                  groupby: ["YearMonth"],
                },
                {
                  aggregate: [
                    { op: "mean", field: "total_value", as: "mean_value" },
                  ],
                },
                {
                  calculate:
                    "'Mean N per week: ' + format(datum.mean_value, '.0f')",
                  as: "mean_label",
                },
              ],
              mark: {
                type: "text",
                x: 380,
                y: 20,
                xOffset: 0,
                yOffset: 0,
                color: "black",
              },
              encoding: { text: { field: "mean_label", type: "nominal" } },
            },
          ],
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
.histogramChart {
  padding: 20px;
}
</style>
