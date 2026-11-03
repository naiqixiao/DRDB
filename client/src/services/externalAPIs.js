import api from "./api";
import { useMainStore } from "@/stores/mainStore";

// Google needs the same redirect URI for the auth URL and the token exchange,
// so the server is told which page (origin) the flow started from.
const origin = () => window.location.origin;

// Accepts either a bare sign-in code or the full URL Google redirected to.
export function extractSignInCode(input) {
  const value = (input || "").trim();
  try {
    return new URL(value).searchParams.get("code") || value;
  } catch (e) {
    return decodeURIComponent(value);
  }
}

export default {
  googleCredentialsURL() {
    return api().get("extAPIs/", { params: { origin: origin() } });
  },

  setLabToken(signInCode) {
    const code = {
      lab: useMainStore().lab,
      signInCode: extractSignInCode(signInCode),
      origin: origin(),
    };

    return api().post("extAPIs/", code);
  },

  setAdminToken(signInCode) {
    const code = {
      signInCode: extractSignInCode(signInCode),
      origin: origin(),
    };

    return api().post("extAPIs/admin", code);
  },

  googleGetEmailAddress() {
    const lab = { lab: useMainStore().lab };
    
    return api().post("extAPIs/email", lab);
  },
};
