const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Associated user reference is required"],
            unique: true
        },

        phone: {
            type: String,
            trim: true,
            default: ""
        },

        licenseNumber: {
            type: String,
            required: [true, "License number is required"],
            unique: true,
            uppercase: true,
            trim: true
        },

        licenseExpiry: {
            type: Date
        },

        address: {
            type: String,
            trim: true,
            default: ""
        },

        emergencyContact: {
            name: {
                type: String,
                trim: true,
                default: ""
            },
            phone: {
                type: String,
                trim: true,
                default: ""
            },
            relationship: {
                type: String,
                trim: true,
                default: ""
            }
        },

        availabilityStatus: {
            type: String,
            enum: ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"],
            default: "AVAILABLE"
        },

        assignedVehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Driver", driverSchema);
