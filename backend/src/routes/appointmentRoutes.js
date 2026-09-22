const express = require('express');
const {
  bookAppointment,
  registerWalkIn,
  checkInAppointment,
  cancelAppointment,
  getMyAppointments,
  rescheduleAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(protect);

router.post('/book', authorize('patient', 'receptionist', 'admin'), bookAppointment);
router.post('/walk-in', authorize('receptionist', 'admin'), registerWalkIn);
router.put('/:id/check-in', authorize('patient', 'receptionist', 'admin'), checkInAppointment);
router.put('/:id/cancel', authorize('patient', 'receptionist', 'admin'), cancelAppointment);
router.put('/:id/reschedule', authorize('patient', 'receptionist', 'admin'), rescheduleAppointment);
router.get('/my', getMyAppointments);

module.exports = router;

