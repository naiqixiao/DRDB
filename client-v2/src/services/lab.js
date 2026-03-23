import api from "./api";
import store from "@/store";

export default {
  create(labInfo) {
    labInfo.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().post("lab/add", labInfo);
  },
  search(labInfo) {
    return api().get("lab/", {
      params: labInfo,
    });
  },
  update(labInfo) {
    labInfo.lab = store.state.lab
    labInfo.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().post("lab/", labInfo);
  },
  delete(labInfo) {
    labInfo.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().delete("lab/", {
      params: labInfo,
    });
  },
};
