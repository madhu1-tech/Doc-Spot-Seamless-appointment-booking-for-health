const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const Doctor = require('../models/DoctorModel');
const Appointment = require("../models/AppointmentModel");

// Helper: Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Register Controller
const registerController = async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).send({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await hashPassword(req.body.password);

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: hashedPassword,
      type: req.body.type,
      isdoctor: req.body.type === "doctor" ? false : undefined,
    });

    await user.save();

    if (req.body.type === "doctor") {
      const doctor = new Doctor({
        userId: user._id,
        name: req.body.name,
        email: req.body.email,
        specialization: req.body.specialization,
        experience: req.body.experience,
        location: req.body.location,
        fee: req.body.fee,
        status: "pending",
      });

      await doctor.save();
    }

    res.status(201).send({
      success: true,
      message: "User registered successfully. Please wait for admin approval.",
      user,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error registering user",
    });
  }
};

// Login Controller
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).send({ message: 'User not found', success: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(200).send({ message: 'Invalid Email or Password', success: false });
    }

    if (user.type === "doctor" && user.isdoctor === false) {
      return res.status(403).send({
        success: false,
        message: "Your doctor application is still pending admin approval.",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).send({
      message: "Login successful",
      success: true,
      token,
      user,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error in Login API",
      success: false,
    });
  }
};

// Get current user info (Auth Check)
const authUserController = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    user.password = undefined;
    res.status(200).send({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Auth error',
    });
  }
};

// Get user details
const getUserInfoController = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).send({ message: 'User not found', success: false });
    }

    user.password = undefined;
    res.status(200).send({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Error in getUserInfo API',
    });
  }
};

// Apply doctor profile (separate endpoint)
const applyDoctorController = async (req, res) => {
  try {
    const { name, specialization, experience, location, fee } = req.body;
    const imagePath = req.file?.filename;

    const newDoctor = new Doctor({
      name,
      specialization,
      experience,
      location,
      fee,
      image: imagePath,
      userId: req.user.id,
      status: "pending",
    });

    await newDoctor.save();

    res.status(201).send({ success: true, message: "Doctor profile created" });
  } catch (err) {
    res.status(500).send({ success: false, message: "Error saving doctor" });
  }
};

// Delete user notification
const deleteNotification = async (req, res) => {
  const { userId, notifId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    user.notifications = user.notifications.filter(
      (n) => n._id.toString() !== notifId
    );
    await user.save();

    res.status(200).send({ success: true, message: "Notification deleted" });
  } catch (err) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

// Update appointment status and notify patient
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId, status } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).send({ message: "Appointment not found" });
    }

    appointment.status = status;
    await appointment.save();

    if (status === "approved") {
      const patient = await User.findById(appointment.patientId);
      patient.notifications.push({
        type: "appointment-approved",
        message: `Your appointment with Dr. ${appointment.doctorInfo.name} has been approved.`,
        isRead: false,
        createdAt: new Date(),
        data: {
          appointmentId: appointment._id,
          doctorName: appointment.doctorInfo.name,
          date: appointment.date,
          time: appointment.time,
        },
      });
      await patient.save();
    }

    res.status(200).send({
      success: true,
      message: "Appointment status updated",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get notifications for a user
const getUserNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).send({
      success: true,
      message: "Fetched notifications",
      data: user.notifications || [],
    });
  } catch (err) {
    res.status(500).send({ success: false, message: "Failed to fetch notifications" });
  }
};

// Export all controllers
module.exports = {
  registerController,
  loginController,
  getUserInfoController,
  authUserController,
  applyDoctorController,
  deleteNotification,
  updateAppointmentStatus,
  getUserNotifications,
};
