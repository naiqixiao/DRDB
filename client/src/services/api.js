import axios from "axios";
import { useMainStore } from "@/stores/mainStore";
import router from "@/router";

// 1. Create the persistent singleton
const apiClient = axios.create({
    baseURL: '/api/',
    timeout: 30000,
});

// 2. Request Interceptor: Attach token dynamically
apiClient.interceptors.request.use(
    (config) => {
        const store = useMainStore();
        if (store.token) {
            config.headers.Authorization = `Bearer ${store.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. Response Interceptor: Global 401 handler
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Session expired. Redirecting to Login.");
            const store = useMainStore();
            store.clearAll();
            
            if (router.currentRoute.value.name !== 'Login') {
                router.push({ name: 'Login' });
            }
        }
        return Promise.reject(error);
    }
);

export default () => apiClient;
