const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const { paginateQuery } = require("../utils/queryHelper");
const { isValidObjectId } = require("../utils/validators");

// @desc    Get all vehicles (or assigned vehicle for DRIVER)
// @route   GET /api/vehicles
// @access  Private (ADMIN, DISPATCHER, DRIVER)
const getVehicles = async (req, res, next) => {
    try {
        // If DRIVER, only return their assigned vehicle
        if (req.user.role === "DRIVER") {
            const driverProfile = await Driver.findOne({ user: req.user.id });
            if (!driverProfile || !driverProfile.assignedVehicle) {
                return res.status(200).json({
                    success: true,
                    message: "No vehicle currently assigned",
                    data: [],
                    pagination: { page: 1, limit: 10, total: 0, pages: 0 }
                });
            }

            const vehicle = await Vehicle.findById(driverProfile.assignedVehicle);
            return res.status(200).json({
                success: true,
                message: "Assigned vehicle retrieved successfully",
                data: vehicle ? [vehicle] : [],
                pagination: { page: 1, limit: 10, total: vehicle ? 1 : 0, pages: vehicle ? 1 : 0 }
            });
        }

        const result = await paginateQuery(Vehicle, req.query, {
            allowedFilters: ["status", "type", "fuelType", "isActive"],
            searchFields: ["vehicleNumber", "registrationNumber", "make", "model"],
            defaultSort: "-createdAt"
        });

        res.status(200).json({
            success: true,
            message: "Vehicles retrieved successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private (ADMIN, DISPATCHER, DRIVER)
const getVehicleById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID"
            });
        }

        const vehicle = await Vehicle.findById(id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        // If DRIVER, verify this is their assigned vehicle
        if (req.user.role === "DRIVER") {
            const driverProfile = await Driver.findOne({ user: req.user.id });
            if (!driverProfile || String(driverProfile.assignedVehicle) !== String(vehicle._id)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You can only view your assigned vehicle"
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Vehicle retrieved successfully",
            data: vehicle
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new vehicle
// @route   POST /api/vehicles
// @access  Private (ADMIN)
const createVehicle = async (req, res, next) => {
    try {
        const {
            vehicleNumber,
            registrationNumber,
            type,
            make,
            model,
            year,
            capacity,
            fuelType,
            status,
            currentLocation,
            isActive
        } = req.body;

        if (!vehicleNumber || !registrationNumber) {
            return res.status(400).json({
                success: false,
                message: "Vehicle number and registration number are required"
            });
        }

        // Check uniqueness
        const existingNum = await Vehicle.findOne({ vehicleNumber: vehicleNumber.toUpperCase().trim() });
        if (existingNum) {
            return res.status(400).json({
                success: false,
                message: "Vehicle with this vehicle number already exists"
            });
        }

        const existingReg = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase().trim() });
        if (existingReg) {
            return res.status(400).json({
                success: false,
                message: "Vehicle with this registration number already exists"
            });
        }

        const vehicle = await Vehicle.create({
            vehicleNumber: vehicleNumber.toUpperCase().trim(),
            registrationNumber: registrationNumber.toUpperCase().trim(),
            type: type || "VAN",
            make: make || "",
            model: model || "",
            year: year || new Date().getFullYear(),
            capacity: capacity || 1000,
            fuelType: fuelType || "DIESEL",
            status: status || "AVAILABLE",
            currentLocation: currentLocation || { address: "", lat: 0, lng: 0 },
            isActive: isActive !== undefined ? Boolean(isActive) : true
        });

        res.status(201).json({
            success: true,
            message: "Vehicle created successfully",
            data: vehicle
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update vehicle details
// @route   PUT /api/vehicles/:id
// @access  Private (ADMIN)
const updateVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID"
            });
        }

        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        const {
            vehicleNumber,
            registrationNumber,
            type,
            make,
            model,
            year,
            capacity,
            fuelType,
            status,
            currentLocation,
            isActive
        } = req.body;

        if (vehicleNumber && vehicleNumber.toUpperCase().trim() !== vehicle.vehicleNumber) {
            const exists = await Vehicle.findOne({ vehicleNumber: vehicleNumber.toUpperCase().trim() });
            if (exists) {
                return res.status(400).json({
                    success: false,
                    message: "Vehicle number is already taken"
                });
            }
            vehicle.vehicleNumber = vehicleNumber.toUpperCase().trim();
        }

        if (registrationNumber && registrationNumber.toUpperCase().trim() !== vehicle.registrationNumber) {
            const exists = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase().trim() });
            if (exists) {
                return res.status(400).json({
                    success: false,
                    message: "Registration number is already taken"
                });
            }
            vehicle.registrationNumber = registrationNumber.toUpperCase().trim();
        }

        if (type) vehicle.type = type;
        if (make !== undefined) vehicle.make = make;
        if (model !== undefined) vehicle.model = model;
        if (year !== undefined) vehicle.year = year;
        if (capacity !== undefined) vehicle.capacity = capacity;
        if (fuelType) vehicle.fuelType = fuelType;
        if (status) vehicle.status = status;
        if (currentLocation) vehicle.currentLocation = currentLocation;
        if (isActive !== undefined) vehicle.isActive = Boolean(isActive);

        await vehicle.save();

        res.status(200).json({
            success: true,
            message: "Vehicle updated successfully",
            data: vehicle
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (ADMIN)
const deleteVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID"
            });
        }

        const vehicle = await Vehicle.findByIdAndDelete(id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        // Unlink from any driver profile having this vehicle
        await Driver.updateMany({ assignedVehicle: id }, { assignedVehicle: null });

        res.status(200).json({
            success: true,
            message: "Vehicle deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update vehicle status
// @route   PATCH /api/vehicles/:id/status
// @access  Private (ADMIN, DISPATCHER)
const updateVehicleStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID"
            });
        }

        const validStatuses = ["AVAILABLE", "ASSIGNED", "IN_TRANSIT", "MAINTENANCE", "INACTIVE"];
        if (!status || !validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: `Valid status is required. Allowed values: ${validStatuses.join(", ")}`
            });
        }

        const vehicle = await Vehicle.findByIdAndUpdate(
            id,
            { status: status.toUpperCase() },
            { new: true, runValidators: true }
        );

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        res.status(200).json({
            success: true,
            message: `Vehicle status updated to ${vehicle.status}`,
            data: vehicle
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus
};
