const express = require('express');
const {
  getDoctors,
  getDoctorById,
  getDoctorSlots,
  createDoctor,
  updateDoctorAvailability,
  requestLeave,
  updateLeaveRequestStatus,
  deleteDoctor
} = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/slots', getDoctorSlots);

router.post('/', protect, authorize('admin'), createDoctor);
router.put('/:id/availability', protect, authorize('admin', 'doctor'), updateDoctorAvailability);
router.post('/:id/leave-request', protect, authorize('doctor'), requestLeave);
router.put('/:doctorId/leave-request/:requestId', protect, authorize('admin'), updateLeaveRequestStatus);
router.delete('/:id', protect, authorize('admin'), deleteDoctor);

module.exports = router;

