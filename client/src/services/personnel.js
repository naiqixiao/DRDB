import api from "./api";
import store from "@/store";

export default {
  create(personnelInfo) {
    personnelInfo.User = {
      IP: store.state.ip,
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().post("personnel/add", personnelInfo);
  },
  search(personnelInfo) {
    return api().get("personnel/", {
      params: personnelInfo
    });
  },
  update(personnelInfo) {
    personnelInfo.User = {
      IP: store.state.ip,
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().post("personnel/", personnelInfo);
  },
  delete(personnelInfo) {
    
    personnelInfo.User = {
      IP: store.state.ip,
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().delete("personnel/", {
      params: personnelInfo
    });
  }
};
