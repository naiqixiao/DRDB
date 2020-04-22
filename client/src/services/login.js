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
};
