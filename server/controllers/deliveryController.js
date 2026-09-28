const Delivery = require("../models/Delivery");
const ProofOfDelivery = require("../models/ProofOfDelivery");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const { paginateQuery } = require("../utils/queryHelper");
const { isValidObjectId, isValidPhone } = require("../utils/validators");

// Generate unique delivery tracking number
const generateDeliveryNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `DEL-${timestamp}-${random}`;
};

// @desc    Get all deliveries (or assigned for DRIVER)
// @route   GET /api/deliveries
// @access  Private (ADMIN, DISPATCHER, DRIVER)
const getDeliveries = async (req, res, next) => {
    try {
        let baseFilter = {};

        // If DRIVER, only see their assigned deliveries
        if (req.user.role === "DRIVER") {
            baseFilter.assignedDriver = req.user.id;
        }

        const result = await paginateQuery(Delivery, req.query, {
            baseFilter,
            allowedFilters: ["status", "priority", "assignedDriver", "assignedVehicle"],
            searchFields: ["deliveryNumber", "customerName", "customerPhone", "pickupAddress", "deliveryAddress"],
            populate: [
                { path: "assignedDriver", select: "name email phone role" },
                { path: "assignedVehicle", select: "vehicleNumber registrationNumber type make model status" },
                { path: "dispatcher", select: "name email role" },
                { path: "proofOfDelivery" }
            ],
            defaultSort: "-createdAt"
        });

        res.status(200).json({
            success: true,
            message: "Deliveries retrieved successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get delivery by ID
// @route   GET /api/deliveries/:id
// @access  Private (ADMIN, DISPATCHER, DRIVER)
const getDeliveryById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery ID"
            });
        }

        const delivery = await Delivery.findById(id)
            .populate("assignedDriver", "name email phone role")
            .populate("assignedVehicle", "vehicleNumber registrationNumber type make model status")
            .populate("dispatcher", "name email role")
            .populate("proofOfDelivery");

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery not found"
            });
        }

        // DRIVER can only view deliveries assigned to them
        if (req.user.role === "DRIVER" && (!delivery.assignedDriver || String(delivery.assignedDriver._id) !== req.user.id)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only view deliveries assigned to you"
            });
        }

        res.status(200).json({
            success: true,
            message: "Delivery retrieved successfully",
            data: delivery
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new delivery
// @route   POST /api/deliveries
// @access  Private (ADMIN, DISPATCHER)
const createDelivery = async (req, res, next) => {
    try {
        const {
            deliveryNumber,
            customerName,
            customerPhone,
            pickupAddress,
            deliveryAddress,
            pickupCoordinates,
            deliveryCoordinates,
            packageDescription,
            packageWeight,
            priority,
            scheduledDate,
            notes
        } = req.body;

        if (!customerName || !customerPhone || !pickupAddress || !deliveryAddress) {
            return res.status(400).json({
                success: false,
                message: "Customer name, phone, pickup address, and delivery address are required"
            });
        }

        let delNum = deliveryNumber ? deliveryNumber.toUpperCase().trim() : generateDeliveryNumber();

        // Ensure unique deliveryNumber
        const existing = await Delivery.findOne({ deliveryNumber: delNum });
        if (existing) {
            delNum = generateDeliveryNumber();
        }

        const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
        const delPriority = priority && validPriorities.includes(priority.toUpperCase())
            ? priority.toUpperCase()
            : "MEDIUM";

        const delivery = await Delivery.create({
            deliveryNumber: delNum,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            pickupAddress: pickupAddress.trim(),
            deliveryAddress: deliveryAddress.trim(),
            pickupCoordinates: pickupCoordinates || { lat: 0, lng: 0 },
            deliveryCoordinates: deliveryCoordinates || { lat: 0, lng: 0 },
            packageDescription: packageDescription || "",
            packageWeight: packageWeight || 1,
            priority: delPriority,
            scheduledDate: scheduledDate || new Date(),
            status: "PENDING",
            dispatcher: req.user.id,
            notes: notes || ""
        });

        res.status(201).json({
            success: true,
            message: "Delivery created successfully",
            data: delivery
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update delivery details
// @route   PUT /api/deliveries/:id
// @access  Private (ADMIN, DISPATCHER)
const updateDelivery = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery ID"
            });
        }

        const delivery = await Delivery.findById(id);
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery not found"
            });
        }

        // If delivery is already DELIVERED or CANCELLED, prevent major modifications
        if (delivery.status === "DELIVERED") {
            return res.status(400).json({
                success: false,
                message: "Cannot modify an already DELIVERED delivery"
            });
        }

        const {
            customerName,
            customerPhone,
            pickupAddress,
            deliveryAddress,
            pickupCoordinates,
            deliveryCoordinates,
            packageDescription,
            packageWeight,
            priority,
            scheduledDate,
            notes
        } = req.body;

        if (customerName) delivery.customerName = customerName.trim();
        if (customerPhone) delivery.customerPhone = customerPhone.trim();
        if (pickupAddress) delivery.pickupAddress = pickupAddress.trim();
        if (deliveryAddress) delivery.deliveryAddress = deliveryAddress.trim();
        if (pickupCoordinates) delivery.pickupCoordinates = pickupCoordinates;
        if (deliveryCoordinates) delivery.deliveryCoordinates = deliveryCoordinates;
        if (packageDescription !== undefined) delivery.packageDescription = packageDescription.trim();
        if (packageWeight !== undefined) delivery.packageWeight = packageWeight;
        if (priority) {
            const valid = ["LOW", "MEDIUM", "HIGH", "URGENT"];
            if (valid.includes(priority.toUpperCase())) {
                delivery.priority = priority.toUpperCase();
            }
        }
        if (scheduledDate) delivery.scheduledDate = scheduledDate;
        if (notes !== undefined) delivery.notes = notes.trim();

        await delivery.save();

        const updated = await Delivery.findById(delivery._id)
            .populate("assignedDriver", "name email phone")
            .populate("assignedVehicle", "vehicleNumber registrationNumber type")
            .populate("dispatcher", "name email");

        res.status(200).json({
            success: true,
            message: "Delivery updated successfully",
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete delivery
// @route   DELETE /api/deliveries/:id
// @access  Private (ADMIN)
const deleteDelivery = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery ID"
            });
        }

        const delivery = await Delivery.findByIdAndDelete(id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery not found"
            });
        }

        // Clean up any proof of delivery
        await ProofOfDelivery.findOneAndDelete({ delivery: id });

        res.status(200).json({
            success: true,
            message: "Delivery deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update delivery status
// @route   PATCH /api/deliveries/:id/status
// @access  Private (ADMIN, DISPATCHER, DRIVER)
const updateDeliveryStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery ID"
            });
        }

        const validStatuses = [
            "PENDING",
            "ASSIGNED",
            "PICKED_UP",
            "IN_TRANSIT",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "FAILED",
            "CANCELLED"
        ];

        if (!status || !validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: `Valid status is required. Allowed values: ${validStatuses.join(", ")}`
            });
        }

        const newStatus = status.toUpperCase();
        const delivery = await Delivery.findById(id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery not found"
            });
        }

        // DRIVER checks
        if (req.user.role === "DRIVER") {
            if (!delivery.assignedDriver || String(delivery.assignedDriver) !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You can only update deliveries assigned to you"
                });
            }

            // Driver permitted status transitions
            const driverAllowedStatuses = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "FAILED"];
            if (!driverAllowedStatuses.includes(newStatus)) {
                return res.status(400).json({
                    success: false,
                    message: `Drivers can only change status to: ${driverAllowedStatuses.join(", ")}. Use proof endpoint for DELIVERED.`
                });
            }
        }

        delivery.status = newStatus;
        await delivery.save();

        // If delivery becomes DELIVERED, FAILED, or CANCELLED, we may update driver/vehicle availability if no other active deliveries
        if (["DELIVERED", "FAILED", "CANCELLED"].includes(newStatus)) {
            if (delivery.assignedDriver) {
                const otherActive = await Delivery.countDocuments({
                    assignedDriver: delivery.assignedDriver,
                    _id: { $ne: delivery._id },
                    status: { $in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] }
                });

                if (otherActive === 0) {
                    await Driver.findOneAndUpdate(
                        { user: delivery.assignedDriver },
                        { availabilityStatus: "AVAILABLE" }
                    );
                }
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
        }

        const updated = await Delivery.findById(delivery._id)
            .populate("assignedDriver", "name email phone")
            .populate("assignedVehicle", "vehicleNumber registrationNumber status")
            .populate("dispatcher", "name email");

        res.status(200).json({
            success: true,
            message: `Delivery status updated to ${delivery.status}`,
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit Proof of Delivery
// @route   POST /api/deliveries/:id/proof
// @access  Private (ADMIN, DISPATCHER, DRIVER)
const submitProofOfDelivery = async (req, res, next) => {
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
                message: "Recipient name is required for proof of delivery"
            });
        }

        const delivery = await Delivery.findById(id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery not found"
            });
        }

        // If DRIVER, ensure this delivery is assigned to them
        if (req.user.role === "DRIVER") {
            if (!delivery.assignedDriver || String(delivery.assignedDriver) !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You can only submit proof of delivery for your own assigned delivery"
                });
            }
        }

        if (delivery.status === "DELIVERED" && delivery.proofOfDelivery) {
            return res.status(400).json({
                success: false,
                message: "Proof of delivery has already been submitted for this delivery"
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

        // Release driver and vehicle if no other active deliveries
        if (delivery.assignedDriver) {
            const otherActive = await Delivery.countDocuments({
                assignedDriver: delivery.assignedDriver,
                _id: { $ne: delivery._id },
                status: { $in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] }
            });

            if (otherActive === 0) {
                await Driver.findOneAndUpdate(
                    { user: delivery.assignedDriver },
                    { availabilityStatus: "AVAILABLE" }
                );
            }
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

        const populatedDelivery = await Delivery.findById(delivery._id)
            .populate("assignedDriver", "name email phone")
            .populate("assignedVehicle", "vehicleNumber registrationNumber")
            .populate("proofOfDelivery");

        res.status(201).json({
            success: true,
            message: "Proof of delivery submitted successfully. Delivery marked as DELIVERED",
            data: {
                delivery: populatedDelivery,
                proofOfDelivery: proof
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDeliveries,
    getDeliveryById,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    updateDeliveryStatus,
    submitProofOfDelivery
};
