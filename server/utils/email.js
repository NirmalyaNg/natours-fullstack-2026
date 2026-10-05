const path = require('node:path');
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.firstName = user.name.split(' ')[0];
    this.to = user.email;
    this.from = `Nirmalya Ganguly <${process.env.EMAIL_FROM}>`;
    this.url = url;
  }

  createNewTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'gmail', // Use gmail directly since brevo doesn't allow free email service providers
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
    } else {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
  }

  async send(templateName, subject) {
    const html = pug.renderFile(path.join(__dirname, `../templates/email/${templateName}.pug`), {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    const text = htmlToText.convert(html, { wordwrap: 130 });

    const emailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html,
      text,
    };

    return await this.createNewTransport().sendMail(emailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', "Welcome to the Natours' family!");
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset link (valid for 10 minutes)');
  }
};
