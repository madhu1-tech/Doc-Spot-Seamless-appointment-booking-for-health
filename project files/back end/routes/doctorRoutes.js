const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const multer = require("multer");
const { getDoctorProfile } = require("../controllers/doctorController");
const Doctor = require("../models/DoctorModel");

const {
  applyDoctorController,
  getDoctorAppointments,
  createOrUpdateDoctorProfile,
  updateAppointmentStatus,
  updateDoctorProfile,
  getApprovedDoctors,
  approveDoctorController,
  bookAppointmentController,
  deleteDoctorNotification,
  getDoctorNotifications,
} = require("../controllers/doctorController");

router.post("/apply-doctor", authMiddleware, applyDoctorController);
router.post("/profile", authMiddleware, upload.single("image"), createOrUpdateDoctorProfile);
router.get("/appointments/:doctorId", authMiddleware, getDoctorAppointments);
router.get("/profile", authMiddleware, getDoctorProfile);
router.get("/approved-doctors", getApprovedDoctors);
router.post("/update-profile", authMiddleware, updateDoctorProfile);
router.post("/approve/:doctorId", authMiddleware, approveDoctorController);
router.post("/book-appointment", authMiddleware, bookAppointmentController);
router.post("/update-status", authMiddleware, updateAppointmentStatus);
router.get("/notifications/:doctorId", authMiddleware, getDoctorNotifications);
router.post("/delete-notification", authMiddleware, deleteDoctorNotification);

router.delete("/remove-doctor/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const deletedDoctor = await Doctor.findOneAndDelete({ email });

    if (!deletedDoctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    res.status(200).json({ success: true, message: "Doctor removed successfully" });
  } catch (error) {
    console.error("DELETE doctor error:", error);
    res.status(500).json({ success: false, message: "Error removing doctor", error: error.message });
  }
});

module.exports = router;
