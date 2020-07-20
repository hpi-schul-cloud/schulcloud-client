const OAuth = require('oauth-1.0a');
const crypto = require('crypto');

const ltiRoles = {
	user: 'Learner',
	student: 'Learner',
	teacher: 'Instructor',
	administrator: 'Administrator',
	superhero: 'Administrator',
};

class LTICustomer {
	constructor() {}

	createConsumer(key, secret) {
		return OAuth({
			consumer: {
				key,
				secret,
			},
			signature_method: 'HMAC-SHA1',
			hash_function(base_string, key) {
				return crypto.createHmac('sha1', key).update(base_string).digest('base64');
			},
		});
	}

	mapSchulcloudRoleToLTIRole(role) {
		return ltiRoles[role];
	}

	customFieldToString(custom) {
		return `custom_${custom.key}`;
	}
}

module.exports = { LTICustomer };
