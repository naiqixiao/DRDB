import api from "./api";
import store from "@/store";

export default {
  create(labInfo) {
    return api().post("lab/add", labInfo);
  },
  search(labInfo) {
    return api().get("lab/", {
      params: labInfo,
    });
  },
  update(labInfo) {
    labInfo.lab = store.state.lab
    return api().post("lab/", labInfo);
  },
  delete(labInfo) {
    return api().delete("lab/", {
      params: labInfo,
    });
  },
};
