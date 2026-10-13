import api from "./api";

export const deliveryService = {
    getDeliveries: (params) => api.get("/deliveries", { params }),
    getDeliveryById: (id) => api.get(`/deliveries/${id}`),
    createDelivery: (data) => api.post("/deliveries", data),
    updateDelivery: (id, data) => api.put(`/deliveries/${id}`, data),
    deleteDelivery: (id) => api.delete(`/deliveries/${id}`),
    updateDeliveryStatus: (id, status) => api.patch(`/deliveries/${id}/status`, { status }),
    submitProofOfDelivery: (id, data) => api.post(`/deliveries/${id}/proof`, data),
};

export default deliveryService;
