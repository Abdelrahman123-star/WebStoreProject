const crypto = require('crypto');
const User = require('../models/User');
const transporter = require('../config/emailConfig');
const { getPasswordResetTemplate } = require('../utils/emailTemplates');

// Generate reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send reset password email
const sendResetPasswordEmail = async (email, resetToken) => {
  try {
    const resetLink = `${process.env.BASE_URL}/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: getPasswordResetTemplate(resetLink)
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending reset password email:', error);
    throw new Error('Failed to send reset password email');
  }
};

// Request password reset
const requestPasswordReset = async (email) => {
  try {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = generateResetToken();
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    await User.updateResetToken(email, resetToken, resetTokenExpiry);
    await sendResetPasswordEmail(email, resetToken);
    return true;
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    throw error;
  }
};

// Reset password
const resetPassword = async (token, newPassword) => {
  try {
    const user = await User.findByResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    await User.updatePassword(user._id, newPassword);
    return true;
  } catch (error) {
    console.error('Error in resetPassword:', error);
    throw error;
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword
}; 