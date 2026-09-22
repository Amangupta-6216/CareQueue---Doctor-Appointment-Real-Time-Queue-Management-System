const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const QueueEntry = require('../models/QueueEntry');
const queueManager = require('../dsa/QueueManager');
const { emitQueueUpdate, emitPatientStatusChange } = require('../config/socket');
const { sendEmail } = require('../utils/mailer');
const bcrypt = require('bcryptjs');

// @desc    Book an appointment slot (Atomic Double-Booking Guard)
// @route   POST /api/appointments/book
// @access  Patient / Receptionist / Admin
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, slotId, date, startTime, reasonForVisit, patientId } = req.body;

    let targetPatientId = req.user._id;
    let bookedBy = 'self';

    if (['receptionist', 'admin'].includes(req.user.role) && patientId) {
      targetPatientId = patientId;
      bookedBy = req.user.role;
    }

    const patientUser = await User.findById(targetPatientId);
    if (!patientUser) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if doctor is on approved leave for this date
    const targetDoctor = await Doctor.findById(doctorId).populate('user', 'name');
    if (!targetDoctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const isDoctorOnLeaveOnDate = targetDoctor.onLeave || (targetDoctor.leaveRequests || []).some(lr => lr.date === date && lr.status === 'approved');
    if (isDoctorOnLeaveOnDate) {
      return res.status(400).json({
        message: `Dr. ${targetDoctor.user?.name || 'Doctor'} is on approved leave on ${date}. Bookings are closed for this date.`
      });
    }

    // Check if slot time has already passed for today
    const todayStr = new Date().toISOString().split('T')[0];
    if (date === todayStr && startTime) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [hStr, mStr] = startTime.split(':');
      const slotMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
      if (slotMinutes <= currentMinutes) {
        return res.status(400).json({
          message: 'This time slot has already passed for today. Please select an upcoming slot.'
        });
      }
    }

    
    // 1. ATOMIC DOUBLE-BOOKING GUARD
    const updatedDoctor = await Doctor.findOneAndUpdate(
      {
        _id: doctorId,
        'availableSlots._id': slotId,
        'availableSlots.isBooked': false
      },
      {
        $set: { 'availableSlots.$.isBooked': true }
      },
      { new: true }
    );


    if (!updatedDoctor) {
      return res.status(409).json({
        message: 'This time slot is no longer available. Please select another slot.'
      });
    }

    // 2. CREATE APPOINTMENT
    const appointment = await Appointment.create({
      patient: targetPatientId,
      doctor: doctorId,
      slotId,
      date,
      startTime,
      isEmergency: false,
      isWalkIn: false,
      bookedBy,
      status: 'booked',
      reasonForVisit: reasonForVisit || 'General Consultation'
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('patient', 'name email phone isSeniorCitizen');

    // Send confirmation email asynchronously
    sendEmail({
      to: patientUser.email,
      subject: 'Appointment Booking Confirmation',
      text: `Hello ${patientUser.name},\n\nYour appointment with Dr. ${populatedAppointment.doctor?.user?.name || 'Doctor'} on ${date} at ${startTime} has been successfully booked.\n\nThank you!`
    });

    // Broadcast live slot update to all connected clients
    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      if (io) {
        io.emit('slot:update', { doctorId, slotId, date });
      }
    } catch (e) {
      // Ignore socket emit error if socket not initialized
    }

    res.status(201).json(populatedAppointment);
  } catch (error) {
    console.error('bookAppointment error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This time slot is no longer available. Please select another slot.' });
    }
    res.status(500).json({ message: 'Server error booking appointment' });
  }
};


// @desc    Register a Walk-In patient & immediately place into priority queue
// @route   POST /api/appointments/walk-in
// @access  Receptionist / Admin
const registerWalkIn = async (req, res) => {
  try {
    const {
      patientName,
      patientEmail,
      patientPhone,
      isSeniorCitizen,
      doctorId,
      isEmergency,
      reasonForVisit
    } = req.body;

    const doctor = await Doctor.findById(doctorId).populate('user', 'name');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Find or create patient user record
    let patientUser;
    const emailToUse = patientEmail ? patientEmail.toLowerCase() : `walkin_${Date.now()}@hospital.internal`;
    
    patientUser = await User.findOne({ email: emailToUse });
    if (!patientUser) {
      const randomPassword = await bcrypt.hash(`walkin_${Date.now()}`, 10);
      patientUser = await User.create({
        name: patientName,
        email: emailToUse,
        password: randomPassword,
        role: 'patient',
        phone: patientPhone || '',
        isSeniorCitizen: Boolean(isSeniorCitizen)
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toTimeString().slice(0, 5);

    // Create walk-in appointment record
    const appointment = await Appointment.create({
      patient: patientUser._id,
      doctor: doctorId,
      slotId: doctor.availableSlots[0]?._id || doctor._id,
      date: todayStr,
      startTime: nowTimeStr,
      isEmergency: Boolean(isEmergency),
      isWalkIn: true,
      bookedBy: req.user.role,
      status: 'in-queue',
      reasonForVisit: reasonForVisit || 'Walk-In Consultation'
    });

    // Create DB QueueEntry
    const currentQueue = queueManager.toSortedList(doctorId);
    const basePosition = currentQueue.length + 1;

    const queueEntry = await QueueEntry.create({
      appointmentId: appointment._id,
      doctorId,
      patientId: patientUser._id,
      basePosition,
      isEmergency: Boolean(isEmergency),
      isSeniorCitizen: Boolean(patientUser.isSeniorCitizen),
      joinedAt: new Date(),
      status: 'waiting'
    });

    // Add to in-memory MinHeap
    const heapNode = {
      queueEntryId: queueEntry._id,
      appointmentId: appointment._id,
      doctorId,
      patientId: patientUser._id,
      patientName: patientUser.name,
      patientPhone: patientUser.phone,
      isEmergency: Boolean(isEmergency),
      isSeniorCitizen: Boolean(patientUser.isSeniorCitizen),
      joinedAt: queueEntry.joinedAt,
      basePosition,
      status: 'waiting'
    };

    queueManager.addToQueue(doctorId, heapNode);

    // Emit live real-time Socket.io update
    const updatedQueueList = queueManager.toSortedList(doctorId);
    emitQueueUpdate(doctorId, updatedQueueList);

    res.status(201).json({
      message: 'Walk-in patient registered and added to doctor queue',
      appointment,
      queueEntry,
      queuePosition: queueManager.getPatientPosition(doctorId, appointment._id)
    });
  } catch (error) {
    console.error('registerWalkIn error:', error);
    res.status(500).json({ message: 'Server error registering walk-in patient' });
  }
};

// @desc    Check-in booked patient on arrival -> places in doctor's min-heap
// @route   PUT /api/appointments/:id/check-in
// @access  Receptionist / Admin / Patient
const checkInAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient')
      .populate('doctor');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status === 'in-queue' || appointment.status === 'in-progress' || appointment.status === 'done') {
      return res.status(400).json({ message: `Appointment is already ${appointment.status}` });
    }

    const { isEmergency } = req.body;
    if (isEmergency !== undefined) {
      appointment.isEmergency = Boolean(isEmergency);
    }

    appointment.status = 'in-queue';
    await appointment.save();

    const doctorId = appointment.doctor._id;
    const patientUser = appointment.patient;

    const currentQueue = queueManager.toSortedList(doctorId);
    const basePosition = currentQueue.length + 1;

    // Check if QueueEntry exists, or create new one
    let queueEntry = await QueueEntry.findOne({ appointmentId: appointment._id });
    if (!queueEntry) {
      queueEntry = await QueueEntry.create({
        appointmentId: appointment._id,
        doctorId,
        patientId: patientUser._id,
        basePosition,
        isEmergency: appointment.isEmergency,
        isSeniorCitizen: patientUser.isSeniorCitizen,
        joinedAt: new Date(),
        status: 'waiting'
      });
    } else {
      queueEntry.status = 'waiting';
      queueEntry.joinedAt = new Date();
      queueEntry.isEmergency = appointment.isEmergency;
      await queueEntry.save();
    }

    // Add node to in-memory MinHeap
    const heapNode = {
      queueEntryId: queueEntry._id,
      appointmentId: appointment._id,
      doctorId,
      patientId: patientUser._id,
      patientName: patientUser.name,
      patientPhone: patientUser.phone,
      isEmergency: appointment.isEmergency,
      isSeniorCitizen: Boolean(patientUser.isSeniorCitizen),
      joinedAt: queueEntry.joinedAt,
      basePosition,
      status: 'waiting'
    };

    queueManager.addToQueue(doctorId, heapNode);

    // Emit socket updates
    const updatedQueue = queueManager.toSortedList(doctorId);
    emitQueueUpdate(doctorId, updatedQueue);
    emitPatientStatusChange(patientUser._id, {
      appointmentId: appointment._id,
      status: 'in-queue',
      queuePosition: queueManager.getPatientPosition(doctorId, appointment._id)
    });

    res.json({
      message: 'Patient checked-in successfully and added to live queue',
      appointment,
      queuePosition: queueManager.getPatientPosition(doctorId, appointment._id)
    });
  } catch (error) {
    console.error('checkInAppointment error:', error);
    res.status(500).json({ message: 'Server error checking in appointment' });
  }
};

// @desc    Cancel appointment & free up doctor slot
// @route   PUT /api/appointments/:id/cancel
// @access  Patient / Receptionist / Admin
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check ownership if patient
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Free up doctor slot
    await Doctor.updateOne(
      { _id: appointment.doctor, 'availableSlots._id': appointment.slotId },
      { $set: { 'availableSlots.$.isBooked': false } }
    );

    // Remove from DB QueueEntry and MinHeap
    await QueueEntry.updateOne(
      { appointmentId: appointment._id },
      { status: 'done' }
    );
    queueManager.removeFromQueue(appointment.doctor, appointment._id);

    // Emit live socket updates
    const updatedQueue = queueManager.toSortedList(appointment.doctor);
    emitQueueUpdate(appointment.doctor, updatedQueue);

    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      if (io) {
        io.emit('slot:update', { doctorId: appointment.doctor, slotId: appointment.slotId, date: appointment.date });
      }
    } catch (e) {}

    res.json({ message: 'Appointment cancelled and slot freed', appointment });

  } catch (error) {
    console.error('cancelAppointment error:', error);
    res.status(500).json({ message: 'Server error cancelling appointment' });
  }
};

// @desc    Get user's appointments (Patient) or doctor's appointments
// @route   GET /api/appointments/my
// @access  Private
const getMyAppointments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (doctor) query.doctor = doctor._id;
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('patient', 'name email phone isSeniorCitizen')
      .sort({ createdAt: -1 })
      .lean();

    // Attach queue position for appointments currently in queue
    const result = appointments.map(apt => {
      let position = null;
      if (apt.status === 'in-queue' && apt.doctor?._id) {
        position = queueManager.getPatientPosition(apt.doctor._id, apt._id);
      }
      return { ...apt, queuePosition: position };
    });

    res.json(result);
  } catch (error) {
    console.error('getMyAppointments error:', error);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
};

// @desc    Reschedule an appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Patient / Receptionist / Admin
const rescheduleAppointment = async (req, res) => {
  try {
    const { newSlotId, newDate, newStartTime } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reschedule this appointment' });
    }

    const doctorDoc = await Doctor.findById(appointment.doctor);
    if (!doctorDoc) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const isApprovedLeave = (doctorDoc.leaveRequests || []).some(lr => lr.date === newDate && lr.status === 'approved');
    if (doctorDoc.onLeave || isApprovedLeave) {
      return res.status(400).json({ message: 'Doctor is on approved leave on requested reschedule date.' });
    }

    // 1. Atomically lock new slot
    const updatedDoctor = await Doctor.findOneAndUpdate(
      {
        _id: appointment.doctor,
        'availableSlots._id': newSlotId,
        'availableSlots.isBooked': false
      },
      {
        $set: { 'availableSlots.$.isBooked': true }
      },
      { new: true }
    );

    if (!updatedDoctor) {
      return res.status(409).json({ message: 'New slot is no longer available. Please select another slot.' });
    }

    // 2. Free old slot
    await Doctor.updateOne(
      { _id: appointment.doctor, 'availableSlots._id': appointment.slotId },
      { $set: { 'availableSlots.$.isBooked': false } }
    );

    // 3. Remove from queue if previously checked in
    if (appointment.status === 'in-queue') {
      queueManager.removeFromQueue(appointment.doctor, appointment._id);
      await QueueEntry.updateOne({ appointmentId: appointment._id }, { status: 'done' });
      const updatedQueue = queueManager.toSortedList(appointment.doctor);
      emitQueueUpdate(appointment.doctor, updatedQueue);
    }

    // 4. Update appointment
    appointment.slotId = newSlotId;
    appointment.date = newDate;
    appointment.startTime = newStartTime;
    appointment.status = 'booked';
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .populate('patient', 'name email phone isSeniorCitizen');

    res.json({ message: 'Appointment rescheduled successfully!', appointment: populatedAppointment });
  } catch (error) {
    console.error('rescheduleAppointment error:', error);
    res.status(500).json({ message: 'Server error rescheduling appointment' });
  }
};

module.exports = {
  bookAppointment,
  registerWalkIn,
  checkInAppointment,
  cancelAppointment,
  getMyAppointments,
  rescheduleAppointment
};

