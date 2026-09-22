const express = require('express');
const {
  getLiveQueue,
  advanceNextPatient,
  markNoShow,
  toggleEmergencyBump
} = require('../controllers/queueController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.get('/:doctorId', getLiveQueue);

router.use(protect);

router.put('/:doctorId/next', authorize('doctor', 'admin'), advanceNextPatient);
router.put('/:doctorId/no-show/:appointmentId', authorize('doctor', 'receptionist', 'admin'), markNoShow);
router.put('/:doctorId/emergency/:appointmentId', authorize('receptionist', 'admin'), toggleEmergencyBump);

module.exports = router;
