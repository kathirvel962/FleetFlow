const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
    getAdminDashboard,
    getDispatcherDashboard,
    getDriverDashboardStats,
} = require("../controllers/dashboardController");

const router = express.Router();

router.use(protect);

router.get(
    "/admin",
    authorize("ADMIN"),
    getAdminDashboard
);

router.get(
    "/dispatcher",
    authorize("ADMIN", "DISPATCHER"),
    getDispatcherDashboard
);

router.get(
    "/driver",
    authorize("ADMIN", "DRIVER"),
    getDriverDashboardStats
);

module.exports = router;