import api from "./api";
import store from "@/store";

export default {
  create(event) {
    const calendarInfo = {
      event: event,
      lab: store.state.lab,
    };
    return api().post("cal/", calendarInfo);
  },

  update(event) {
    const calendarInfo = {
      event: event,
      lab: store.state.lab,
    };

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
