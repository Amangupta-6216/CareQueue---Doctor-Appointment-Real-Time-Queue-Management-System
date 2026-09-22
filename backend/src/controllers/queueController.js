const QueueEntry = require('../models/QueueEntry');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const queueManager = require('../dsa/QueueManager');
const {
  emitQueueUpdate,
  emitPatientStatusChange,
  emitDoctorNextPatient
} = require('../config/socket');

const AVG_CONSULTATION_MINS = 15;

// @desc    Get live sorted queue snapshot for a doctor
// @route   GET /api/queue/:doctorId
// @access  Public (Authenticated/Role-scoped)
const getLiveQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const sortedQueue = queueManager.toSortedList(doctorId);

    // Calculate estimated wait times for each patient in queue
    const queueWithEstimates = sortedQueue.map((item, index) => ({
      ...item,
      position: index + 1,
      estimatedWaitMinutes: index * AVG_CONSULTATION_MINS
    }));

    // Find currently in-progress patient if any
    const inProgressEntry = await QueueEntry.findOne({
      doctorId,
      status: 'in-progress'
    })
      .populate('patientId', 'name phone isSeniorCitizen')
      .populate('appointmentId')
      .lean();

    res.json({
      doctorId,
      count: queueWithEstimates.length,
      inProgressPatient: inProgressEntry || null,
      queue: queueWithEstimates
    });
  } catch (error) {
    console.error('getLiveQueue error:', error);
    res.status(500).json({ message: 'Error fetching live queue' });
  }
};

// @desc    Advance queue / Call next patient for consultation
// @route   PUT /api/queue/:doctorId/next
// @access  Doctor / Admin
const advanceNextPatient = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // 1. Mark existing in-progress patient as 'done'
    const currentInProgress = await QueueEntry.findOne({
      doctorId,
      status: 'in-progress'
    });

    if (currentInProgress) {
      currentInProgress.status = 'done';
      await currentInProgress.save();

      await Appointment.findByIdAndUpdate(currentInProgress.appointmentId, {
        status: 'done'
      });

      emitPatientStatusChange(currentInProgress.patientId, {
        appointmentId: currentInProgress.appointmentId,
        status: 'done'
      });
    }

    // 2. Extract next patient with lowest priorityScore (highest urgency) from MinHeap
    const nextPatientNode = queueManager.getNextPatient(doctorId);

    if (!nextPatientNode) {
      // Queue is now empty
      const updatedQueue = queueManager.toSortedList(doctorId);
      emitQueueUpdate(doctorId, updatedQueue);
      return res.json({
        message: 'Queue is clear. No more waiting patients.',
        nextPatient: null,
        queue: updatedQueue
      });
    }

    // 3. Update status of next patient to 'in-progress'
    await QueueEntry.findByIdAndUpdate(nextPatientNode.queueEntryId, {
      status: 'in-progress'
    });

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      nextPatientNode.appointmentId,
      { status: 'in-progress' },
      { new: true }
    ).populate('patient', 'name email phone isSeniorCitizen');

    // 4. Emit real-time Socket updates
    const updatedQueue = queueManager.toSortedList(doctorId);
    emitQueueUpdate(doctorId, updatedQueue);
    emitDoctorNextPatient(doctorId, {
      appointment: updatedAppointment,
      queueNode: nextPatientNode
    });
    emitPatientStatusChange(nextPatientNode.patientId, {
      appointmentId: nextPatientNode.appointmentId,
      status: 'in-progress'
    });

    res.json({
      message: 'Next patient called successfully',
      nextPatient: updatedAppointment,
      queue: updatedQueue
    });
  } catch (error) {
    console.error('advanceNextPatient error:', error);
    res.status(500).json({ message: 'Error advancing queue to next patient' });
  }
};

// @desc    Mark current or specified patient as No-Show
// @route   PUT /api/queue/:doctorId/no-show/:appointmentId
// @access  Doctor / Receptionist / Admin
const markNoShow = async (req, res) => {
  try {
    const { doctorId, appointmentId } = req.params;

    // Update appointment status
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: 'no-show' },
      { new: true }
    );

    // Update QueueEntry status
    await QueueEntry.findOneAndUpdate(
      { appointmentId },
      { status: 'no-show' }
    );

    // Remove from in-memory MinHeap
    queueManager.removeFromQueue(doctorId, appointmentId);

    // Emit live socket updates
    const updatedQueue = queueManager.toSortedList(doctorId);
    emitQueueUpdate(doctorId, updatedQueue);
    if (appointment) {
      emitPatientStatusChange(appointment.patient, {
        appointmentId,
        status: 'no-show'
      });
    }

    res.json({ message: 'Patient marked as no-show', appointment, queue: updatedQueue });
  } catch (error) {
    console.error('markNoShow error:', error);
    res.status(500).json({ message: 'Error marking patient as no-show' });
  }
};

// @desc    Toggle emergency status on a waiting patient (bumps priority score)
// @route   PUT /api/queue/:doctorId/emergency/:appointmentId
// @access  Receptionist / Admin
const toggleEmergencyBump = async (req, res) => {
  try {
    const { doctorId, appointmentId } = req.params;
    const { isEmergency } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.isEmergency = Boolean(isEmergency);
    await appointment.save();

    const queueEntry = await QueueEntry.findOne({ appointmentId });
    if (queueEntry) {
      queueEntry.isEmergency = Boolean(isEmergency);
      await queueEntry.save();
    }

    // Re-heap doctor queue with updated emergency node
    const heapNode = {
      queueEntryId: queueEntry?._id,
      appointmentId: appointment._id,
      doctorId,
      patientId: appointment.patient,
      isEmergency: Boolean(isEmergency),
      joinedAt: queueEntry ? queueEntry.joinedAt : new Date(),
      status: 'waiting'
    };

    queueManager.removeFromQueue(doctorId, appointmentId);
    queueManager.addToQueue(doctorId, heapNode);

    const updatedQueue = queueManager.toSortedList(doctorId);
    emitQueueUpdate(doctorId, updatedQueue);

    res.json({ message: 'Emergency status updated', queue: updatedQueue });
  } catch (error) {
    console.error('toggleEmergencyBump error:', error);
    res.status(500).json({ message: 'Error updating emergency status' });
  }
};

module.exports = {
  getLiveQueue,
  advanceNextPatient,
  markNoShow,
  toggleEmergencyBump
};
