import api from "./api";
import store from "@/store";

export default {
  create(testingRoomInfo) {
    testingRoomInfo.labName = store.state.labName;
    return api().post("testingRoom/add", testingRoomInfo);
  },
  search(testingRoomInfo) {
    return api().get("testingRoom/", {
      params: testingRoomInfo,
    });
  },
  update(testingRoomInfo) {
    
    return api().post("lab/", testingRoomInfo);
  },
  delete(testingRoomInfo) {

    return api().delete("lab/", {
      params: testingRoomInfo,
    });
  },
};
