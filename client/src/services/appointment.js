import api from "./api";

export default {
  create(appointment) {
    return api().post("appointment/add", appointment);
  },
  search(appointment) {
    return api().get("appointment/", {
      params: appointment
    });
  },

  update(updatedAppointment) {
    return api().post("appointment/", updatedAppointment);
  },

  delete(removedAppointment) {
    return api().delete("appointment/", {
      params: removedAppointment
    });
  }
};
