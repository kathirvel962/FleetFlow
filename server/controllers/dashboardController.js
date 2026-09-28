const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Delivery = require("../models/Delivery");

// @desc    Get Admin Dashboard Analytics & Overview
// @route   GET /api/dashboard/admin
// @access  Private (ADMIN)
const getAdminDashboard = async (req, res, next) => {
    try {
        const [
            totalUsers,
            totalDrivers,
            totalVehicles,
            totalDeliveries,
            pendingDeliveries,
            activeDeliveries,
            completedDeliveries,
            failedDeliveries,
            availableVehicles,
            inTransitVehicles,
            maintenanceVehicles,
            availableDrivers,
            onTripDrivers,
            recentDeliveries
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "DRIVER" }),
            Vehicle.countDocuments(),
            Delivery.countDocuments(),
            Delivery.countDocuments({ status: "PENDING" }),
            Delivery.countDocuments({ status: { $in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] } }),
            Delivery.countDocuments({ status: "DELIVERED" }),
            Delivery.countDocuments({ status: "FAILED" }),
            Vehicle.countDocuments({ status: "AVAILABLE", isActive: true }),
            Vehicle.countDocuments({ status: { $in: ["ASSIGNED", "IN_TRANSIT"] }, isActive: true }),
            Vehicle.countDocuments({ status: "MAINTENANCE" }),
            Driver.countDocuments({ availabilityStatus: "AVAILABLE" }),
            Driver.countDocuments({ availabilityStatus: "ON_TRIP" }),
            Delivery.find()
                .sort("-createdAt")
                .limit(5)
                .populate("assignedDriver", "name email")
                .populate("assignedVehicle", "vehicleNumber registrationNumber")
        ]);

        res.status(200).json({
            success: true,
            message: "Admin dashboard statistics retrieved successfully",
            data: {
                overview: {
                    totalUsers,
                    totalDrivers,
                    totalVehicles,
                    totalDeliveries,
                    pendingDeliveries,
                    activeDeliveries,
                    completedDeliveries,
                    failedDeliveries,
                    availableVehicles,
                    availableDrivers
                },
                vehicleStats: {
                    total: totalVehicles,
                    available: availableVehicles,
                    inTransit: inTransitVehicles,
                    maintenance: maintenanceVehicles
                },
                driverStats: {
                    total: totalDrivers,
                    available: availableDrivers,
                    onTrip: onTripDrivers
                },
                deliveryStats: {
                    total: totalDeliveries,
                    pending: pendingDeliveries,
                    active: activeDeliveries,
                    completed: completedDeliveries,
                    failed: failedDeliveries
                },
                recentDeliveries
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Dispatcher Dashboard Overview
// @route   GET /api/dashboard/dispatcher
// @access  Private (ADMIN, DISPATCHER)
const getDispatcherDashboard = async (req, res, next) => {
    try {
        const [
            pendingDeliveries,
            activeDeliveries,
            availableDrivers,
            availableVehicles,
            activeAssignments,
            completedDeliveries,
            recentAssignments
        ] = await Promise.all([
            Delivery.countDocuments({ status: "PENDING" }),
            Delivery.countDocuments({ status: { $in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] } }),
            Driver.countDocuments({ availabilityStatus: "AVAILABLE" }),
            Vehicle.countDocuments({ status: "AVAILABLE", isActive: true }),
            Delivery.countDocuments({ status: "ASSIGNED" }),
            Delivery.countDocuments({ status: "DELIVERED" }),
            Delivery.find({ status: { $in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] } })
                .sort("-updatedAt")
                .limit(10)
                .populate("assignedDriver", "name email phone")
                .populate("assignedVehicle", "vehicleNumber registrationNumber type")
        ]);

        res.status(200).json({
            success: true,
            message: "Dispatcher dashboard retrieved successfully",
            data: {
                pendingDeliveries,
                activeDeliveries,
                availableDrivers,
                availableVehicles,
                activeAssignments,
                completedDeliveries,
                recentAssignments
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Driver Dashboard overview
// @route   GET /api/dashboard/driver
// @access  Private (ADMIN, DRIVER)
const getDriverDashboardStats = async (req, res, next) => {
    try {
        const driverUserId = req.user.id;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const [
            assignedDeliveries,
            todayDeliveries,
            completedDeliveries,
            pendingDeliveries,
            driverProfile,
            currentDelivery
        ] = await Promise.all([
            Delivery.countDocuments({ assignedDriver: driverUserId }),
            Delivery.countDocuments({
                assignedDriver: driverUserId,
                scheduledDate: { $gte: startOfToday, $lte: endOfToday }
            }),
            Delivery.countDocuments({ assignedDriver: driverUserId, status: "DELIVERED" }),
            Delivery.countDocuments({
                assignedDriver: driverUserId,
                status: { $in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] }
            }),
            Driver.findOne({ user: driverUserId }).populate("assignedVehicle"),
            Delivery.findOne({
                assignedDriver: driverUserId,
                status: { $in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] }
            })
                .sort("-updatedAt")
                .populate("assignedVehicle", "vehicleNumber registrationNumber type")
        ]);

        res.status(200).json({
            success: true,
            message: "Driver dashboard retrieved successfully",
            data: {
                assignedDeliveries,
                todayDeliveries,
                completedDeliveries,
                pendingDeliveries,
                assignedVehicle: driverProfile ? driverProfile.assignedVehicle : null,
                currentDeliveryStatus: currentDelivery ? currentDelivery.status : "NO_ACTIVE_DELIVERY",
                currentDelivery
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAdminDashboard,
    getDispatcherDashboard,
    getDriverDashboardStats
};
