import api from "./api";

export default {
  create(childInfo) {
    return api().post("child/add", childInfo);
  },
  search(childInfo) {
    return api().get("child/", {
      params: childInfo
    });
  },
  update(childInfo) {
    return api().post("child/", childInfo);
  },
  delete(childInfo) {
    return api().delete("child/", {
      params: childInfo
    });
  }
};
