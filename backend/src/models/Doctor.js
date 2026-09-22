const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  startTime: {
    type: String, // Format: HH:mm (e.g. "09:00")
    required: true
  },
  endTime: {
    type: String, // Format: HH:mm (e.g. "09:30")
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  }
});

const leaveRequestSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    specialization: {
      type: String,
      default: ''
    },
    qualification: {
      type: String,
      default: 'MBBS, MD'
    },
    consultationFee: {
      type: Number,
      default: 500
    },
    availableSlots: [slotSchema],
    onLeave: {
      type: Boolean,
      default: false
    },
    leaveRequests: [leaveRequestSchema]
  },
  { timestamps: true }
);

// Compound index for slot lookups
doctorSchema.index({ _id: 1, 'availableSlots.date': 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
