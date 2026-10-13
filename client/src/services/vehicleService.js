import api from "./api";

export const vehicleService = {
    getVehicles: (params) => api.get("/vehicles", { params }),
    getVehicleById: (id) => api.get(`/vehicles/${id}`),
    createVehicle: (data) => api.post("/vehicles", data),
    updateVehicle: (id, data) => api.put(`/vehicles/${id}`, data),
    deleteVehicle: (id) => api.delete(`/vehicles/${id}`),
    updateVehicleStatus: (id, status) => api.patch(`/vehicles/${id}/status`, { status }),
};

export default vehicleService;
