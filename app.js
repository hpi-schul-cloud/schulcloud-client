const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const redis = require('redis');
const connectRedis = require('connect-redis');
const session = require('express-session');
const methodOverride = require('method-override');
const csurf = require('csurf');
const handlebars = require('handlebars');
const layouts = require('handlebars-layouts');
const handlebarsWax = require('handlebars-wax');
const Sentry = require('@sentry/node');
const { Configuration } = require('@schul-cloud/commons');
const { tokenInjector, duplicateTokenHandler, csrfErrorHandler } = require('./helpers/csrf');
const { nonceValueSet } = require('./helpers/csp');

const { version } = require('./package.json');
const { sha } = require('./helpers/version');
const logger = require('./helpers/logger');

const {
	KEEP_ALIVE,
	SC_DOMAIN,
	SC_THEME,
	REDIS_URI,
	JWT_SHOW_TIMEOUT_WARNING_SECONDS,
	JWT_TIMEOUT_SECONDS,
	BACKEND_URL,
	PUBLIC_BACKEND_URL,
	ROCKETCHAT_SERVICE_ENABLED,
	FEATURE_MATRIX_MESSENGER_ENABLED,
} = require('./config/global');

const app = express();

if (Configuration.has('SENTRY_DSN')) {
	Sentry.init({
		dsn: Configuration.get('SENTRY_DSN'),
		environment: app.get('env'),
		release: version,
		sampleRate: Configuration.get('SENTRY_SAMPLE_RATE'),
		/*	Sentry.Handlers.requestHandler() is used
			integrations: [
				new Sentry.Integrations.Console(),
			],
		*/
	});
	Sentry.configureScope((scope) => {
		scope.setTag('frontend', false);
		scope.setLevel('warning');
		scope.setTag('domain', SC_DOMAIN);
		scope.setTag('sha', sha);
	});
	app.use(Sentry.Handlers.requestHandler());
}

// template stuff
const authHelper = require('./helpers/authentication');

// set custom response header for ha proxy
if (KEEP_ALIVE) {
	app.use((req, res, next) => {
		res.setHeader('Connection', 'Keep-Alive');
		next();
	});
}

// disable x-powered-by header
app.disable('x-powered-by');

// set security headers
const securityHeaders = require('./middleware/security_headers');

app.use(securityHeaders);

// generate nonce value
if (Configuration.get('CORS')) {
	app.use(nonceValueSet);
}

// set cors headers
app.use(require('./middleware/cors'));

app.use(compression());
app.set('trust proxy', true);
const themeName = SC_THEME;
// view engine setup
const handlebarsHelper = require('./helpers/handlebars');

const wax = handlebarsWax(handlebars)
	.partials(path.join(__dirname, 'views/**/*.{hbs,js}'))
	.helpers(layouts)
	.helpers(handlebarsHelper.helpers(app));

wax.partials(path.join(__dirname, `theme/${themeName}/views/**/*.{hbs,js}`));

const viewDirs = [path.join(__dirname, 'views')];
viewDirs.unshift(path.join(__dirname, `theme/${themeName}/views/`));

app.set('views', viewDirs);
app.engine('hbs', wax.engine);
app.set('view engine', 'hbs');

app.set('view cache', true);

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if (Configuration.get('FEATURE_MORGAN_LOG_ENABLED')) {
	const morganLogFormat = Configuration.get('MORGAN_LOG_FORMAT');
	app.use(morgan(morganLogFormat, {
		skip(req, res) {
			return req && ((req.route || {}).path || '').includes('tsp-login');
		},
	}));
}

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, `build/${themeName}`)));
app.use('/locales', express.static(path.join(__dirname, 'locales')));

let sessionStore;
const redisUrl = REDIS_URI;
if (redisUrl) {
	logger.info(`Using Redis session store at '${redisUrl}'.`);
	const RedisStore = connectRedis(session);
	const client = redis.createClient({
		url: redisUrl,
	});
	sessionStore = new RedisStore({ client });
} else {
	logger.info('Using in-memory session store.');
	sessionStore = new session.MemoryStore();
}

if (!Configuration.get('COOKIE__SECURE') && Configuration.get('COOKIE__SAME_SITE') === 'None') {
	Configuration.set('COOKIE__SAME_SITE', 'Lax');
	// eslint-disable-next-line max-len
	const cookieConfigErrorMsg = 'Setting COOKIE.SAME_SITE="None" requires COOKIE.SECURE=true. Changed to COOKIE.SAME_SITE="Lax"';
	Sentry.captureMessage(cookieConfigErrorMsg);
	logger.error(cookieConfigErrorMsg);
}

app.use(session({
	cookie: { maxAge: 1000 * 60 * 60 * 6 },
	rolling: true, // refresh session with every request within maxAge
	store: sessionStore,
	saveUninitialized: true,
	resave: false,
	secret: Configuration.get('COOKIE_SECRET'), // Secret used to sign the session ID cookie
	sameSite: Configuration.get('COOKIE__SAME_SITE'), // restrict jwt access to our domain ressources only
	secure: Configuration.get('COOKIE__SECURE'),
}));

// CSRF middlewares
if (Configuration.get('FEATURE_CSRF_ENABLED')) {
	app.use(duplicateTokenHandler);
	app.use(csurf());
	app.use(tokenInjector);
	// there follows an csrf error handler below...
}

const setTheme = require('./helpers/theme');

function removeIds(url) {
	const checkForHexRegExp = /[a-f\d]{24}/ig;
	return url.replace(checkForHexRegExp, 'ID');
}

// Custom flash middleware
app.use(async (req, res, next) => {
	// if there's a flash message in the session request, make it available in the response, then delete it
	res.locals.notification = req.session.notification;
	res.locals.inline = req.query.inline || false;
	setTheme(res);
	res.locals.domain = SC_DOMAIN;
	res.locals.production = req.app.get('env') === 'production';
	res.locals.env = req.app.get('env') || false; // TODO: ist das false hier nicht quatsch?
	res.locals.JWT_SHOW_TIMEOUT_WARNING_SECONDS = Number(JWT_SHOW_TIMEOUT_WARNING_SECONDS);
	res.locals.JWT_TIMEOUT_SECONDS = Number(JWT_TIMEOUT_SECONDS);
	res.locals.BACKEND_URL = PUBLIC_BACKEND_URL || BACKEND_URL;
	res.locals.version = version;
	res.locals.sha = sha;
	res.locals.ROCKETCHAT_SERVICE_ENABLED = ROCKETCHAT_SERVICE_ENABLED;
	res.locals.FEATURE_MATRIX_MESSENGER_ENABLED = FEATURE_MATRIX_MESSENGER_ENABLED;
	delete req.session.notification;
	try {
		await authHelper.populateCurrentUser(req, res);
	} catch (error) {
		logger.error('could not populate current user', error);
		return next(error);
	}
	if (Configuration.has('SENTRY_DSN')) {
		Sentry.configureScope((scope) => {
			if (res.locals.currentUser) {
				scope.setTag({ schoolId: res.locals.currentUser.schoolId });
			}
			const { url, header } = req;
			scope.request = { url: removeIds(url), header };
		});
	}
	return next();
});


app.use(methodOverride('_method')); // for GET requests
app.use(methodOverride((req, res, next) => { // for POST requests
	if (req.body && typeof req.body === 'object' && '_method' in req.body) {
		// eslint-disable-next-line no-underscore-dangle
		const method = req.body._method;
		// eslint-disable-next-line no-underscore-dangle
		delete req.body._method;
		return method;
	}
}));

// add res.$t method for i18n with users prefered language
app.use(require('./middleware/i18n'));

// Initialize the modules and their routes
app.use(require('./controllers/'));

app.get('/', (req, res, next) => {
	res.redirect('/login/');
});

// sentry error handler
app.use(Sentry.Handlers.errorHandler());

// catch 404 and forward to error handler
app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers
if (Configuration.get('FEATURE_CSRF_ENABLED')) {
	app.use(csrfErrorHandler);
}

const handleTimeouts = (err, res) => {
	if (!err.options) {
		err.options = {};
	}

	const baseRoute = typeof err.options.baseUrl === 'string' ? err.options.baseUrl.slice(0, -1) : '';
	const route = baseRoute + err.options.uri;

	// no statusCode exist for this cases
	if (err.message.includes('ESOCKETTIMEDOUT') || err.message.includes('ECONNREFUSED')) {
		logger.warn(`${err.message} by route: ${route}`);
		Sentry.captureException(err);
		if (res.locals) {
			const routeMessage = res.locals.production ? '' : ` beim Aufruf der Route ${route}`;
			res.locals.message = `Es ist ein Fehler aufgetreten${routeMessage}. Bitte versuche es erneut.`;
		}
	}
};

app.use((err, req, res, next) => {
	// set locals, only providing error in development
	const status = err.status || err.statusCode || 500;
	if (err.statusCode && err.error && err.error.message) {
		res.setHeader('error-message', err.error.message);
		res.locals.message = err.error.message;
	} else {
		res.locals.message = err.message;
	}

	handleTimeouts(err, res);

	res.locals.error = req.app.get('env') === 'development' ? err : { status };
	if (err.error) logger.error(err.error);
	if (res.locals.currentUser) res.locals.loggedin = true;

	// keep sidebar restricted in error page
	authHelper.restrictSidebar(req, res);

	// render the error page
	res.status(status).render('lib/error', {
		loggedin: res.locals.loggedin,
		inline: res.locals.inline ? true : !res.locals.loggedin,
	});
});

module.exports = app;
