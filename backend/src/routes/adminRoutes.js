const express = require('express');
const { createReceptionist, getSummaryReports } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.post('/receptionists', createReceptionist);
router.get('/reports/summary', getSummaryReports);

module.exports = router;
