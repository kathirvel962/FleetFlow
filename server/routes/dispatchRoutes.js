const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
    assign,
    getActiveDispatches,
    getDispatchHistory
} = require("../controllers/dispatchController");

const router = express.Router();

// Dispatch endpoints are restricted to ADMIN and DISPATCHER
router.use(protect, authorize("ADMIN", "DISPATCHER"));

router.post("/assign", assign);
router.get("/active", getActiveDispatches);
router.get("/history", getDispatchHistory);

module.exports = router;
