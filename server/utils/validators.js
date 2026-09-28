const mongoose = require("mongoose");

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === "string" && emailRegex.test(email.trim());
};

/**
 * Validate phone number format (flexible international/local format)
 */
const isValidPhone = (phone) => {
    if (!phone) return true; // optional unless specified
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;
    return phoneRegex.test(phone.trim());
};

module.exports = {
    isValidObjectId,
    isValidEmail,
    isValidPhone
};
