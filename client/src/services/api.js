import axios from "axios";
import store from "@/store";

export default () => {
  return axios.create({
    baseURL: 'api/',
    // baseURL: `http://192.168.1.126:3000/`,
    // baseURL: `http://localhost:3000/`,
    // baseURL: `http://170.52.108.214:13000/`,
    headers: {
      Authorization: `Bearer ${store.state.token}`,
    },
  });
};
