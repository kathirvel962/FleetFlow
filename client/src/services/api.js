import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor — attach JWT token from localStorage automatically
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor — handle 401 globally (optional: auto-logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid — clear local storage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // Optionally redirect to login (when React Router is integrated):
            // window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;