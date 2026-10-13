import api from "./api";

export const userService = {
    getUsers: (params) => api.get("/users", { params }),
    getUserById: (id) => api.get(`/users/${id}`),
    createUser: (data) => api.post("/users", data),
    updateUser: (id, data) => api.put(`/users/${id}`, data),
    deleteUser: (id) => api.delete(`/users/${id}`),
    updateUserStatus: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),
};

export default userService;
