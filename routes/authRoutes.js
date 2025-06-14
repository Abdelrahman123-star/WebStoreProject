const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requestPasswordReset, resetPassword } = require('../services/passwordResetService');

router.get('/login', authController.showLogin);
router.post('/login', authController.handleLogin);

router.get('/logout', authController.logout);

router.get('/signup', authController.showSignup);
router.post('/signup', authController.handleSignup);

// Password reset routes
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', { 
    error: null,
    success: null 
  });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    await requestPasswordReset(email);
    res.render('auth/forgot-password', { 
      error: null,
      success: 'Password reset link has been sent to your email'
    });
  } catch (error) {
    res.render('auth/forgot-password', { 
      error: error.message,
      success: null
    });
  }
});

router.get('/reset-password/:token', (req, res) => {
  res.render('auth/reset-password', { 
    token: req.params.token,
    error: null
  });
});

router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    await resetPassword(token, newPassword);
    res.redirect('/login?message=Password has been reset successfully');
  } catch (error) {
    res.render('auth/reset-password', {
      token: req.params.token,
      error: error.message
    });
  }
});

module.exports = router;