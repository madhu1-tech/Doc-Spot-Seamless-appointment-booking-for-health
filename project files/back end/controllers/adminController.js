const Doctor = require("../models/DoctorModel");
const User = require("../models/UserModel");

//Doctors with pending status
const getPendingDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "pending" });
    res.status(200).send({ success: true, data: doctors });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch pending doctors" });
  }
};

// Change status of doctor approved or rejecteddd
const changeDoctorStatus = async (req, res) => {
  try {
    const { doctorId, status } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { status },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).send({
        success: false,
        message: "Doctor not found"
      });
    }

    // Notification to user
    const user = await User.findById(doctor.userId);
    if (user) {
      user.isdoctor = status === "approved";
      user.notifications ||= [];
      user.notifications.push({
        type: "doctor-status-update",
        message: `Your doctor application has been ${status}`,
        isRead: false,
        data: { doctorId: doctor._id, status },
        createdAt: new Date(),
      });
      await user.save();
    }

    return res.status(200).send({
      success: true,
      message: `Doctor ${status} successfully`,
      data: doctor
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Failed to update doctor status"
    });
  }
};

// Get doctors by specific status (pending/approved/rejected)
const getDoctorsByStatus = async (req, res) => {
  try {
    const status = req.query.status;
    const filter = status ? { status } : {};
    const doctors = await Doctor.find(filter);
    res.status(200).send({ success: true, data: doctors });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch doctors" });
  }
};

// Promote a user to admin role 
const makeAdmin = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    user.isAdmin = true;
    await user.save();

    res.status(200).send({ success: true, message: "User promoted to admin", data: user });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to make user admin" });
  }
};

module.exports = {
  getPendingDoctors,
  getDoctorsByStatus,
  changeDoctorStatus,
  makeAdmin,
};
