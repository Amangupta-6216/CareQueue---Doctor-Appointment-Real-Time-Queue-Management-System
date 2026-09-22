const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    priorityScore: {
      type: Number,
      default: 0
    },
    basePosition: {
      type: Number,
      default: 1
    },
    isEmergency: {
      type: Boolean,
      default: false
    },
    isSeniorCitizen: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['waiting', 'in-progress', 'done', 'no-show'],
      default: 'waiting'
    }
  },
  { timestamps: true }
);

queueEntrySchema.index({ doctorId: 1, status: 1 });

module.exports = mongoose.model('QueueEntry', queueEntrySchema);
