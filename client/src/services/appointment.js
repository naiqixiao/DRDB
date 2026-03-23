import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  create(appointment) {
    var newAppointment = {};
    newAppointment.appointment = appointment;
    newAppointment.lab = useMainStore().lab;

    newAppointment.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }

    return api().post("appointment/add", newAppointment);
  },

  search(appointment) {
    return api().get("appointment/", {
      params: appointment,
    });
  },

  update(updatedAppointment) {
    updatedAppointment.lab = useMainStore().lab;
    updatedAppointment.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().post("appointment/", updatedAppointment);
  },
  
  updateExperimenters(updatedAppointment) {
    updatedAppointment.lab = useMainStore().lab;
    updatedAppointment.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().post("appointment/exp", updatedAppointment);
  },

  delete(removedAppointment) {
    removedAppointment.lab = useMainStore().lab;
    
    removedAppointment.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().delete("appointment/", {
      params: removedAppointment,
    });
  },

  monthYearN() {
    return api().get("appointment/monthYearN0");
  }
};
