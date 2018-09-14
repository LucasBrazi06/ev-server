module.exports.email = {
	"subject": "Account created!",
	"baseURL": "<%- evseDashboardURL %>",
	"body": {
		"header": {
			"title": "Account Created!",
			"image": {
				"left": {
					"height": 60,
					"url": "<%- evseDashboardURL %>/assets/img/logo-email.gif"
				},
				"right": {
					"height": 50,
					"url": "<%- evseDashboardURL %>/assets/img/info.png"
				}
			}
		},
		"beforeActionLines": [
			"Hi <%- (user.firstName?user.firstName:user.name) %>,",
			"",
			"Your account has been created successfully."
		],
		"action": {
			"title": "Verify your Account",
			"url": "<%- evseDashboardVerifyEmailURL %>"
		},
		"afterActionLines": [
			"Best Regards,",
			"EV Admin."
		],
		"footer": {
		}
	}
};

module.exports.fr_FR = {};
module.exports.fr_FR.email = {
	"subject": "Compte créé!",
	"baseURL": "<%- evseDashboardURL %>",
	"body": {
		"header": {
			"title": "Compte Créé!",
			"image": {
				"left": {
					"height": 60,
					"url": "<%- evseDashboardURL %>/assets/img/logo-email.gif"
				},
				"right": {
					"height": 50,
					"url": "<%- evseDashboardURL %>/assets/img/info.png"
				}
			}
		},
		"beforeActionLines": [
			"Bonjour <%- (user.firstName?user.firstName:user.name) %>,",
			"",
			"Votre compte a été créé avec succès."
		],
		"action": {
			"title": "Vérifier votre Compte",
			"url": "<%- evseDashboardVerifyEmailURL %>"
		},
		"afterActionLines": [
			"Cordialement,",
			"EV Admin."
		],
		"footer": {
		}
	}
};
