const express = require('express');
const router = express.Router();
const upload = require("../middleware/upload");
const { getUserNotifications } = require("../controllers/userController");

const {
  registerController,
  loginController,
  getUserInfoController,
  authUserController,
  deleteNotification,
  applyDoctorController,
  updateAppointmentStatus
} = require('../controllers/userController');

const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', registerController);
router.post('/login', loginController);

router.post(
  "/apply-doctor",
  authMiddleware,
  upload.single("image"),
  applyDoctorController
);

router.post('/getUserInfo', authMiddleware, getUserInfoController);
router.post("/update-status", authMiddleware, updateAppointmentStatus);
router.get("/notifications/:id", getUserNotifications);
router.delete("/notifications/:userId/:notifId", deleteNotification);
router.get('/auth-user', authMiddleware, authUserController);

const User = require("../models/UserModel");

router.post("/make-admin/:id", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isAdmin: true });
    res.send({ success: true, message: "User promoted to admin" });
  } catch (err) {
    res.status(500).send({ success: false, message: "Failed to update user" });
  }
});

router.get("/all-users", async (req, res) => {
  const users = await require("../models/UserModel").find();
  res.send(users);
});

module.exports = router;
