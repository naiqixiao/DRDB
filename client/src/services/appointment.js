import api from "./api";

export default {
  create(appointment) {
    return api().post("appointment", appointment);
  },
  search(appointment) {
    return api().get("appointment/", {
      params: appointment
    });
  },
  delete(appointmentId) {
    return api().delete("appointment/", {
      params: { id: appointmentId }
    });
  }
};
