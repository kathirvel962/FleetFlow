import api from "./api";

export const dispatchService = {
    assign: (data) => api.post("/dispatch/assign", data),
    getActiveDispatches: (params) => api.get("/dispatch/active", { params }),
    getDispatchHistory: (params) => api.get("/dispatch/history", { params }),
};

export default dispatchService;
