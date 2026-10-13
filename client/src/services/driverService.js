import api from "./api";

export const driverService = {
    getDrivers: (params) => api.get("/drivers", { params }),
    getDriverById: (id) => api.get(`/drivers/${id}`),
    createDriver: (data) => api.post("/drivers", data),
    updateDriver: (id, data) => api.put(`/drivers/${id}`, data),
    updateDriverStatus: (id, status) => api.patch(`/drivers/${id}/status`, { status }),
    updateDriverVehicle: (id, vehicleId) => api.patch(`/drivers/${id}/vehicle`, { vehicleId }),
};

export default driverService;
