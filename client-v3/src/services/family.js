import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  create(familyInfo) {
    familyInfo.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }

    return api().post("family/add", familyInfo);
  },
  batchImport(familyInfo) {
    familyInfo.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }

    return api().post("family/addBatch", familyInfo);
  },
  search(familyInfo) {
    return api().get("family/", {
      params: familyInfo
    });
  },
  followupSearch(familyInfo) {
    return api().get("family/followup", {
      params: familyInfo
    });
  },
  update(familyInfo) {
    familyInfo.User = {
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().post("family/", familyInfo);
  },
  delete(familyInfo) {

    familyInfo.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().delete("family/", {
      params: familyInfo
    });
  }
};
