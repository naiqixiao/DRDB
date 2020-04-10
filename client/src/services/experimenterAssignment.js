import api from "./api";

export default {
  postStudies(appointment) {
    return api().post("experimentAssignment/", appointment);
  }
};
