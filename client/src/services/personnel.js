import api from "./api";

export default {
  create(personnelInfo) {
    return api().post("personnel/add", personnelInfo);
  },
  search(personnelInfo) {
    return api().get("personnel/", {
      params: personnelInfo
    });
  },
  update(personnelInfo) {
    return api().post("personnel/", personnelInfo);
  },
  delete(personnelInfo) {
    return api().delete("personnel/", {
      params: personnelInfo
    });
  }
};
