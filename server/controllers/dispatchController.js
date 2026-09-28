const { assignDelivery } = require("../services/dispatchService");
const Delivery = require("../models/Delivery");
const { paginateQuery } = require("../utils/queryHelper");

// @desc    Assign Driver and Vehicle to Delivery
// @route   POST /api/dispatch/assign
// @access  Private (ADMIN, DISPATCHER)
const assign = async (req, res, next) => {
    try {
        const { deliveryId, driverId, vehicleId } = req.body;

        if (!deliveryId || !driverId || !vehicleId) {
            return res.status(400).json({
                success: false,
                message: "deliveryId, driverId, and vehicleId are required"
            });
        }

        const updatedDelivery = await assignDelivery({
            deliveryId,
            driverId,
            vehicleId,
            dispatcherId: req.user.id
        });

        res.status(200).json({
            success: true,
            message: "Delivery dispatched and assigned successfully",
            data: updatedDelivery
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

// @desc    Get all active dispatch assignments
// @route   GET /api/dispatch/active
// @access  Private (ADMIN, DISPATCHER)
const getActiveDispatches = async (req, res, next) => {
    try {
        const result = await paginateQuery(Delivery, req.query, {
            baseFilter: {
                status: { $in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] }
            },
            allowedFilters: ["priority", "assignedDriver", "assignedVehicle"],
            searchFields: ["deliveryNumber", "customerName", "pickupAddress", "deliveryAddress"],
            populate: [
                { path: "assignedDriver", select: "name email phone" },
                { path: "assignedVehicle", select: "vehicleNumber registrationNumber type status" },
                { path: "dispatcher", select: "name email" }
            ],
            defaultSort: "-updatedAt"
        });

        res.status(200).json({
            success: true,
            message: "Active dispatch assignments retrieved successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get dispatch history (completed, failed, cancelled)
// @route   GET /api/dispatch/history
// @access  Private (ADMIN, DISPATCHER)
const getDispatchHistory = async (req, res, next) => {
    try {
        const result = await paginateQuery(Delivery, req.query, {
            baseFilter: {
                status: { $in: ["DELIVERED", "FAILED", "CANCELLED"] }
            },
            allowedFilters: ["status", "priority", "assignedDriver", "assignedVehicle"],
            searchFields: ["deliveryNumber", "customerName", "pickupAddress", "deliveryAddress"],
            populate: [
                { path: "assignedDriver", select: "name email phone" },
                { path: "assignedVehicle", select: "vehicleNumber registrationNumber type" },
                { path: "dispatcher", select: "name email" },
                { path: "proofOfDelivery" }
            ],
            defaultSort: "-updatedAt"
        });

        res.status(200).json({
            success: true,
            message: "Dispatch history retrieved successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    assign,
    getActiveDispatches,
    getDispatchHistory
};
