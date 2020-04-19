import api from "./api";

export default {
  create(calendarInfo) {
    return api().post("cal/", calendarInfo);
  },

  update(calendarInfo) {
    return api().patch("cal/", calendarInfo);
  },

  delete(calendarInfo) {
    return api().delete("cal/", calendarInfo);
  },
};
