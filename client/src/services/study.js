import api from "./api";
import { useMainStore } from "@/stores/mainStore";

const REFRESH_MIN_INTERVAL_MS = 5 * 60 * 1000;
let refreshInFlight = null;
let lastRefreshAt = 0;

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
  // Re-fetch it before eligibility is evaluated. The study search is an expensive
  // query, so share one in-flight request and refetch at most every few minutes.
  async refreshStoreStudies({ force = false } = {}) {
    const store = useMainStore();
    if (!store.lab) return;
    if (refreshInFlight) return refreshInFlight;
    if (!force && Date.now() - lastRefreshAt < REFRESH_MIN_INTERVAL_MS) return;

    refreshInFlight = (async () => {
      try {
        const result = await api().get("study/", {
          params: { FK_Lab: store.lab, includeScheules: false }
        });
        if (Array.isArray(result.data)) {
          store.setStudies(result.data);
          lastRefreshAt = Date.now();
        }
      } catch (error) {
        // Back off after a failure so a struggling server is not hammered.
        lastRefreshAt = Date.now();
        console.warn("Could not refresh studies; using the cached list.", error);
      } finally {
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
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
