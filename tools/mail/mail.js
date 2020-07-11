const nodemailer = require('nodemailer');
const Sentry = require('@sentry/node');

class Mail {
    constructor({username, pass, service}) {
        this.username = username;
        this.pass = pass;
        this.service = service;
        this.transporter = nodemailer.createTransport({
            service: this.service,
            auth: {
              user: this.username,
              pass: this.pass
            }
        });
    }

    sendMail({from, to, subject, text}) {
        const mailOptions = {
            from,
            to,
            subject,
            text
          };
          return new Promise((resolve, reject) => {
              this.transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    Sentry.captureException(error);
                    reject(error);
                  } else {
                    resolve(info);
                  }
              });
          });
    }
}

module.exports = Mail;