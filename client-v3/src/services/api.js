import axios from "axios";
import { useMainStore } from "@/stores/mainStore";

export default () => {
    return axios.create({
        baseURL: '/api/',
        timeout: 30000,
        headers: {
            Authorization: `Bearer ${useMainStore().token}`,
        },
    });
};
