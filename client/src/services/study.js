import api from "./api";
import store from "@/store";

export default {
  create(studyInfo) {
    studyInfo.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
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
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().post("study/", studyInfo);
  },
  delete(studyInfo) {
    studyInfo.lab = store.state.lab;

    studyInfo.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().delete("study/", {
      params: studyInfo
    });
  }
};
