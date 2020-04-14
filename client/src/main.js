import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import "./plugins/axios";
import { sync } from "vuex-router-sync";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import AsyncComputed from "vue-async-computed";

sync(store, router);

Vue.config.productionTip = false;
Vue.use(AsyncComputed);

Vue.prototype.$studyTimeSlots = [
  "08:30AM",
  "09:00AM",
  "09:30AM",
  "10:00AM",
  "10:30AM",
  "11:00AM",
  "11:30AM",
  "12:00PM",
  "12:30PM",
  "01:00PM",
  "01:30PM",
  "02:00PM",
  "02:30PM",
  "03:00PM",
  "03:30PM",
  "04:00PM",
  "04:30PM",
  "05:00PM",
  "05:30PM",
  "06:00PM"
];

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
