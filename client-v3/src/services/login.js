import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  register(credentials) {
    credentials.lab = useMainStore().lab;
    credentials.User = {
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
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
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().post("user/logout", User);
  },
  changePassword(credentials) {
    credentials.lab = useMainStore().lab;
    credentials.User = {
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName

    }
    return api().post("user/changePassword", credentials);
  },
  resetPassword(credentials) {
    credentials.User = {
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().post("user/resetPassword", credentials);
  },
};
