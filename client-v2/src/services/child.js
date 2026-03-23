import api from "./api";
import store from "@/store";

export default {
  create(childInfo) {
    childInfo.User = {

      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
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

      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().post("child/", childInfo);
  },
  delete(childInfo) {
    childInfo.User = {
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().delete("child/", {
      params: childInfo
    });
  }
};
