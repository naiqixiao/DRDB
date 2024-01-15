import api from "./api";
import store from "@/store";

export default {
  create(testingRoomInfo) {
    testingRoomInfo.labName = store.state.labName;
    return api().post("testingRoom/add", testingRoomInfo);
  },

  search(labId) {
    return api().get("testingRoom/", {
      params: { labId },
    });
  },

  update(testingRoomInfo) {
    return api().post("testingRoom/", testingRoomInfo);
  },

  delete(testingRoomInfo) {
    return api().delete("testingRoom/", {
      params: {testingRoomInfo},
    });
  },
};
