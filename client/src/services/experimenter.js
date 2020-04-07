import api from "./api";

export default {
  post(experimenter) {
    return api().post("experimenter/", experimenter);
  }
};
