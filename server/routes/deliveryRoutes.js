const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
    getDeliveries,
    getDeliveryById,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    updateDeliveryStatus,
    submitProofOfDelivery
} = require("../controllers/deliveryController");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(authorize("ADMIN", "DISPATCHER", "DRIVER"), getDeliveries)
    .post(authorize("ADMIN", "DISPATCHER"), createDelivery);

router.patch("/:id/status", authorize("ADMIN", "DISPATCHER", "DRIVER"), updateDeliveryStatus);
router.post("/:id/proof", authorize("ADMIN", "DISPATCHER", "DRIVER"), submitProofOfDelivery);

router.route("/:id")
    .get(authorize("ADMIN", "DISPATCHER", "DRIVER"), getDeliveryById)
    .put(authorize("ADMIN", "DISPATCHER"), updateDelivery)
    .delete(authorize("ADMIN"), deleteDelivery);

module.exports = router;
