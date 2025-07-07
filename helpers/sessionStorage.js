const session = require('express-session');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { ValkeyFactory } = require('./valkyFactory');

function initSessionMiddleware(app, store) {
	const SIX_HOURS = 1000 * 60 * 60 * 6;
	app.use(
		session({
			cookie: {
				httpOnly: true,
				sameSite: Configuration.get('SESSION_COOKIE_SAME_SITE'),
				secure: 'auto',
				maxAge: SIX_HOURS,
			},
			rolling: true, // refresh session with every request within maxAge
			store,
			saveUninitialized: true,
			resave: false,
			secret: Configuration.get('COOKIE_SECRET'), // Secret used to sign the session ID cookie
		}),
	);
}

const initializeSessionStorage = async (app) => {
	const sessionStore = await ValkeyFactory.build();

	initSessionMiddleware(app, sessionStore);
};

module.exports = {
	initializeSessionStorage,
};
