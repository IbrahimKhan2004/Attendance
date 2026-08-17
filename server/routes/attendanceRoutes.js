const express = require('express');
const router = express.Router();
const { markAttendance, getMyAttendance, deleteAttendance, getAllUsersAttendance } = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/')
    .get(protect, getMyAttendance)
    .post(protect, markAttendance);

router.delete('/:date', protect, deleteAttendance);

// Admin route
router.get('/all', protect, adminOnly, getAllUsersAttendance);

module.exports = router;
