const express = require("express");
const router = express.Router();
const {
  getPendingDoctors,
  changeDoctorStatus,
  getDoctorsByStatus,
  makeAdmin, 
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");

router.get("/pending-doctors", authMiddleware, getPendingDoctors);
router.post("/change-doctor-status", authMiddleware, changeDoctorStatus);
router.post("/make-admin/:id", authMiddleware, makeAdmin); 
router.get("/doctors", authMiddleware, getDoctorsByStatus); 


module.exports = router;
