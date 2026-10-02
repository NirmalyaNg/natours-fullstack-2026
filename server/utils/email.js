const nodemailer = require('nodemailer');

module.exports = async function sendEmail(options) {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transport.sendMail({
    from: `Nirmalya Ganguly <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.text,
  });
};
