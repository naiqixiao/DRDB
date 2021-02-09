import api from "./api";
import store from "@/store";

export default {
  postExperimenters(experimenters) {
    experimenters.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }

    return api().post("experimenter/experimenters", experimenters);
  },

  postStudies(studies) {

    studies.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }

    return api().post("experimenter/studies", studies);
  }
};
