import Vue from "vue";
import VueRouter from "vue-router";

import Home from "../views/Home"
import Family from "@/views/Family";
import Appointment from "@/views/Appointment";
import Schedule from "@/views/Schedule";
import Personnel from "@/views/Personnel";
import Study from "@/views/Study";
import Login from "@/views/Login";
import Settings from "@/views/Settings";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings
  },
  {
    path: "/login",
    name: "Login",
    component: Login
  },
  {
    path: "/family",
    name: "Family information",
    component: Family
  },
  {
    path: "/schedule",
    name: "Schedule studies",
    component: Schedule
  },
  {
    path: "/personnel",
    name: "Personnel",
    component: Personnel
  },
  {
    path: "/study",
    name: "Study information",
    component: Study
  },
  {
    path: "/appointment",
    name: "Study appointments",
    component: Appointment
  }
];

const router = new VueRouter({
  routes
});

export default router;
