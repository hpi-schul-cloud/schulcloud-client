const MAX_LEVEL_FILTER = 12;

const secretDataKeys = (() => [
	/* server list */
	'headers',
	'password',
	'passwort',
	'new_password',
	'new-password',
	'oauth-password',
	'current-password',
	'passwort_1',
	'passwort_2',
	'password_1',
	'password_2',
	'password-1',
	'password-2',
	'password_verification',
	'password_control',
	'PASSWORD_HASH',
	'password_new',
	'accessToken',
	'ticket',
	'firstName',
	'lastName',
	'email',
	'birthday',
	'description',
	'gradeComment',
	'_csrf',
	'searchUserPassword',
	/* new entry added in client */
	'resetId',
	'password_control',
	'username',
].map((k) => k.toLocaleLowerCase()))();

const filterSecretValue = (key, value) => {
	if (secretDataKeys.includes(key.toLocaleLowerCase())) {
		return '<secret>';
	}
	return value;
};

const filterDeep = (newData, level = 0) => {
	if (level > MAX_LEVEL_FILTER) {
		return '<max level exceeded>';
	}

	if (typeof newData === 'object' && newData !== null) {
		Object.entries(newData).forEach(([key, value]) => {
			const newValue = filterSecretValue(key, value);
			if (typeof newValue === 'string') {
				newData[key] = newValue;
			} else {
				filterDeep(value, level + 1);
			}
		});
	}
	return newData;
};
const filter = (data) => filterDeep({ ...data });

const secretQueryKeys = (() => ['accessToken', 'access_token'].map((k) => k.toLocaleLowerCase()))();
const filterQuery = (url) => {
	let newUrl = url;
	secretQueryKeys.forEach((key) => {
		// key is lower case
		if (newUrl.toLocaleLowerCase().includes(key)) {
			// first step cut complet query
			// maybe todo later add query as object of keys and remove keys with filter
			newUrl = url.split('?')[0];
			newUrl += '?<secretQuery>';
		}
	});
	return newUrl;
};

// important that it is not sent to sentry, or added it to logs
const filterLog = (log) => {
	if (log) {
		// req.url = filterQuery(req.url);
		// originalUrl is used by sentry
		log.url = filterQuery(log.originalUrl);
		log.body = filter(log.options);
		log.params = filter(log.params);
	}
	return log;
};

module.exports = { filterLog, filterQuery, filter };
