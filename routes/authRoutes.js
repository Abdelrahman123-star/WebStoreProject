const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', authController.showLogin);
router.post('/login', authController.handleLogin);

router.get('/logout', authController.logout);

router.get('/signup', authController.showSignup);
router.post('/signup', authController.handleSignup);

module.exports = router;