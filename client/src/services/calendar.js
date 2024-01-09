import api from "./api";
import store from "@/store";

export default {
  create(events) {
    const calendarInfo = {
      events: events,
      lab: store.state.lab,
    };
    return api().post("cal/", calendarInfo);
  },

  update(calendarInfo) {
    calendarInfo.lab = store.state.lab;
    return api().patch("cal/", calendarInfo);
  },

  delete(calendarInfo) {
    return api().delete(`cal/`, {
      params: calendarInfo,
    });
  },

  createSecondaryCalendar(calendarInfo) {
    return api().post("cal/createSecondaryCalendar/", calendarInfo);
  },
};
