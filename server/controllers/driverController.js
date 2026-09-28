const Driver = require("../models/Driver");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const { paginateQuery } = require("../utils/queryHelper");
const { isValidObjectId } = require("../utils/validators");

// @desc    Get drivers list (or own profile for DRIVER)
// @route   GET /api/drivers
// @access  Private (ADMIN, DISPATCHER, DRIVER)
const getDrivers = async (req, res, next) => {
    try {
        if (req.user.role === "DRIVER") {
            const profile = await Driver.findOne({ user: req.user.id })
                .populate("user", "name email role phone isActive")
                .populate("assignedVehicle");

            return res.status(200).json({
                success: true,
                message: "Driver profile retrieved",
                data: profile ? [profile] : [],
                pagination: { page: 1, limit: 10, total: profile ? 1 : 0, pages: profile ? 1 : 0 }
            });
        }

        const result = await paginateQuery(Driver, req.query, {
            allowedFilters: ["availabilityStatus"],
            searchFields: ["licenseNumber", "phone", "address"],
            populate: [
                { path: "user", select: "name email role phone isActive" },
                { path: "assignedVehicle", select: "vehicleNumber registrationNumber type status make model" }
            ],
            defaultSort: "-createdAt"
        });

        res.status(200).json({
            success: true,
            message: "Drivers retrieved successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get driver profile by ID (or driver userId)
// @route   GET /api/drivers/:id
// @access  Private (ADMIN, DISPATCHER, DRIVER)
const getDriverById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid driver ID"
            });
        }

        // Support lookup by Driver _id or User _id
        let driver = await Driver.findById(id)
            .populate("user", "name email role phone isActive")
            .populate("assignedVehicle");

        if (!driver) {
            driver = await Driver.findOne({ user: id })
                .populate("user", "name email role phone isActive")
                .populate("assignedVehicle");
        }

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found"
            });
        }

        // DRIVER can only view their own profile
        if (req.user.role === "DRIVER" && String(driver.user._id) !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only view your own driver profile"
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver retrieved successfully",
            data: driver
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new driver profile
// @route   POST /api/drivers
// @access  Private (ADMIN)
const createDriver = async (req, res, next) => {
    try {
        const {
            userId,
            phone,
            licenseNumber,
            licenseExpiry,
            address,
            emergencyContact,
            availabilityStatus,
            assignedVehicle
        } = req.body;

        if (!userId || !licenseNumber) {
            return res.status(400).json({
                success: false,
                message: "User ID and license number are required"
            });
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role !== "DRIVER") {
            return res.status(400).json({
                success: false,
                message: "User must have DRIVER role to create a driver profile"
            });
        }

        const existingDriver = await Driver.findOne({ user: userId });
        if (existingDriver) {
            return res.status(400).json({
                success: false,
                message: "Driver profile already exists for this user"
            });
        }

        const existingLicense = await Driver.findOne({ licenseNumber: licenseNumber.toUpperCase().trim() });
        if (existingLicense) {
            return res.status(400).json({
                success: false,
                message: "License number is already registered to another driver"
            });
        }

        let vehicleId = null;
        if (assignedVehicle) {
            if (!isValidObjectId(assignedVehicle)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid assigned vehicle ID"
                });
            }
            const vehicle = await Vehicle.findById(assignedVehicle);
            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    message: "Assigned vehicle not found"
                });
            }
            vehicleId = vehicle._id;
        }

        const driver = await Driver.create({
            user: userId,
            phone: phone || user.phone || "",
            licenseNumber: licenseNumber.toUpperCase().trim(),
            licenseExpiry: licenseExpiry || null,
            address: address || "",
            emergencyContact: emergencyContact || { name: "", phone: "", relationship: "" },
            availabilityStatus: availabilityStatus || "AVAILABLE",
            assignedVehicle: vehicleId
        });

        const populatedDriver = await Driver.findById(driver._id)
            .populate("user", "name email role phone")
            .populate("assignedVehicle");

        res.status(201).json({
            success: true,
            message: "Driver profile created successfully",
            data: populatedDriver
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update driver profile
// @route   PUT /api/drivers/:id
// @access  Private (ADMIN, DISPATCHER, DRIVER)
const updateDriver = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid driver ID"
            });
        }

        let driver = await Driver.findById(id);
        if (!driver) {
            driver = await Driver.findOne({ user: id });
        }

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found"
            });
        }

        // DRIVER can only update their own profile and restricted fields
        if (req.user.role === "DRIVER") {
            if (String(driver.user) !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You cannot modify another driver's profile"
                });
            }

            // Driver can update phone, address, emergencyContact
            const { phone, address, emergencyContact } = req.body;
            if (phone !== undefined) driver.phone = phone.trim();
            if (address !== undefined) driver.address = address.trim();
            if (emergencyContact !== undefined) driver.emergencyContact = emergencyContact;

            await driver.save();

            const updated = await Driver.findById(driver._id)
                .populate("user", "name email role phone")
                .populate("assignedVehicle");

            return res.status(200).json({
                success: true,
                message: "Driver profile updated successfully",
                data: updated
            });
        }

        // ADMIN / DISPATCHER updating
        const {
            phone,
            licenseNumber,
            licenseExpiry,
            address,
            emergencyContact,
            availabilityStatus,
            assignedVehicle
        } = req.body;

        if (licenseNumber && licenseNumber.toUpperCase().trim() !== driver.licenseNumber) {
            const exists = await Driver.findOne({ licenseNumber: licenseNumber.toUpperCase().trim() });
            if (exists) {
                return res.status(400).json({
                    success: false,
                    message: "License number already in use"
                });
            }
            driver.licenseNumber = licenseNumber.toUpperCase().trim();
        }

        if (phone !== undefined) driver.phone = phone.trim();
        if (licenseExpiry !== undefined) driver.licenseExpiry = licenseExpiry;
        if (address !== undefined) driver.address = address.trim();
        if (emergencyContact !== undefined) driver.emergencyContact = emergencyContact;

        if (availabilityStatus) {
            const valid = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"];
            if (valid.includes(availabilityStatus.toUpperCase())) {
                driver.availabilityStatus = availabilityStatus.toUpperCase();
            }
        }

        if (assignedVehicle !== undefined) {
            if (assignedVehicle === null || assignedVehicle === "") {
                driver.assignedVehicle = null;
            } else if (isValidObjectId(assignedVehicle)) {
                driver.assignedVehicle = assignedVehicle;
            }
        }

        await driver.save();

        const updated = await Driver.findById(driver._id)
            .populate("user", "name email role phone")
            .populate("assignedVehicle");

        res.status(200).json({
            success: true,
            message: "Driver profile updated successfully",
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update driver availability status
// @route   PATCH /api/drivers/:id/status
// @access  Private (ADMIN, DISPATCHER, DRIVER)
const updateDriverStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid driver ID"
            });
        }

        let driver = await Driver.findById(id);
        if (!driver) {
            driver = await Driver.findOne({ user: id });
        }

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found"
            });
        }

        const validStatuses = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"];
        if (!status || !validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: `Valid status is required. Allowed values: ${validStatuses.join(", ")}`
            });
        }

        // If DRIVER is changing their own status: can set AVAILABLE or OFF_DUTY
        if (req.user.role === "DRIVER") {
            if (String(driver.user) !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Cannot change another driver's status"
                });
            }

            const driverAllowed = ["AVAILABLE", "OFF_DUTY"];
            if (!driverAllowed.includes(status.toUpperCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Driver can only set status to: ${driverAllowed.join(", ")}`
                });
            }
        }

        driver.availabilityStatus = status.toUpperCase();
        await driver.save();

        res.status(200).json({
            success: true,
            message: `Driver availability status updated to ${driver.availabilityStatus}`,
            data: driver
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Assign or unassign vehicle to driver
// @route   PATCH /api/drivers/:id/vehicle
// @access  Private (ADMIN, DISPATCHER)
const updateDriverVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { vehicleId } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid driver ID"
            });
        }

        let driver = await Driver.findById(id);
        if (!driver) {
            driver = await Driver.findOne({ user: id });
        }

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found"
            });
        }

        if (vehicleId === null || vehicleId === "") {
            driver.assignedVehicle = null;
            await driver.save();
            return res.status(200).json({
                success: true,
                message: "Vehicle unassigned from driver successfully",
                data: driver
            });
        }

        if (!isValidObjectId(vehicleId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID"
            });
        }

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        driver.assignedVehicle = vehicle._id;
        await driver.save();

        const updated = await Driver.findById(driver._id)
            .populate("user", "name email role phone")
            .populate("assignedVehicle");

        res.status(200).json({
            success: true,
            message: "Vehicle assigned to driver successfully",
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDrivers,
    getDriverById,
    createDriver,
    updateDriver,
    updateDriverStatus,
    updateDriverVehicle
};
