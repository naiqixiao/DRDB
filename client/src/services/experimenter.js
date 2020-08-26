import api from "./api";
import store from "@/store";

export default {
  postExperimenters(experimenters) {
    experimenters.User = {
      IP: store.state.ip,
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }

    return api().post("experimenter/experimenters", experimenters);
  },

  postStudies(studies) {

    studies.User = {
      IP: store.state.ip,
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }

    console.log(studies)
    return api().post("experimenter/studies", studies);
  }
};
