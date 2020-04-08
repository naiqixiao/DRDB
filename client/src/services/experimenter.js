import api from "./api";

export default {
  postExperimenters(experimenter) {
    return api().post("experimenter/experimenters", experimenter);
  },

  postStudies(studies) {
    return api().post("experimenter/studies", studies);
  }
};
