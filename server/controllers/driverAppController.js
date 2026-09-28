const Delivery = require("../models/Delivery");
const Driver = require("../models/Driver");
const ProofOfDelivery = require("../models/ProofOfDelivery");
const Vehicle = require("../models/Vehicle");
const { paginateQuery } = require("../utils/queryHelper");
const { isValidObjectId } = require("../utils/validators");

// @desc    Get Driver Dashboard overview & statistics
// @route   GET /api/driver/dashboard
// @access  Private (DRIVER, ADMIN)
const getDriverDashboard = async (req, res, next) => {
    try {
        const driverUserId = req.user.id;

        // Start and end of today in UTC
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const [
            totalAssigned,
            todayDeliveries,
            completedDeliveries,
            pendingDeliveries,
            activeDeliveries,
            driverProfile,
            currentActiveDelivery
        ] = await Promise.all([
            Delivery.countDocuments({ assignedDriver: driverUserId }),
            Delivery.countDocuments({
                assignedDriver: driverUserId,
                scheduledDate: { $gte: startOfToday, $lte: endOfToday }
            }),
            Delivery.countDocuments({ assignedDriver: driverUserId, status: "DELIVERED" }),
            Delivery.countDocuments({ assignedDriver: driverUserId, status: { $in: ["PENDING", "ASSIGNED"] } }),
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
                .populate("assignedVehicle", "vehicleNumber registrationNumber type status")
        ]);

        res.status(200).json({
            success: true,
            message: "Driver dashboard retrieved successfully",
            data: {
                metrics: {
                    totalAssigned,
                    todayDeliveries,
                    completedDeliveries,
                    pendingDeliveries,
                    activeDeliveries
                },
                assignedVehicle: driverProfile ? driverProfile.assignedVehicle : null,
                availabilityStatus: driverProfile ? driverProfile.availabilityStatus : "AVAILABLE",
                currentDelivery: currentActiveDelivery
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all deliveries assigned to logged-in driver
// @route   GET /api/driver/deliveries
// @access  Private (DRIVER, ADMIN)
const getDriverDeliveries = async (req, res, next) => {
    try {
        const result = await paginateQuery(Delivery, req.query, {
            baseFilter: { assignedDriver: req.user.id },
            allowedFilters: ["status", "priority"],
            searchFields: ["deliveryNumber", "customerName", "customerPhone", "pickupAddress", "deliveryAddress"],
            populate: [
                { path: "assignedVehicle", select: "vehicleNumber registrationNumber type make model" },
                { path: "proofOfDelivery" }
            ],
            defaultSort: "-createdAt"
        });

        res.status(200).json({
            success: true,
            message: "Driver deliveries retrieved successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get specific delivery assigned to logged-in driver
// @route   GET /api/driver/deliveries/:id
// @access  Private (DRIVER, ADMIN)
const getDriverDeliveryById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery ID"
            });
        }

        const delivery = await Delivery.findOne({
            _id: id,
            assignedDriver: req.user.id
        })
            .populate("assignedVehicle", "vehicleNumber registrationNumber type make model")
            .populate("dispatcher", "name email phone")
            .populate("proofOfDelivery");

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery not found or not assigned to you"
            });
        }

        res.status(200).json({
            success: true,
            message: "Delivery details retrieved successfully",
            data: delivery
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update status of delivery assigned to logged-in driver
// @route   PATCH /api/driver/deliveries/:id/status
// @access  Private (DRIVER, ADMIN)
const updateDriverDeliveryStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery ID"
            });
        }

        const allowed = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "FAILED"];
        if (!status || !allowed.includes(status.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: ${allowed.join(", ")}. To mark as DELIVERED, use the proof endpoint.`
            });
        }

        const delivery = await Delivery.findOne({
            _id: id,
            assignedDriver: req.user.id
        });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery not found or not assigned to you"
            });
        }

        if (delivery.status === "DELIVERED") {
            return res.status(400).json({
                success: false,
                message: "Cannot modify status of an already DELIVERED delivery"
            });
        }

        delivery.status = status.toUpperCase();
        await delivery.save();

        res.status(200).json({
            success: true,
            message: `Delivery status updated to ${delivery.status}`,
            data: delivery
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit Proof of Delivery for driver's assigned delivery
// @route   POST /api/driver/deliveries/:id/proof
// @access  Private (DRIVER, ADMIN)
const submitDriverProof = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { recipientName, recipientPhone, signature, photo, notes } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery ID"
            });
        }

        if (!recipientName) {
            return res.status(400).json({
                success: false,
                message: "Recipient name is required"
            });
        }

        const delivery = await Delivery.findOne({
            _id: id,
            assignedDriver: req.user.id
        });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery not found or not assigned to you"
            });
        }

        if (delivery.status === "DELIVERED" && delivery.proofOfDelivery) {
            return res.status(400).json({
                success: false,
                message: "Proof of delivery has already been submitted"
            });
        }

        const proof = await ProofOfDelivery.create({
            delivery: delivery._id,
            driver: req.user.id,
            recipientName: recipientName.trim(),
            recipientPhone: recipientPhone ? recipientPhone.trim() : "",
            signature: signature || "",
            photo: photo || "",
            notes: notes ? notes.trim() : "",
            deliveredAt: new Date()
        });

        delivery.proofOfDelivery = proof._id;
        delivery.status = "DELIVERED";
        await delivery.save();

        // Check if driver has other active deliveries; if none, release to AVAILABLE
        const otherActive = await Delivery.countDocuments({
            assignedDriver: req.user.id,
            _id: { $ne: delivery._id },
            status: { $in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] }
        });

        if (otherActive === 0) {
            await Driver.findOneAndUpdate(
                { user: req.user.id },
                { availabilityStatus: "AVAILABLE" }
            );
        }

        if (delivery.assignedVehicle) {
            const otherActiveVehicle = await Delivery.countDocuments({
                assignedVehicle: delivery.assignedVehicle,
                _id: { $ne: delivery._id },
                status: { $in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] }
            });

            if (otherActiveVehicle === 0) {
                await Vehicle.findByIdAndUpdate(delivery.assignedVehicle, { status: "AVAILABLE" });
            }
        }

        res.status(201).json({
            success: true,
            message: "Proof of delivery submitted successfully. Marked as DELIVERED",
            data: {
                delivery,
                proofOfDelivery: proof
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDriverDashboard,
    getDriverDeliveries,
    getDriverDeliveryById,
    updateDriverDeliveryStatus,
    submitDriverProof
};
