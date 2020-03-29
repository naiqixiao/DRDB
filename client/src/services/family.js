import api from "./api";

export default {
  search(queryString) {
    return api().get("family/", {
      params: queryString
    });
    // .catch(err => {
    //   console.error(err.response.status);
    // });
  }
};
