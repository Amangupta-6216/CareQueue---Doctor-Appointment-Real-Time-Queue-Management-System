const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true
    },
    startTime: {
      type: String, // HH:mm
      required: true
    },
    isEmergency: {
      type: Boolean,
      default: false
    },
    isWalkIn: {
      type: Boolean,
      default: false
    },
    bookedBy: {
      type: String,
      enum: ['self', 'receptionist', 'admin'],
      default: 'self'
    },
    status: {
      type: String,
      enum: ['booked', 'checked-in', 'in-queue', 'in-progress', 'done', 'cancelled', 'no-show'],
      default: 'booked'
    },
    reasonForVisit: {
      type: String,
      default: 'General Checkup'
    }
  },
  { timestamps: true }
);

// Enforce unique compound index to prevent double-booking at DB level
appointmentSchema.index({ doctor: 1, date: 1, slotId: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
