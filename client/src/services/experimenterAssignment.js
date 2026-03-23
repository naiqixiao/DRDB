import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  postStudies(appointment) {

    appointment.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }

    return api().post("experimentAssignment/", appointment);
  }
};
