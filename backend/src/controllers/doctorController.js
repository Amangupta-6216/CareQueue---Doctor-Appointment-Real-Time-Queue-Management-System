const Doctor = require('../models/Doctor');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all doctors (optional department filter)
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
  try {
    const { department, search } = req.query;
    let query = {};

    if (department && department !== 'All') {
      query.department = department;
    }

    let doctors = await Doctor.find(query)
      .populate('user', 'name email phone')
      .lean();

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      doctors = doctors.filter(
        d => searchRegex.test(d.user?.name) || searchRegex.test(d.department) || searchRegex.test(d.specialization)
      );
    }

    res.json(doctors);
  } catch (error) {
    console.error('getDoctors error:', error);
    res.status(500).json({ message: 'Error fetching doctors list' });
  }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'name email phone')
      .lean();

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error('getDoctorById error:', error);
    res.status(500).json({ message: 'Error fetching doctor details' });
  }
};

// @desc    Get doctor slots by ID & date
// @route   GET /api/doctors/:id/slots
// @access  Public
const getDoctorSlots = async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const approvedLeaveDates = (doctor.leaveRequests || [])
      .filter(lr => lr.status === 'approved')
      .map(lr => lr.date);

    const isRequestedDateLeave = date ? approvedLeaveDates.includes(date) : false;

    if (doctor.onLeave || isRequestedDateLeave) {
      return res.json({
        onLeave: true,
        leaveDates: approvedLeaveDates,
        slots: [],
        message: 'Doctor is on approved leave'
      });
    }

    let slots = doctor.availableSlots.filter(s => !approvedLeaveDates.includes(s.date));

    if (date) {
      slots = slots.filter(s => s.date === date);

      // Auto-generate default 30-min consultation slots for future dates if none exist yet
      const todayStr = new Date().toISOString().split('T')[0];
      if (slots.length === 0 && date >= todayStr) {
        const generatedSlots = [];
        const startHours = [9, 10, 11, 14, 15, 16];
        for (const hour of startHours) {
          generatedSlots.push({
            date,
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${hour.toString().padStart(2, '0')}:30`,
            isBooked: false
          });
          generatedSlots.push({
            date,
            startTime: `${hour.toString().padStart(2, '0')}:30`,
            endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
            isBooked: false
          });
        }

        doctor.availableSlots.push(...generatedSlots);
        await doctor.save();

        slots = doctor.availableSlots.filter(s => s.date === date && !approvedLeaveDates.includes(s.date));
      }
    }

    res.json({ onLeave: false, leaveDates: approvedLeaveDates, slots });
  } catch (error) {
    console.error('getDoctorSlots error:', error);
    res.status(500).json({ message: 'Error fetching doctor slots' });
  }
};



// @desc    Create new Doctor (Admin only)
// @route   POST /api/doctors
// @access  Admin
const createDoctor = async (req, res) => {
  try {
    const { name, email, password, phone, department, specialization, qualification, consultationFee } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'doctor',
      phone: phone || ''
    });

    // Default slots generation for today & tomorrow (09:00 to 17:00, 30 min slots)
    const availableSlots = [];
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + dayOffset);
      const dateStr = d.toISOString().split('T')[0];

      const startHours = [9, 10, 11, 14, 15, 16];
      for (const hour of startHours) {
        availableSlots.push({
          date: dateStr,
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${hour.toString().padStart(2, '0')}:30`,
          isBooked: false
        });
        availableSlots.push({
          date: dateStr,
          startTime: `${hour.toString().padStart(2, '0')}:30`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          isBooked: false
        });
      }
    }

    const doctor = await Doctor.create({
      user: user._id,
      department,
      specialization: specialization || department,
      qualification: qualification || 'MBBS, MD',
      consultationFee: consultationFee || 500,
      availableSlots
    });

    const populatedDoc = await Doctor.findById(doctor._id).populate('user', 'name email phone');
    res.status(201).json(populatedDoc);
  } catch (error) {
    console.error('createDoctor error:', error);
    res.status(500).json({ message: 'Error creating doctor profile' });
  }
};

// @desc    Update doctor slots or leave status
// @route   PUT /api/doctors/:id/availability
// @access  Admin or Doctor
const updateDoctorAvailability = async (req, res) => {
  try {
    const { onLeave, slotsToAdd } = req.body;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (onLeave !== undefined) {
      doctor.onLeave = Boolean(onLeave);
    }

    if (slotsToAdd && Array.isArray(slotsToAdd)) {
      doctor.availableSlots.push(...slotsToAdd);
    }

    await doctor.save();
    res.json(doctor);
  } catch (error) {
    console.error('updateDoctorAvailability error:', error);
    res.status(500).json({ message: 'Error updating doctor availability' });
  }
};

// @desc    Request leave (Doctor)
// @route   POST /api/doctors/:id/leave-request
// @access  Doctor
const requestLeave = async (req, res) => {
  try {
    const { date, reason } = req.body;
    let doctor = await Doctor.findOne({ user: req.user._id });

    if (!doctor) {
      doctor = await Doctor.findById(req.params.id);
    }

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor record not found' });
    }

    doctor.leaveRequests.push({ date, reason, status: 'pending' });
    await doctor.save();

    const updatedDoctor = await Doctor.findById(doctor._id).populate('user', 'name email phone');

    res.json({
      message: 'Leave request submitted successfully',
      doctor: updatedDoctor,
      leaveRequests: updatedDoctor.leaveRequests
    });
  } catch (error) {
    console.error('requestLeave error:', error);
    res.status(500).json({ message: 'Error submitting leave request' });
  }
};

// @desc    Approve or Reject a Doctor Leave Request (Admin only)
// @route   PUT /api/doctors/:doctorId/leave-request/:requestId
// @access  Admin
const updateLeaveRequestStatus = async (req, res) => {
  try {
    const { doctorId, requestId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const doctor = await Doctor.findById(doctorId).populate('user', 'name email');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const leaveReq = doctor.leaveRequests.id(requestId);
    if (!leaveReq) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leaveReq.status = status;

    if (status === 'approved') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (leaveReq.date === todayStr) {
        doctor.onLeave = true;
      }
    }

    await doctor.save();

    const updatedDoctor = await Doctor.findById(doctorId).populate('user', 'name email phone');

    res.json({
      message: `Leave request ${status} successfully`,
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('updateLeaveRequestStatus error:', error);
    res.status(500).json({ message: 'Error updating leave request status' });
  }
};

// @desc    Delete doctor (Admin only)
// @route   DELETE /api/doctors/:id
// @access  Admin
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    await User.findByIdAndDelete(doctor.user);
    await Doctor.findByIdAndDelete(req.params.id);

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('deleteDoctor error:', error);
    res.status(500).json({ message: 'Error deleting doctor' });
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  getDoctorSlots,
  createDoctor,
  updateDoctorAvailability,
  requestLeave,
  updateLeaveRequestStatus,
  deleteDoctor
};

