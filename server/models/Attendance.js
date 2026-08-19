const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', default: null },
    date: { type: String, required: true }, // Format YYYY-MM-DD
    records: [{
        subject: { type: String, required: true },
        status: { type: String, enum: ['present', 'absent', 'proxy'], default: 'present' }
    }]
}, { timestamps: true });

// Ensure unique entry per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
