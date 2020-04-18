import api from "./api";

export default {
  send(emailInfo) {
    return api().post("gmail/send", emailInfo);
  },
};
