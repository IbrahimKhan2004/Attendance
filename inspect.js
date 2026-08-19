require('dotenv').config();
const mongoose = require('mongoose');
const Semester = require('./server/models/Semester');
const Attendance = require('./server/models/Attendance');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance').then(async () => {
    const sems = await Semester.find();
    console.log("Semesters:", JSON.stringify(sems, null, 2));

    const att = await Attendance.find();
    console.log("Attendance count:", att.length);
    if(att.length > 0) {
        console.log("Sample attendance:", JSON.stringify(att[0], null, 2));
    }

    process.exit();
}).catch(console.error);
