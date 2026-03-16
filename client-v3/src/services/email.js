import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  send(emailInfo) {
    emailInfo.lab = useMainStore().lab;
    return api().post("gmail/send", emailInfo);
  },
};
