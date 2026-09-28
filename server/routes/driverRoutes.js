const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
    getDrivers,
    getDriverById,
    createDriver,
    updateDriver,
    updateDriverStatus,
    updateDriverVehicle
} = require("../controllers/driverController");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(authorize("ADMIN", "DISPATCHER", "DRIVER"), getDrivers)
    .post(authorize("ADMIN"), createDriver);

router.patch("/:id/status", authorize("ADMIN", "DISPATCHER", "DRIVER"), updateDriverStatus);
router.patch("/:id/vehicle", authorize("ADMIN", "DISPATCHER"), updateDriverVehicle);

router.route("/:id")
    .get(authorize("ADMIN", "DISPATCHER", "DRIVER"), getDriverById)
    .put(authorize("ADMIN", "DISPATCHER", "DRIVER"), updateDriver);

module.exports = router;
