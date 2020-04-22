import api from "./api";
import store from "@/store";

export default {
  create(appointment) {
    appointment.lab = store.state.lab;
    return api().post("appointment/add", appointment);
  },
  search(appointment) {
    return api().get("appointment/", {
      params: appointment,
    });
  },

  update(updatedAppointment) {
    updatedAppointment.lab = store.state.lab;

    return api().post("appointment/", updatedAppointment);
  },

  delete(removedAppointment) {
    removedAppointment.lab = store.state.lab;

    return api().delete("appointment/", {
      params: removedAppointment,
    });
  },
};
