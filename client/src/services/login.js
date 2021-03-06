import api from "./api";
import store from "@/store";

export default {
  register(credentials) {
    credentials.lab = store.state.lab;
    credentials.User = {
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }

    return api().post("user/signup", credentials);
  },
  login(credentials) {
    return api().post("user/login", credentials);
  },
  check_login() {
    return api().post("user/checklogin");
  },
  logout() {
    const User = {
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().post("user/logout", User);
  },
  changePassword(credentials) {
    credentials.lab = store.state.lab;
    credentials.User = {
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName

    }
    return api().post("user/changePassword", credentials);
  },
  resetPassword(credentials) {
    credentials.User = {
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().post("user/resetPassword", credentials);
  },
};
