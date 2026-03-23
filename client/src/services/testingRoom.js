import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  create(testingRoomInfo) {
    testingRoomInfo.labName = useMainStore().labName;
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
