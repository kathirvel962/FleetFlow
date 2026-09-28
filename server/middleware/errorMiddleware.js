// 404 Not Found Middleware
const notFound = (req, res, next) => {
    const error = new Error(`Resource not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Central Error Handler Middleware
const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || "Internal Server Error";
    let errors = undefined;

    // Handle Mongoose Bad ObjectId (CastError)
    if (err.name === "CastError" && err.kind === "ObjectId") {
        statusCode = 400;
        message = `Resource not found with invalid ID: ${err.value}`;
    }

    // Handle Mongoose Validation Error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = "Validation failed";
        errors = Object.values(err.errors).map((val) => ({
            field: val.path,
            message: val.message
        }));
    }

    // Handle Mongoose Duplicate Key Error (Code 11000)
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || "field";
        const value = err.keyValue ? err.keyValue[field] : "";
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    }

    // Handle JWT Errors
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Not authorized, invalid token";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Not authorized, token expired";
    }

    const response = {
        success: false,
        message
    };

    if (errors) {
        response.errors = errors;
    }

    if (process.env.NODE_ENV === "development" && err.stack) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = {
    notFound,
    errorHandler
};
