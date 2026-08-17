const express = require('express');
const router = express.Router();
const { login, createUser, getUsers, deleteUser } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/login', login);
router.post('/users', protect, adminOnly, createUser);
router.get('/users', protect, adminOnly, getUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = router;
