const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
    {
        vehicleNumber: {
            type: String,
            required: [true, "Vehicle number is required"],
            unique: true,
            uppercase: true,
            trim: true
        },

        registrationNumber: {
            type: String,
            required: [true, "Registration number is required"],
            unique: true,
            uppercase: true,
            trim: true
        },

        type: {
            type: String,
            required: [true, "Vehicle type is required"],
            enum: ["TRUCK", "VAN", "CAR", "BIKE", "TRAILER", "OTHER"],
            default: "VAN"
        },

        make: {
            type: String,
            trim: true,
            default: ""
        },

        model: {
            type: String,
            trim: true,
            default: ""
        },

        year: {
            type: Number,
            min: 1990,
            max: new Date().getFullYear() + 1
        },

        capacity: {
            type: Number,
            default: 1000 // In kg
        },

        fuelType: {
            type: String,
            enum: ["DIESEL", "PETROL", "ELECTRIC", "HYBRID", "CNG", "OTHER"],
            default: "DIESEL"
        },

        status: {
            type: String,
            enum: ["AVAILABLE", "ASSIGNED", "IN_TRANSIT", "MAINTENANCE", "INACTIVE"],
            default: "AVAILABLE"
        },

        currentLocation: {
            address: {
                type: String,
                trim: true,
                default: ""
            },
            lat: {
                type: Number,
                default: 0
            },
            lng: {
                type: Number,
                default: 0
            }
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
