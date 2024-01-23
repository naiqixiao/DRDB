import Vue from "vue";
import Vuetify from "vuetify/lib";
import { Ripple } from "vuetify/lib/directives";

Vue.use(Vuetify, {
  directives: {
    Ripple,
  },
});

const vuetify = new Vuetify({
  theme: {
    themes: {
      light: {
        primary: "#344955",
        secondary: "#F9AA33",
        tertiary: "#4A6572",
        quaternary: "#4A6572",
        background: "#B2B2B2",
        textbackground: "#f4f4f4",
        warning: "#cc3300"
      },
    },
    options: {
      customProperties: true,
    },
  },
  icons: {
    iconfont: "mdi", // 'mdi' || 'mdiSvg' || 'md' || 'fa' || 'fa4' || 'faSvg'
  },
});

export default vuetify;
