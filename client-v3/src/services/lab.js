import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  create(labInfo) {
    labInfo.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().post("lab/add", labInfo);
  },
  search(labInfo) {
    return api().get("lab/", {
      params: labInfo,
    });
  },
  update(labInfo) {
    labInfo.lab = useMainStore().lab
    labInfo.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().post("lab/", labInfo);
  },
  delete(labInfo) {
    labInfo.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().delete("lab/", {
      params: labInfo,
    });
  },
};
