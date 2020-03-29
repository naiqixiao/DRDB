import api from "./api";

export default {
  create(appointment) {
    return api().post("appointment/", appointment);
  },
  update(appointment) {
    return api().post("appointment/", appointment);
  },
  delete(appointment) {
    return api().delete("appointment/", appointment);
  }
};
