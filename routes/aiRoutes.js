const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST /ai-chat
router.post('/ai-chat', (req, res) => aiController.handleChat(req, res));

module.exports = router;