const express = require('express');
const router = express.Router();
const { getConfig, updateConfig } = require('../controllers/configController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getConfig);
router.put('/', protect, adminOnly, updateConfig);

module.exports = router;
