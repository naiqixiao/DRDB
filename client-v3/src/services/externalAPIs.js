import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  googleCredentialsURL() {
    return api().get("extAPIs/");
  },

  setLabToken(signInCode) {
    const code = {
      lab: useMainStore().lab,
      signInCode: signInCode,
    };

    return api().post("extAPIs/", code);
  },

  setAdminToken(signInCode) {
    const code = {
      signInCode: signInCode,
    };

    return api().post("extAPIs/admin", code);
  },

  googleGetEmailAddress() {
    const lab = { lab: useMainStore().lab };
    
    return api().post("extAPIs/email", lab);
  },
};
