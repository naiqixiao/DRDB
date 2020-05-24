import api from "./api";
import store from "@/store";

export default {
  googleCredentialsURL() {
    return api().get("extAPIs/");
  },

  googleSetToken(signInCode) {
    const code = {
      lab: store.state.lab,
      signInCode: signInCode,
    };

    return api().post("extAPIs/", code);
  },
};
