const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
    {
        deliveryNumber: {
            type: String,
            required: [true, "Delivery number is required"],
            unique: true,
            uppercase: true,
            trim: true
        },

        customerName: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true
        },

        customerPhone: {
            type: String,
            required: [true, "Customer phone is required"],
            trim: true
        },

        pickupAddress: {
            type: String,
            required: [true, "Pickup address is required"],
            trim: true
        },

        deliveryAddress: {
            type: String,
            required: [true, "Delivery address is required"],
            trim: true
        },

        pickupCoordinates: {
            lat: {
                type: Number,
                default: 0
            },
            lng: {
                type: Number,
                default: 0
            }
        },

        deliveryCoordinates: {
            lat: {
                type: Number,
                default: 0
            },
            lng: {
                type: Number,
                default: 0
            }
        },

        packageDescription: {
            type: String,
            trim: true,
            default: ""
        },

        packageWeight: {
            type: Number,
            default: 1 // Weight in kg
        },

        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            default: "MEDIUM"
        },

        scheduledDate: {
            type: Date,
            default: Date.now
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "ASSIGNED",
                "PICKED_UP",
                "IN_TRANSIT",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "FAILED",
                "CANCELLED"
            ],
            default: "PENDING"
        },

        assignedDriver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        assignedVehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            default: null
        },

        dispatcher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        proofOfDelivery: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProofOfDelivery",
            default: null
        },

        notes: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Delivery", deliverySchema);
