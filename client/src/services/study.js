import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  create(studyInfo) {
    studyInfo.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().post("study/add", studyInfo);
  },
  search(studyInfo) {
    return api().get("study/", {
      params: studyInfo
    });
  },
  studyStats(studyID) {
    return api().get("study/studyStats", {
      params: studyID
    });
  },
  update(studyInfo) {
    studyInfo.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().post("study/", studyInfo);
  },
  delete(studyInfo) {
    studyInfo.lab = useMainStore().lab;

    studyInfo.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().delete("study/", {
      params: studyInfo
    });
  }
};
