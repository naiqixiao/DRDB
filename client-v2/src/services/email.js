import api from "./api";
import store from "@/store";

export default {
  send(emailInfo) {
    emailInfo.lab = store.state.lab;
    return api().post("gmail/send", emailInfo);
  },
};
