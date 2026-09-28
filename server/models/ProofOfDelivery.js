const mongoose = require("mongoose");

const proofOfDeliverySchema = new mongoose.Schema(
    {
        delivery: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Delivery",
            required: [true, "Delivery reference is required"],
            unique: true
        },

        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Driver reference is required"]
        },

        recipientName: {
            type: String,
            required: [true, "Recipient name is required"],
            trim: true
        },

        recipientPhone: {
            type: String,
            trim: true,
            default: ""
        },

        signature: {
            type: String,
            default: ""
        },

        photo: {
            type: String,
            default: ""
        },

        notes: {
            type: String,
            trim: true,
            default: ""
        },

        deliveredAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("ProofOfDelivery", proofOfDeliverySchema);
