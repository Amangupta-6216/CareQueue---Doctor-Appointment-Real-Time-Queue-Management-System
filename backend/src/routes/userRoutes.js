const express = require('express');
const { getUsersList } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'receptionist'));

router.get('/', getUsersList);

module.exports = router;
