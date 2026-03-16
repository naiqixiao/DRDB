import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  create(childInfo) {
    childInfo.User = {

      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }

    return api().post("child/add", childInfo);
  },
  search(childInfo) {
    return api().get("child/", {
      params: childInfo
    });
  },
  update(childInfo) {
    childInfo.User = {

      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().post("child/", childInfo);
  },
  delete(childInfo) {
    childInfo.User = {
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().delete("child/", {
      params: childInfo
    });
  }
};
