const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus
} = require("../controllers/userController");

const router = express.Router();

// All user management routes are restricted to ADMIN
router.use(protect, authorize("ADMIN"));

router.route("/")
    .get(getUsers)
    .post(createUser);

router.route("/:id")
    .get(getUserById)
    .put(updateUser)
    .delete(deleteUser);

router.patch("/:id/status", updateUserStatus);

module.exports = router;
