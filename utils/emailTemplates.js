const getPasswordResetTemplate = (resetLink) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You have requested to reset your password. Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="background-color: #4CAF50; 
                  color: white; 
                  padding: 12px 24px; 
                  text-decoration: none; 
                  border-radius: 4px;
                  display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
      <p>This link will expire in 1 hour.</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This is an automated message, please do not reply to this email.
      </p>
    </div>
  `;
};

module.exports = {
  getPasswordResetTemplate
}; 