import api from "./api";
import store from "@/store";

export default {
  create(calendarInfo) {
    calendarInfo.lab = store.state.lab;
    return api().post("cal/", calendarInfo);
  },

  update(calendarInfo) {
    calendarInfo.lab = store.state.lab;
    return api().patch("cal/", calendarInfo);
  },

  delete(calendarInfo) {
    calendarInfo.lab = store.state.lab;
    return api().delete("cal/", calendarInfo);
  },
};
