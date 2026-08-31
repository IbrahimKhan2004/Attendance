const express = require('express');
const router = express.Router();
const {
    getActiveSemester,
    getSemesterHistory,
    startSemester,
    endSemester,
    deleteSemester
} = require('../controllers/semesterController');
const { protect, adminOnly } = require('../middleware/auth.js');

router.get('/active', protect, getActiveSemester);
router.get('/history', protect, getSemesterHistory);

// Admin routes
router.post('/start', protect, adminOnly, startSemester);
router.post('/end', protect, adminOnly, endSemester);
router.delete('/:id', protect, adminOnly, deleteSemester);

module.exports = router;
