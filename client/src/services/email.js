import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  preview(emailInfo) {
    return api().post("gmail/preview", { ...emailInfo, lab: emailInfo.lab ?? useMainStore().lab });
  },
  sendTest(emailInfo) {
    return api().post("gmail/send-test", { ...emailInfo, lab: emailInfo.lab ?? useMainStore().lab });
  },
  send(emailInfo) {
    emailInfo.lab = useMainStore().lab;
    return api().post("gmail/send", emailInfo);
  },
};
