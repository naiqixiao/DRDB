import api from "./api";

export default {
  create(studyInfo) {
    return api().post("study/add", studyInfo);
  },
  search(studyInfo) {
    return api().get("study/", {
      params: studyInfo
    });
  },
  update(studyInfo) {
    return api().post("study/", studyInfo);
  },
  delete(studyInfo) {
    return api().delete("study/", {
      params: studyInfo
    });
  }
};
