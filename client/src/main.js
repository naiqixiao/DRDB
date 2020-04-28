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

Vue.prototype.$familyFields = [
  { label: "Email", field: "Email", rules: "email", width:"4", searchable: true },
  { label: "Phone", field: "Phone", rules: "phone", width:"4", searchable: true },
  { label: "Family ID", field: "id", width:"3", searchable: true },
  { label: "Mother's Name", field: "NameMom", rules: "name", width:"4", searchable: true },
  {
    label: "Mother's Language",
    field: "LanguageMom",
    width:"4",
    options: "language",
  },
  { label: "Mother's Race", field: "RaceMom", width:"3", options: "race" },
  { label: "Father's Name", field: "NameDad", width:"4", rules: "name", searchable: true },
  {
    label: "Father's Language",
    field: "LanguageDad",
    width:"4",
    options: "language",
  },
  { label: "Father's Race", field: "RaceDad", width:"3", options: "race" },
  // { label: "English %", width:"3", field: "EnglishPercent" },
  // { label: "Postal Code", field: "Address", searchable: true },
  // { label: "Vehicle", field: "Vehicle" },
  { label: "Next Contact Date", width:"4", field: "NextContactDate" },
  { label: "Last Contact Date", width:"4", field: "LastContactDate" },
  {
    label: "Recruited via",
    field: "RecruitmentMethod",
    width:"3",
    options: "recruitmentMethod",
  },
];

Vue.prototype.$options = {
  language: ["English", "French", "Chinese", "Spanish", "Hindi"],
  race: ["Indian", "Asian", "African", "Hispanic", "Caucasian", "Arabic"],
  recruitmentMethod: [
    "Hospital",
    "Events",
    "SocialMedia",
    "PreviousParticipation",
  ],
};

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
  "06:00PM",
];

Vue.prototype.$headersSchedule = [
  {
    text: "Child",
    align: "center",
    value: "Child",
    width: "40px",
  },
  {
    text: "Study",
    align: "center",
    value: "Study",
    width: "40px",
  },
  {
    text: "Study Time",
    align: "center",
    value: "AppointmentTime",
    width: "80px",
  },
  {
    text: "Age",
    align: "center",
    value: "AgeByParticipation",
    width: "60px",
  },
  {
    text: "Status",
    align: "center",
    value: "Status",
    width: "60px",
  },
  {
    text: "Updated",
    align: "center",
    value: "updatedAt",
    width: "60px",
  },

  {
    text: "Actions",
    align: "center",
    value: "actions",
    sortable: false,
    width: "100px",
  },
  {
    text: "Complete",
    align: "center",
    value: "Completed",
    sortable: false,
    width: "20px",
  },
];

Vue.prototype.$headersAppointments = [
  { text: "Child", align: "center", value: "Child.Name", width: "50px" },
  {
    text: "Study",
    align: "center",
    value: "Study.StudyName",
    width: "50px",
  },
  {
    text: "Study Time",
    align: "center",
    value: "AppointmentTime",
    width: "100px",
  },
  {
    text: "Age",
    align: "center",
    value: "AgeByParticipation",
    width: "60px",
  },
  {
    text: "Status",
    align: "center",
    value: "Schedule.Status",
    width: "80px",
  },
  {
    text: "Updated",
    align: "center",
    value: "updatedAt",
    width: "60px",
  },

  {
    text: "Actions",
    align: "center",
    value: "actions",
    sortable: false,
    width: "80px",
  },
  {
    text: "Complete",
    align: "center",
    value: "Schedule.Completed",
    sortable: false,
    width: "20px",
  },
];

Vue.prototype.$Sex = ["F", "M"];

Vue.prototype.$rules = {
  name: [
    (value) => !!value || "Required.",
    (value) => {
      var pattern = /^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/;
      return pattern.test(value) || "Invalid Name.";
    },
    (value) => (value && value.length <= 30) || "Max 30 characters",
  ],
  email: [
    (value) => !!value || "Required.",
    (value) => {
      const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return pattern.test(value) || "Invalid e-mail.";
    },
    (value) => (value && value.length <= 30) || "Max 30 characters",
  ],
  phone: [
    (value) => {
      const pattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
      return pattern.test(value) || "Invalid phone.";
    },
    (value) => !!value || "Required.",
    (value) => (value && value.length == 10) || "Have to be 10 digits",
  ],
  dob: [
    (value) => !!value || "Required.",
    (value) => {
      var pattern = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
      return pattern.test(value) || "Invalid Date of Birth.";
    },
  ],
  birthWeight: [
    (value) => {
      var pattern = /^[0-9]{1,2}[:.,-]?$/;
      return pattern.test(value) || "Invalid Birth Weight.";
    },
  ],
};

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
