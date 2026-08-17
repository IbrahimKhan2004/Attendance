const Attendance = require('../models/Attendance');
const User = require('../models/User');

const markAttendance = async (req, res) => {
    const { date, records } = req.body;

    try {
        let attendance = await Attendance.findOne({ userId: req.user._id, date });

        if (attendance) {
            attendance.records = records;
            await attendance.save();
        } else {
            attendance = await Attendance.create({
                userId: req.user._id,
                date,
                records
            });
        }

        res.status(200).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getMyAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find({ userId: req.user._id }).sort({ date: -1 });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteAttendance = async (req, res) => {
    try {
        const { date } = req.params;
        const attendance = await Attendance.findOneAndDelete({ userId: req.user._id, date });

        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        res.json({ message: 'Attendance deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllUsersAttendance = async (req, res) => {
    try {
        const users = await User.find({ role: 'student' }).select('-password');
        const allAttendance = await Attendance.find();

        const result = users.map(user => {
            const userAttendance = allAttendance.filter(a => a.userId.toString() === user._id.toString());
            return {
                user: {
                    _id: user._id,
                    username: user.username,
                    additionalData: user.additionalData
                },
                attendance: userAttendance
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { markAttendance, getMyAttendance, deleteAttendance, getAllUsersAttendance };
