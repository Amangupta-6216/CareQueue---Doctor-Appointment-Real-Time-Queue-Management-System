const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const QueueEntry = require('../models/QueueEntry');
const queueManager = require('../dsa/QueueManager');
const bcrypt = require('bcryptjs');

// @desc    Create Receptionist Account
// @route   POST /api/admin/receptionists
// @access  Admin
const createReceptionist = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

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
      role: 'receptionist',
      phone: phone || ''
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    });
  } catch (error) {
    console.error('createReceptionist error:', error);
    res.status(500).json({ message: 'Error creating receptionist account' });
  }
};

// @desc    Get System-Wide Summary Reports & Analytics
// @route   GET /api/admin/reports/summary
// @access  Admin
const getSummaryReports = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointmentsToday = await Appointment.countDocuments({ date: todayStr });
    
    const completedAppointmentsToday = await Appointment.countDocuments({
      date: todayStr,
      status: 'done'
    });

    const noShowAppointmentsToday = await Appointment.countDocuments({
      date: todayStr,
      status: 'no-show'
    });

    const inQueueAppointments = await Appointment.countDocuments({
      status: 'in-queue'
    });

    const noShowRate = totalAppointmentsToday > 0 
      ? ((noShowAppointmentsToday / totalAppointmentsToday) * 100).toFixed(1)
      : '0.0';

    // Department wise breakdown
    const doctors = await Doctor.find().populate('user', 'name');
    const departmentStats = {};

    for (const doc of doctors) {
      const dept = doc.department || 'General';
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          department: dept,
          doctorCount: 0,
          totalAppointments: 0,
          waitingInQueue: 0
        };
      }
      departmentStats[dept].doctorCount += 1;
      
      const queueList = queueManager.toSortedList(doc._id);
      departmentStats[dept].waitingInQueue += queueList.length;
    }

    res.json({
      totalPatients,
      totalDoctors,
      totalAppointmentsToday,
      completedAppointmentsToday,
      noShowAppointmentsToday,
      inQueueAppointments,
      noShowRate: `${noShowRate}%`,
      departmentStats: Object.values(departmentStats)
    });
  } catch (error) {
    console.error('getSummaryReports error:', error);
    res.status(500).json({ message: 'Error generating summary reports' });
  }
};

// @desc    List all users with optional role filter
// @route   GET /api/users
// @access  Admin
const getUsersList = async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('getUsersList error:', error);
    res.status(500).json({ message: 'Error fetching users list' });
  }
};

module.exports = {
  createReceptionist,
  getSummaryReports,
  getUsersList
};
