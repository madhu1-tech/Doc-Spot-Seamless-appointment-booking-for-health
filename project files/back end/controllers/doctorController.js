const Doctor = require('../models/DoctorModel');
const Appointment = require("../models/AppointmentModel");
const User = require("../models/UserModel");
const mongoose = require("mongoose");

// Apply as a doctor
const applyDoctorController = async (req, res) => {
  try {
    const newDoctor = new Doctor({ ...req.body, status: 'pending' });
    await newDoctor.save();
    res.status(201).send({
      success: true,
      message: 'Doctor account applied successfully',
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Error while applying for doctor',
      error,
    });
  }
};

// Create or update doctor profile
const createOrUpdateDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, specialization, experience, location, fee } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    let doctor = await Doctor.findOne({ userId });

    if (doctor) {
      doctor.name = name;
      doctor.specialization = specialization;
      doctor.experience = experience;
      doctor.location = location;
      doctor.fee = fee;
      if (imagePath) doctor.image = imagePath;
      doctor.status = "approved";
      await doctor.save();
    } else {
      doctor = new Doctor({
        userId,
        name,
        specialization,
        experience,
        location,
        fee,
        image: imagePath,
        status: "approved",
      });
      await doctor.save();
    }

    res.status(201).send({
      success: true,
      message: "Doctor profile created/updated",
      data: doctor,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: "Failed to create/update doctor profile",
    });
  }
};

// Get doctor profile
const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).send({
        success: false,
        message: "Doctor profile not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Doctor profile fetched successfully",
      data: doctor,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: "Server error",
    });
  }
};

// Get all appointments for a doctor
const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      "doctorInfo._id": req.params.doctorId,
    });
    res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch" });
  }
};

// Update appointment status (approve/reject)
const updateAppointmentStatus = async (req, res) => {
  const { appointmentId, status } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    appointment.status = status;
    await appointment.save();

    const doctor = await Doctor.findById(appointment.doctorId);
    if (doctor) {
      if (status === "rejected") {
        doctor.notifications = doctor.notifications.filter(
          (n) => String(n.data.appointmentId) !== String(appointmentId)
        );
      } else {
        const notif = doctor.notifications.find(
          (n) => String(n.data.appointmentId) === String(appointmentId)
        );
        if (notif) notif.isRead = true;
      }
      await doctor.save();
    }

    const patient = await User.findById(appointment.patientId);
    if (patient) {
      const messageText =
        status === "approved"
          ? `Your appointment with Dr. ${doctor.name} is approved. Appointment ID: ${appointment._id}`
          : `Your appointment with Dr. ${doctor.name} was ${status}.`;

      patient.notifications.push({
        type: "appointment-status",
        message: messageText,
        isRead: false,
        data: {
          appointmentId: appointment._id,
          doctorName: doctor.name,
          date: appointment.date,
          time: appointment.time,
          status,
        },
        createdAt: new Date(),
      });

      await patient.save();
    }

    res.status(200).send({ success: true, message: "Appointment status updated" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Something went wrong", error });
  }
};

// Update doctor profile
const updateDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const { name, specialization, experience, location, fee } = req.body;
    if (name) doctor.name = name;
    if (specialization) doctor.specialization = specialization;
    if (experience) doctor.experience = experience;
    if (location) doctor.location = location;
    if (fee) doctor.fee = fee;
    if (req.file) doctor.image = "/uploads/" + req.file.filename;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong", error });
  }
};

// Get only approved doctors
const getApprovedDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "approved" });
    res.status(200).send({
      success: true,
      message: "Fetched approved doctors",
      data: doctors,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error fetching doctors",
      error,
    });
  }
};

// Approve doctor manually (admin use)
const approveDoctorController = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { status: "approved" },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).send({ success: false, message: "Doctor not found" });
    }

    res.status(200).send({
      success: true,
      message: "Doctor profile approved",
      data: doctor,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Something went wrong", error });
  }
};

// Book a new appointment
const bookAppointmentController = async (req, res) => {
  try {
    const {
      doctorId,
      patientId,
      doctorInfo,
      patientInfo,
      date,
      time,
    } = req.body;

    const newAppointment = new Appointment({
      doctorId,
      patientId,
      doctorInfo,
      patientInfo,
      date,
      time,
      status: "pending",
    });

    await newAppointment.save();

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({ success: false, message: "Doctor not found" });
    }

    doctor.notifications.push({
      type: "appointment",
      message: `New appointment request from ${patientInfo.name}`,
      data: {
        appointmentId: newAppointment._id,
        patientName: patientInfo.name,
        date,
        time,
      },
    });

    await doctor.save();

    res.status(201).send({
      success: true,
      message: "Appointment request sent",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: "Error booking appointment",
      err,
    });
  }
};

// Get doctor notifications
const getDoctorNotifications = async (req, res) => {
  try {
    const doctorId = new mongoose.Types.ObjectId(req.params.doctorId);
    const doctor = await Doctor.findOne({ userId: doctorId });

    if (!doctor) {
      return res.status(404).send({ success: false, message: "Doctor not found" });
    }

    const appointmentIds = doctor.notifications.map(n => n.data.appointmentId);
    const appointments = await Appointment.find({ _id: { $in: appointmentIds } });

    const statusMap = {};
    appointments.forEach(app => {
      statusMap[app._id] = app.status;
    });

    const notificationsWithStatus = doctor.notifications.map(n => {
      const notifObj = n.toObject();
      return {
        ...notifObj,
        data: { ...notifObj.data },
        status: statusMap[notifObj.data?.appointmentId] || "pending",
      };
    });

    res.status(200).send({
      success: true,
      message: "Notifications fetched successfully",
      data: notificationsWithStatus,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: "Error fetching notifications",
      error: err.message,
    });
  }
};

// Delete notification from doctors lisr
const deleteDoctorNotification = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).send({ success: false, message: "Doctor not found" });
    }

    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res.status(400).send({ success: false, message: "Appointment ID missing" });
    }

    doctor.notifications = doctor.notifications.filter(
      (n) => n?.data?.appointmentId?.toString() !== appointmentId
    );

    await doctor.save();

    res.status(200).send({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

// Export all controller functions
module.exports = {
  applyDoctorController,
  getDoctorAppointments,
  createOrUpdateDoctorProfile,
  updateAppointmentStatus,
  updateDoctorProfile,
  getApprovedDoctors,
  approveDoctorController,
  bookAppointmentController,
  getDoctorNotifications,
  deleteDoctorNotification,
  getDoctorProfile,
};
