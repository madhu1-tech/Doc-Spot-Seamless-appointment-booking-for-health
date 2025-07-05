const express = require("express");
const router = express.Router();
const Appointment = require("../models/AppointmentModel");
const authMiddleware = require("../middleware/authMiddleware");
const {
  bookAppointmentController,
} = require("../controllers/doctorController");

// Kotha appointment ni database lo save chesa
router.post("/book", authMiddleware, async (req, res) => {
  try {
    const newAppt = new Appointment(req.body);
    await newAppt.save();
    res.status(201).send({ success: true, message: "Appointment requested" });
  } catch (err) {
    res.status(500).send({ success: false, message: "Error booking", err });
  }
});

// Get appointments for logged-in doctor
router.get("/doctor-appointments", authMiddleware, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const appts = await Appointment.find({ doctorId });
    res.status(200).send({ success: true, data: appts });
  } catch (err) {
    res.status(500).send({ success: false, message: "Error fetching appointments" });
  }
});


// Doctor appointment ni approve/reject chestham
router.put("/update-status/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const appt = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.status(200).send({ success: true, message: `Appointment ${status}`, data: appt });
  } catch (err) {
    res.status(500).send({ success: false, message: "Status update failed" });
  }
});



module.exports = router;
