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
  // The study list in the store is a login-time snapshot that is persisted in the
  // browser, so it goes stale when colleagues add or edit studies / age groups.
  // Re-fetch it before eligibility is evaluated.
  async refreshStoreStudies() {
    const store = useMainStore();
    if (!store.lab) return;
    try {
      const result = await api().get("study/", {
        params: { FK_Lab: store.lab, includeScheules: false }
      });
      if (Array.isArray(result.data)) store.setStudies(result.data);
    } catch (error) {
      console.warn("Could not refresh studies; using the cached list.", error);
    }
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
