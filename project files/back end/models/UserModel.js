const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  isdoctor: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }, 
  type: { type: String, enum: ['patient', 'doctor'], required: true },

  notifications: [
    {
      type: { type: String },
      message: String,
      isRead: { type: Boolean, default: false },
      data: Object,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model('User', userSchema);
