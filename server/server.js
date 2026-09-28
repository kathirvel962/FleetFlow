const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Route Imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const driverRoutes = require("./routes/driverRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const dispatchRoutes = require("./routes/dispatchRoutes");
const driverAppRoutes = require("./routes/driverAppRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
const port = process.env.PORT || 5000;

// Core Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/driver", driverAppRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Base Health Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Fleet Flow API is running",
        version: "1.0.0"
    });
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Connect to Database
connectDB();

// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = app;