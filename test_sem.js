require('dotenv').config();
const mongoose = require('mongoose');
const Semester = require('./server/models/Semester');
const Attendance = require('./server/models/Attendance');
const User = require('./server/models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance').then(async () => {
    const sems = await Semester.find();
    console.log("Semesters:", sems.length);
    for (let sem of sems) {
        console.log("Sem:", sem.sectionName, "Subjects:", sem.subjects);
    }
    const att = await Attendance.find();
    console.log("Att:", att.length);
    if(att.length > 0) {
        console.log("Att 0:", att[0].semesterId, "Records:", att[0].records);
    }
    process.exit();
}).catch(console.error);
