import api from "./api";

export default {
  create(feedback) {
    return api().post("feedback/", feedback);
  }
};
