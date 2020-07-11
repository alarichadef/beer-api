const Mail = require('./mail');

const MailClient = new Mail({username: process.env.MAIL_USERNAME, pass: process.env.MAIL_PASSWORD, service: process.env.MAIL_SERVICE});

module.exports = MailClient;