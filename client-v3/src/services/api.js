import axios from "axios";
import store from "@/store";

export default () => {
    return axios.create({
        baseURL: '/api/',
        timeout: 30000,
        headers: {
            Authorization: `Bearer ${store.state.token}`,
        },
    });
};
