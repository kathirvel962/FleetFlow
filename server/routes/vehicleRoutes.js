const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
    getVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus
} = require("../controllers/vehicleController");

const router = express.Router();

// All vehicle routes require authentication
router.use(protect);

router.route("/")
    .get(getVehicles)
    .post(authorize("ADMIN"), createVehicle);

router.patch("/:id/status", authorize("ADMIN", "DISPATCHER"), updateVehicleStatus);

router.route("/:id")
    .get(getVehicleById)
    .put(authorize("ADMIN"), updateVehicle)
    .delete(authorize("ADMIN"), deleteVehicle);

module.exports = router;
