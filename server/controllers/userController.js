const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { paginateQuery } = require("../utils/queryHelper");
const { isValidObjectId, isValidEmail } = require("../utils/validators");

// @desc    Get all users with search, filter, and pagination
// @route   GET /api/users
// @access  Private (ADMIN)
const getUsers = async (req, res, next) => {
    try {
        const result = await paginateQuery(User, req.query, {
            allowedFilters: ["role", "isActive"],
            searchFields: ["name", "email", "phone"],
            select: "-password",
            defaultSort: "-createdAt"
        });

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (ADMIN)
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const user = await User.findById(id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (ADMIN)
const createUser = async (req, res, next) => {
    try {
        const { name, email, password, role, phone, isActive } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: [
                    { field: "name", message: "Name is required" },
                    { field: "email", message: "Email is required" },
                    { field: "password", message: "Password is required" }
                ].filter(e => !req.body[e.field])
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const validRoles = ["ADMIN", "DISPATCHER", "DRIVER"];
        const assignedRole = role && validRoles.includes(role.toUpperCase()) ? role.toUpperCase() : "DRIVER";

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: assignedRole,
            phone: phone ? phone.trim() : "",
            isActive: isActive !== undefined ? Boolean(isActive) : true
        });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private (ADMIN)
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, phone, isActive } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Email uniqueness check if updating email
        if (email && email.toLowerCase() !== user.email) {
            if (!isValidEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email format"
                });
            }

            const emailExists = await User.findOne({ email: email.toLowerCase() });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: "Email is already taken by another user"
                });
            }
            user.email = email.toLowerCase().trim();
        }

        if (name) user.name = name.trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (isActive !== undefined) user.isActive = Boolean(isActive);

        if (role) {
            const validRoles = ["ADMIN", "DISPATCHER", "DRIVER"];
            if (!validRoles.includes(role.toUpperCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid role. Allowed values: ${validRoles.join(", ")}`
                });
            }
            user.role = role.toUpperCase();
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters long"
                });
            }
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                isActive: user.isActive,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (ADMIN)
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        if (req.user && req.user.id === id) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete your own admin account"
            });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user active status
// @route   PATCH /api/users/:id/status
// @access  Private (ADMIN)
const updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        if (isActive === undefined) {
            return res.status(400).json({
                success: false,
                message: "isActive boolean field is required in request body"
            });
        }

        if (req.user && req.user.id === id && !isActive) {
            return res.status(400).json({
                success: false,
                message: "Cannot deactivate your own admin account"
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { isActive: Boolean(isActive) },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus
};
