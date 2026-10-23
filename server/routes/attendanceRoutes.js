const express = require('express');
const router = express.Router();
const { markAttendance, getMyAttendance, getAttendanceVersion, deleteAttendance, getAllUsersAttendance } = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/')
    .get(protect, getMyAttendance)
    .post(protect, markAttendance);

router.get('/version', protect, getAttendanceVersion);

router.delete('/:date', protect, deleteAttendance);

// Admin route
router.get('/all', protect, adminOnly, getAllUsersAttendance);

module.exports = router;
