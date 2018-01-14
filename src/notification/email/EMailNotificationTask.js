const Configuration = require('../../utils/Configuration');
const Logging = require('../../utils/Logging');
const Utils = require('../../utils/Utils');
const nodemailer = require('nodemailer');
const path = require('path');
const email = require("emailjs");
const ejs = require('ejs');
const resetPasswordTemplate = require('./template/reset-password.js');
const newRegisteredUserTemplate = require('./template/new-registered-user.js');
const userAccountStatusChanged = require('./template/user-account-status-changed.js');
const endOfChargeTemplate = require('./template/end-of-charge.js');
const beforeEndOfChargeTemplate = require('./template/before-end-of-charge.js');
const chargingStationStatusError = require('./template/charging-station-status-error.js');
const transactionStarted = require('./template/transaction-started');
const unknownUserBadged = require('./template/unknown-user-badged');
const NotificationTask = require('../NotificationTask');

require('source-map-support').install();

// Email
_emailConfig = Configuration.getEmailConfig();

// https://nodemailer.com/smtp/
class EMailNotificationTask extends NotificationTask {
	constructor() {
		super();
		// Connect to the server
		this.server = email.server.connect({
			user: _emailConfig.smtp.user,
			password: _emailConfig.smtp.password,
			host: _emailConfig.smtp.host,
			port: _emailConfig.smtp.port,
			tls: _emailConfig.smtp.requireTLS,
			ssl: _emailConfig.smtp.secure
		});
	}

	sendNewRegisteredUser(data, locale) {
		// Create a promise
		return new Promise((fulfill, reject) => {
			// Send it
			this._prepareAndSendEmail('new-registered-user', data, locale, fulfill, reject);
		});
	}

	sendResetPassword(data, locale) {
		// Create a promise
		return new Promise((fulfill, reject) => {
			// Send it
			this._prepareAndSendEmail('reset-password', data, locale, fulfill, reject);
		});
	}

	sendBeforeEndOfCharge(data, locale) {
		// Create a promise
		return new Promise((fulfill, reject) => {
			// Send it
			this._prepareAndSendEmail('before-end-of-charge', data, locale, fulfill, reject);
		});
	}

	sendEndOfCharge(data, locale) {
		// Create a promise
		return new Promise((fulfill, reject) => {
			// Send it
			this._prepareAndSendEmail('end-of-charge', data, locale, fulfill, reject);
		});
	}

	sendChargingStationStatusError(data, locale) {
		// Create a promise
		return new Promise((fulfill, reject) => {
			// Send it
			this._prepareAndSendEmail('charging-station-status-error', data, locale, fulfill, reject);
		});
	}

	sendUserAccountStatusChanged(data, locale) {
		// Create a promise
		return new Promise((fulfill, reject) => {
			// Send it
			this._prepareAndSendEmail('user-account-status-changed', data, locale, fulfill, reject);
		});
	}

	sendUnknownUserBadged(data, locale) {
		// Create a promise
		return new Promise((fulfill, reject) => {
			// Send it
			this._prepareAndSendEmail('unknown-user-badged', data, locale, fulfill, reject);
		});
	}

	sendTransactionStarted(data, locale) {
		// Create a promise
		return new Promise((fulfill, reject) => {
			// Send it
			this._prepareAndSendEmail('transaction-started', data, locale, fulfill, reject);
		});
	}

	_prepareAndSendEmail(templateName, data, locale, fulfill, reject) {
		// Create email
		let emailTemplate;
		// Get the template dir
		switch (templateName) {
			// Reset password
			case 'reset-password':
				emailTemplate = resetPasswordTemplate;
				break;
			// Registered user
			case 'new-registered-user':
				emailTemplate = newRegisteredUserTemplate;
				break;
			// Before End of charge
			case 'before-end-of-charge':
				emailTemplate = beforeEndOfChargeTemplate;
				break;
			// End of charge
			case 'end-of-charge':
				emailTemplate = endOfChargeTemplate;
				break;
			// Charging Station Status Error
			case 'charging-station-status-error':
				emailTemplate = chargingStationStatusError;
				break;
			case 'unknown-user-badged':
				emailTemplate = unknownUserBadged;
				break;
			case 'transaction-started':
				emailTemplate = transactionStarted;
				break;
			case 'user-account-status-changed':
				emailTemplate = userAccountStatusChanged;
				break;
		}
		// Template found?
		if (!emailTemplate) {
			// No
			reject(new Error(`No template found for ${templateName}`));
			return;
		}
		// Check for localized template?
		if (emailTemplate[locale]) {
			// Set the localized template
			emailTemplate = emailTemplate[locale];
		}
		// Render the subject
		let subject = ejs.render(emailTemplate.subject, data);
		// Render the HTML
		let html = ejs.render(emailTemplate.html, data);
		// Send the email
		this.sendEmail({
			to: (data.user?data.user.email:null),
			subject: subject,
			text: html,
			html: html
		}).then((message) => {
			// User
			Logging.logInfo({
				module: "EMailNotificationTask", method: "_prepareAndSendEmail", action: "SendEmail",
				message: `Email has been sent to User ${Utils.buildUserFullName(data.user)} successfully`,
				detailedMessages: {
					"subject": subject,
					"body": html
				}
			});
			// Ok
			fulfill(message);
		}, (error) => {
			reject(error);
		});
	}

	sendEmail(email) {
		// Add Admins in BCC
		if (_emailConfig.admins && _emailConfig.admins.length > 0) {
			// Add
			if (!email.bcc) {
				email.bcc = _emailConfig.admins.join(',');
			} else {
				email.bcc += ',' + _emailConfig.admins.join(',');
			}
		}
		// In promise
		return new Promise((fulfill, reject) => {
			// Create the message
			var message	= {
				from:  (!email.from?_emailConfig.from:email.from),
				to: email.to,
				cc: email.cc,
				bcc: email.bcc,
				subject: email.subject,
				// text: email.text,
				attachment: [
					{ data: email.html, alternative:true }
				]
			};

			// send the message and get a callback with an error or details of the message that was sent
			this.server.send(message, (err, message) => {
				// Error Handling
				if (err) {
					reject(err);
				} else {
					fulfill(message);
				}
			});
		});
	}
}

module.exports = EMailNotificationTask;
