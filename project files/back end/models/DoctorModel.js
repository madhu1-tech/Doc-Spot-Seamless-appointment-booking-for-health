const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      default: "", // ⬅️ not required anymore
    },
    experience: {
      type: String,
      default: "", // ⬅️ not required anymore
    },
    location: {
      type: String,
      default: "", // ⬅️ not required anymore
    },
    fee: {
      type: Number,
      default: 0, // ⬅️ not required anymore
    },
    image: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    notifications: [
      {
        type: {
          type: String,
          enum: ["appointment"],
          default: "appointment",
        },
        message: String,
        data: {
          appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "appointments",
          },
          patientName: String,
          date: String,
          time: String,
        },
        isRead: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
