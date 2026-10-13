import api from "./api";

export const dashboardService = {
    getAdminDashboard: () => api.get("/dashboard/admin"),
    getDispatcherDashboard: () => api.get("/dashboard/dispatcher"),
    getDriverDashboard: () => api.get("/dashboard/driver"),
};

export default dashboardService;
