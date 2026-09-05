const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config();

// Auto-generate a JWT secret if not provided in environment
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
    console.log('JWT_SECRET auto-generated');
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files securely
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const configRoutes = require('./routes/configRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const semesterRoutes = require('./routes/semesterRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/semester', semesterRoutes);

// Connect to MongoDB (with retry/backoff so transient Atlas/network timeouts don't kill the server)
async function connectWithRetry(retries = 10, delayMs = 5000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('Connected to MongoDB');

            // Seed Admin User
            const User = require('./models/User');
            const adminUser = await User.findOne({ username: process.env.ADMIN_USERNAME });
            if (!adminUser && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
                await User.create({
                    username: process.env.ADMIN_USERNAME,
                    password: process.env.ADMIN_PASSWORD,
                    role: 'admin'
                });
                console.log('Admin user seeded');
            }
            return;
        } catch (err) {
            console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, err.message);
            if (attempt === retries) {
                console.error('All MongoDB connection attempts failed. Server will keep running but DB features will be unavailable until it reconnects.');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
    connectWithRetry();
});

connectWithRetry();

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
