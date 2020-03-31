import api from "./api";

export default {
  search(queryString) {
    return api().get("family/", {
      params: queryString
    });
  },
  update(queryString) {
    return api().post("family/", queryString);
  },
  create(queryString) {
    return api().post("family/add", queryString);
  },
  delete(queryString) {
    return api().delete("family/", {
      params: queryString
    });
  }
};
