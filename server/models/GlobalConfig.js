const mongoose = require('mongoose');

const globalConfigSchema = new mongoose.Schema({
    // Store as single document to hold global configuration
    key: { type: String, default: 'main_config', unique: true },

    // College/Section info
    collegeName: { type: String, default: 'School of Management Sciences' },
    location: { type: String, default: 'Varanasi' },
    sectionName: { type: String, default: 'BCA-II Section C' },
    year: { type: String, default: '2026' },

    // Off days (e.g. [1] for Monday OFF)
    offDays: { type: [Number], default: [1] },

    // Timetable schema
    timetable: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Syllabus schema
    syllabus: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Holidays schema
    holidays: [{
        name: String,
        date: String,
        day: String
    }],

    // Subject List
    subjects: { type: [String], default: ['OS', 'PCS', 'PP', 'DECO', 'MM', 'LAB'] },

    // Periods config
    periods: { type: mongoose.Schema.Types.Mixed, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('GlobalConfig', globalConfigSchema);
