import api from "./api";
import store from "@/store";

export default {
  register(credentials) {
    credentials.lab = store.state.lab;
    return api().post("user/signup", credentials);
  },
  login(credentials) {
    return api().post("user/login", credentials);
  },
  check_login(){
    return api().post("user/checklogin");
  },
  changePassword(credentials) {
    credentials.lab = store.state.lab;
    return api().post("user/changePassword", credentials);
  },
  resetPassword(credentials) {
    return api().post("user/resetPassword", credentials);
  },
};
