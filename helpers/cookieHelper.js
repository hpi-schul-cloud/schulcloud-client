const { Configuration } = require('@hpi-schul-cloud/commons');

const cookieDefaults = {
	httpOnly: Configuration.get('COOKIE__HTTP_ONLY'),
	hostOnly: Configuration.get('COOKIE__HOST_ONLY'),
	sameSite: Configuration.get('COOKIE__SAME_SITE'),
	secure: Configuration.get('COOKIE__SECURE'),
	expires: new Date(Date.now() + Configuration.get('COOKIE__EXPIRES_SECONDS')),
};

const setCookie = (res, cookieName, value, options = {}) => {
	const cookieOptions = { ...cookieDefaults, ...options };
	if (cookieName === 'jwt') {
		cookieOptions.httpOnly = Configuration.get('COOKIE__JWT_HTTP_ONLY');
	}
	res.cookie(cookieName, value, cookieOptions);
};

module.exports = {
	cookieDefaults,
	setCookie,
};
