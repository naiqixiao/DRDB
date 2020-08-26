import api from "./api";
import store from "@/store";

export default {
  postStudies(appointment) {

    appointment.User = {
      IP: store.state.ip,
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }

    return api().post("experimentAssignment/", appointment);
  }
};
