const nodemailer = require('nodemailer');

// Create test transport or console logger fallback
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    console.log('\n---------------- 📧 MOCK EMAIL SENT ----------------');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || html}`);
    console.log('---------------------------------------------------\n');
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error.message);
    return false;
  }
};

module.exports = { sendEmail };
