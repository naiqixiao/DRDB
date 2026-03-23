import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  postExperimenters(experimenters) {
    experimenters.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }

    return api().post("experimenter/experimenters", experimenters);
  },

  postStudies(studies) {

    studies.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }

    return api().post("experimenter/studies", studies);
  }
};
