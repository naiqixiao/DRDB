import api from "./api";
import store from "@/store";

export default {
  create(familyInfo) {
    familyInfo.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }

    return api().post("family/add", familyInfo);
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
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().post("family/", familyInfo);
  },
  delete(familyInfo) {

    familyInfo.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().delete("family/", {
      params: familyInfo
    });
  }
};
