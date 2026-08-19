const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
    sectionName: { type: String, required: true },
    startDate: { type: String, required: true }, // Format YYYY-MM-DD
    endedAt: { type: Date, default: null }, // Null when active, timestamp when ended
    status: { type: String, enum: ['active', 'ended'], default: 'active' },

    // Snapshots
    subjects: { type: [String], default: [] },
    timetable: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

// Only one active semester allowed at a time
// Can enforce this logic in the controller rather than a unique index to make it simpler

module.exports = mongoose.model('Semester', semesterSchema);
