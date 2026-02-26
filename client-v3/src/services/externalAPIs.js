import api from "./api";
import store from "@/store";

export default {
  googleCredentialsURL() {
    return api().get("extAPIs/");
  },

  setLabToken(signInCode) {
    const code = {
      lab: store.state.lab,
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
    const lab = { lab: store.state.lab };
    
    return api().post("extAPIs/email", lab);
  },
};
