import api from "./api";
// import { useMainStore } from "@/stores/mainStore";

export default {
  get() {
    // calendarInfo.lab = store.state.lab;
    return api().get("RTU/");
  },

  add(familyID) {
    // calendarInfo.lab = store.state.lab;
    return api().post("RTU/add", {familyID: familyID});
  },

  remove(familyID) {
    // calendarInfo.lab = store.state.lab;
    return api().post("RTU/remove", {familyID: familyID});
  },
};
