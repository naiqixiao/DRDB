import api from "./api";

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
    return api().post("schedule/", schedule);
  },
  delete(schedule) {
    return api().delete("schedule/", schedule);
  },
};