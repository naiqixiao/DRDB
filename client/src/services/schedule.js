import api from "./api";
import store from "@/store";

export default {
  create(schedule) {
    return api().post("schedule/add", schedule);
  },
  search(schedule) {
    schedule.lab = store.state.lab;
    return api().get("schedule/", {
      params: schedule,
    });
  },
  today() {
    const schedule = {lab: store.state.lab};
    return api().get("schedule/today", {
      params: schedule,
    });
  },
  week() {
    const schedule = {lab: store.state.lab};
    return api().get("schedule/week", {
      params: schedule,
    });
  },
  update(schedule) {
    schedule.lab = store.state.lab;
    return api().post("schedule/", schedule);
  },
  complete(schedule) {
    schedule.lab = store.state.lab;
    return api().post("schedule/complete", schedule);
  },
  remind(schedule) {
    schedule.lab = store.state.lab;
    return api().post("schedule/remind", schedule);
  },
  delete(schedule) {
    schedule.lab = store.state.lab;
    return api().delete("schedule/", {
      params: schedule,
    });
  },
};
