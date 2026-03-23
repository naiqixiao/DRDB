import api from "./api";
// import store from "@/store";

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
