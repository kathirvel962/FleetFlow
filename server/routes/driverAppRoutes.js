const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
    getDriverDashboard,
    getDriverDeliveries,
    getDriverDeliveryById,
    updateDriverDeliveryStatus,
    submitDriverProof
} = require("../controllers/driverAppController");

const router = express.Router();

// Restricted to DRIVER and ADMIN
router.use(protect, authorize("DRIVER", "ADMIN"));

router.get("/dashboard", getDriverDashboard);
router.get("/deliveries", getDriverDeliveries);
router.get("/deliveries/:id", getDriverDeliveryById);
router.patch("/deliveries/:id/status", updateDriverDeliveryStatus);
router.post("/deliveries/:id/proof", submitDriverProof);

module.exports = router;
