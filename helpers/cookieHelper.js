const { Configuration } = require('@schul-cloud/commons');

const cookieDefaults = {
	httpOnly: Configuration.get('COOKIE__HTTP_ONLY'),
	hostOnly: Configuration.get('COOKIE__HOST_ONLY'),
	sameSite: Configuration.get('COOKIE__SAME_SITE'),
	secure: Configuration.get('COOKIE__SECURE'),
};

const setCookie = (res, cookieName, value, options = {}) => {
	res.cookie(cookieName, value, { ...cookieDefaults, ...options });
};

module.exports = {
	cookieDefaults,
	setCookie,
};
