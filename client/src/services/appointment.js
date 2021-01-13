import api from "./api";
import store from "@/store";

export default {
  create(appointment) {
    var newAppointment = {};
    newAppointment.appointment = appointment;
    newAppointment.lab = store.state.lab;

    newAppointment.User = {
      // IP: store.state.ip,
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }

    return api().post("appointment/add", newAppointment);
  },

  search(appointment) {
    return api().get("appointment/", {
      params: appointment,
    });
  },

  update(updatedAppointment) {
    updatedAppointment.lab = store.state.lab;
    updatedAppointment.User = {
      // IP: store.state.ip,
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().post("appointment/", updatedAppointment);
  },

  delete(removedAppointment) {
    removedAppointment.lab = store.state.lab;
    
    removedAppointment.User = {
      // IP: store.state.ip,
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().delete("appointment/", {
      params: removedAppointment,
    });
  },
};
