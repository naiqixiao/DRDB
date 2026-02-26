<template>
  <div ref="chart" class="histogram"></div>
</template>

<script>
import appointment from "@/services/appointment";

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
  name: "HistogramChart",

  async mounted() {
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/vega@5.25.0");
      await loadScript("https://cdn.jsdelivr.net/npm/vega-lite@5.16.3");
      await loadScript("https://cdn.jsdelivr.net/npm/vega-embed@6.22.2");
      this.fetchData();
    } catch (error) {
      console.error("Failed to load Vega scripts", error);
    }
  },

  methods: {
    async fetchData() {
      // Fetch data from the server
      try {
        const response = await appointment.monthYearN();
        const data = await response.data[0];
        // console.log('Data', data)
        this.renderChart(data);
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    },

    renderChart(data) {
      if (typeof window.vegaEmbed === "undefined") {
        console.error("vegaEmbed is not loaded");
        return;
      }

      const spec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        width: 900,
        background: null,
        signals: [
          {
            name: "xdom",
            update: "domain('x')",
          },
          {
            name: "xzoom",
            value: 1,
            on: [
              {
                events: {
                  type: "wheel",
                  filter: ["!event.ctrlKey", "event.deltaY > 0"],
                },
                update: "clamp(xzoom * 1.1, 1, 10)",
              },
              {
                events: {
                  type: "wheel",
                  filter: ["!event.ctrlKey", "event.deltaY < 0"],
                },
                update: "clamp(xzoom / 1.1, 1, 10)",
              },
            ],
          },
          {
            name: "xpan",
            value: 0,
            on: [
              {
                events: { type: "mousedown", filter: "event.button === 0" },
                update: "[xdom[0], xdom[1]]",
              },
              {
                events: { type: "mousemove", filter: "event.buttons === 1" },
                update:
                  "clampRange([xdom[0] - (event.dx / width) * (xdom[1] - xdom[0]), xdom[1] - (event.dx / width) * (xdom[1] - xdom[0])], 0, 1)",
              },
            ],
          },
        ],

        data: {
          values: data,
        },

        title:
          "Number of infant/child participants recruited throughout the years (combinded across all labs)",
        config: {
          view: {
            strokeWidth: 0,
            step: 30,
          },
          title: {
            fontSize: 24,
            offset: 32,
          },
          axis: {
            domain: false,
            labelFontSize: 20,
            titleFontSize: 18,
          },
          text: {
            fontSize: 14,
            fontWeight: "bold",
          },
          legend: {
            titleFontSize: 20,
            labelFontSize: 18,
            orient: "right",
            layout: { right: { anchor: "middle" } },
          },
        },
        layer: [
          {
            selection: {
              brush: {
                type: "interval",
                encodings: ["x"],
              },
            },

            mark: "bar",
            transform: [
              {
                calculate: "datum.Month + ' ' + datum.Year",
                as: "Time",
              },
            ],
            encoding: {
              x: {
                title: null,
                timeUnit: "binnedyearmonth",
                field: "YearMonth",
                type: "temporal",
                axis: {
                  labelAngle: -30,
                },
              },
              y: {
                title: "N of participants",
                field: "NumberOfParticipants",
                type: "quantitative",
              },
              tooltip: [
                { field: "Time", type: "nominal" },
                {
                  field: "NumberOfParticipants",
                  type: "quantitative",
                  title: "N of participants",
                },
              ],
              color: {
                field: "StudyType",
                type: "nominal",
                legend: { title: "Study type" },
                scale: { scheme: "set2" },
              },
              opacity: {
                condition: {
                  selection: "brush",
                  value: 1,
                },
                value: 0.7,
              },
            },
          },
          {
            transform: [
              {
                filter: { selection: "brush" },
              },
              {
                aggregate: [
                  {
                    op: "sum",
                    field: "NumberOfParticipants",
                    as: "total_value",
                  },
                ],
                groupby: ["YearMonth"],
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
              {
                filter: { selection: "brush" },
              },
              {
                aggregate: [
                  {
                    op: "sum",
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
                  "'Mean N per month: ' + format(datum.mean_value, '.0f')",
                as: "mean_label",
              },
            ],
            mark: {
              type: "text",
              x: 80,
              y: -20,
              xOffset: 0,
              yOffset: 0,
              color: "black",
              fontSize: 18,
            },
            encoding: {
              text: {
                field: "mean_label",
                type: "nominal",
              },
            },
          },
        ],
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
};
</script>

<style scoped>
.histogram {
  padding: 20px;
}
</style>
