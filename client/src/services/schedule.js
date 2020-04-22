import api from "./api";
import store from "@/store";

export default {
  create(schedule) {
    return api().post("schedule/add", schedule);
  },
  search(schedule) {
    return api().get("schedule/", {
      params: schedule,
    });
  },
  today() {
    return api().get("schedule/today");
  },
  week() {
    return api().get("schedule/week");
  },
  update(schedule) {
    schedule.lab = store.state.lab;
    return api().post("schedule/", schedule);
  },
  delete(schedule) {
    schedule.lab = store.state.lab;
    return api().delete("schedule/", schedule);
  },
};
