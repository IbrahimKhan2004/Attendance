const Semester = require('../models/Semester');
const GlobalConfig = require('../models/GlobalConfig');
const Attendance = require('../models/Attendance');

const getActiveSemester = async (req, res) => {
    try {
        const activeSemester = await Semester.findOne({ status: 'active' });
        res.json(activeSemester);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getSemesterHistory = async (req, res) => {
    try {
        // Fetch all ended semesters
        let history = await Semester.find({ status: 'ended' }).sort({ endedAt: -1 }).lean();

        if (req.user && req.user.role === 'student') {
            // For students, attach their attendance percentage to each semester
            const allAttendance = await Attendance.find({ userId: req.user._id });

            history = history.map(sem => {
                // Fallback: if semesterId is not present, match by date range if possible
                // but currently we just assume older records might have missing semesterId or missing subjects.
                // We'll filter based on semesterId first.
                let semAttendance = allAttendance.filter(a => a.semesterId && a.semesterId.toString() === sem._id.toString());

                // If semAttendance is empty, try fallback by date if a.semesterId is null
                if (semAttendance.length === 0) {
                    semAttendance = allAttendance.filter(a => {
                        if (a.semesterId) return false;
                        const recordDate = new Date(a.date);
                        const startDate = new Date(sem.startDate);
                        const endDate = new Date(sem.endedAt);
                        return recordDate >= startDate && recordDate <= endDate;
                    });
                }

                let totalPeriods = 0;
                let presentPeriods = 0;
                let matchedByFilter = 0;

                semAttendance.forEach(record => {
                    record.records.forEach(r => {
                        // Only count subjects that were part of this semester's snapshot
                        // Or if subjects snapshot is missing (older data), count all
                        const subjectMatches = !sem.subjects || sem.subjects.length === 0 ||
                            sem.subjects.some(s => s.trim().toLowerCase() === (r.subject || '').trim().toLowerCase());
                        if (subjectMatches) {
                            matchedByFilter++;
                        }
                    });
                });

                // If the subjects snapshot doesn't match any record (e.g. subjects were renamed
                // after the semester ended), fall back to counting all records instead of showing '--'
                const useSubjectFilter = matchedByFilter > 0;

                semAttendance.forEach(record => {
                    record.records.forEach(r => {
                        const subjectMatches = !useSubjectFilter || !sem.subjects || sem.subjects.length === 0 ||
                            sem.subjects.some(s => s.trim().toLowerCase() === (r.subject || '').trim().toLowerCase());
                        if (subjectMatches) {
                            totalPeriods++;
                            if (r.status === 'present') {
                                presentPeriods++;
                            }
                        }
                    });
                });

                let percentage = '--';
                if (totalPeriods > 0) {
                    percentage = Math.round((presentPeriods / totalPeriods) * 100) + '%';
                }

                return { ...sem, percentage };
            });
        }

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const startSemester = async (req, res) => {
    try {
        const { startDate } = req.body;

        // Check if there is already an active semester
        const existingActive = await Semester.findOne({ status: 'active' });
        if (existingActive) {
            return res.status(400).json({ message: 'A semester is already active. Please end it first.' });
        }

        // Fetch current config snapshot
        const config = await GlobalConfig.findOne({ key: 'main_config' });
        const sectionName = config ? config.sectionName : 'Unknown Section';
        const subjects = config ? config.subjects : [];
        const timetable = config ? config.timetable : {};
        const offDays = config ? config.offDays : [];

        const newSemester = await Semester.create({
            sectionName,
            startDate,
            subjects,
            timetable,
            offDays,
            status: 'active'
        });

        res.status(201).json(newSemester);
    } catch (error) {
        console.error('Error starting semester:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const endSemester = async (req, res) => {
    try {
        const activeSemester = await Semester.findOne({ status: 'active' });

        if (!activeSemester) {
            return res.status(400).json({ message: 'No active semester found to end.' });
        }

        activeSemester.status = 'ended';
        activeSemester.endedAt = new Date();
        await activeSemester.save();

        res.json(activeSemester);
    } catch (error) {
        console.error('Error ending semester:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin only routes above for start/end
module.exports = {
    getActiveSemester,
    getSemesterHistory,
    startSemester,
    endSemester
};
