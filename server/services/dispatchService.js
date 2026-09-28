const Delivery = require("../models/Delivery");
const Driver = require("../models/Driver");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const { isValidObjectId } = require("../utils/validators");

/**
 * Assign Driver and Vehicle to a Delivery
 */
const assignDelivery = async ({ deliveryId, driverId, vehicleId, dispatcherId }) => {
    // 1. Validate ObjectIds
    if (!isValidObjectId(deliveryId)) {
        throw { statusCode: 400, message: "Invalid delivery ID" };
    }
    if (!isValidObjectId(driverId)) {
        throw { statusCode: 400, message: "Invalid driver ID" };
    }
    if (!isValidObjectId(vehicleId)) {
        throw { statusCode: 400, message: "Invalid vehicle ID" };
    }

    // 2. Validate Delivery
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
        throw { statusCode: 404, message: "Delivery not found" };
    }

    if (["DELIVERED", "CANCELLED"].includes(delivery.status)) {
        throw {
            statusCode: 400,
            message: `Cannot assign delivery with status '${delivery.status}'`
        };
    }

    // 3. Validate Driver (resolve by Driver Profile _id or User _id)
    let driverProfile = await Driver.findById(driverId).populate("user");
    if (!driverProfile) {
        driverProfile = await Driver.findOne({ user: driverId }).populate("user");
    }

    if (!driverProfile) {
        // Check if user exists with DRIVER role and create a default profile if missing
        const driverUser = await User.findById(driverId);
        if (!driverUser || driverUser.role !== "DRIVER") {
            throw { statusCode: 404, message: "Driver user not found or user is not a DRIVER" };
        }
        if (!driverUser.isActive) {
            throw { statusCode: 400, message: "Driver user account is inactive" };
        }

        // Auto-create basic profile
        driverProfile = await Driver.create({
            user: driverUser._id,
            licenseNumber: `LIC-${driverUser._id.toString().slice(-6).toUpperCase()}`,
            phone: driverUser.phone || "",
            availabilityStatus: "AVAILABLE"
        });
        driverProfile = await Driver.findById(driverProfile._id).populate("user");
    } else {
        if (!driverProfile.user || !driverProfile.user.isActive) {
            throw { statusCode: 400, message: "Driver user account is inactive" };
        }
    }

    // Check Driver Availability
    if (
        driverProfile.availabilityStatus !== "AVAILABLE" &&
        (!delivery.assignedDriver || String(delivery.assignedDriver) !== String(driverProfile.user._id))
    ) {
        throw {
            statusCode: 400,
            message: `Driver is currently ${driverProfile.availabilityStatus} and cannot be assigned`
        };
    }

    // 4. Validate Vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
        throw { statusCode: 404, message: "Vehicle not found" };
    }

    if (!vehicle.isActive) {
        throw { statusCode: 400, message: "Vehicle is marked as inactive" };
    }

    if (
        !["AVAILABLE", "ASSIGNED"].includes(vehicle.status) &&
        (!delivery.assignedVehicle || String(delivery.assignedVehicle) !== String(vehicle._id))
    ) {
        throw {
            statusCode: 400,
            message: `Vehicle is currently in '${vehicle.status}' status and cannot be assigned`
        };
    }

    // Check if vehicle is already actively in transit on another delivery
    const conflictingDelivery = await Delivery.findOne({
        _id: { $ne: delivery._id },
        assignedVehicle: vehicle._id,
        status: { $in: ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] }
    });

    if (conflictingDelivery) {
        throw {
            statusCode: 400,
            message: `Vehicle is currently active on delivery ${conflictingDelivery.deliveryNumber}`
        };
    }

    // 5. Apply Updates
    delivery.assignedDriver = driverProfile.user._id;
    delivery.assignedVehicle = vehicle._id;
    delivery.dispatcher = dispatcherId;
    delivery.status = "ASSIGNED";
    await delivery.save();

    // Update Driver
    driverProfile.availabilityStatus = "ON_TRIP";
    driverProfile.assignedVehicle = vehicle._id;
    await driverProfile.save();

    // Update Vehicle
    vehicle.status = "ASSIGNED";
    await vehicle.save();

    // Return Populated Delivery
    return await Delivery.findById(delivery._id)
        .populate("assignedDriver", "name email phone role")
        .populate("assignedVehicle", "vehicleNumber registrationNumber type make model status capacity")
        .populate("dispatcher", "name email role");
};

module.exports = {
    assignDelivery
};
