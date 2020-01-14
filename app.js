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
const fileUpload = require('express-fileupload');
const csurf = require('csurf');
const handlebars = require('handlebars');
const layouts = require('handlebars-layouts');
const handlebarsWax = require('handlebars-wax');
const Sentry = require('@sentry/node');
const { Configuration } = require('@schul-cloud/commons');
const { tokenInjector, duplicateTokenHandler, csrfErrorHandler } = require('./helpers/csrf');

const { version } = require('./package.json');
const { sha } = require('./helpers/version');
const logger = require('./helpers/logger');

const {
	KEEP_ALIVE,
	SENTRY_DSN,
	SC_DOMAIN,
	SC_THEME,
	REDIS_URI,
	JWT_SHOW_TIMEOUT_WARNING_SECONDS,
	JWT_TIMEOUT_SECONDS,
} = require('./config/global');

const app = express();
const Config = new Configuration();
Config.init(app);

if (SENTRY_DSN) {
	Sentry.init({
		dsn: SENTRY_DSN,
		environment: app.get('env'),
		release: version,
		integrations: [
			new Sentry.Integrations.Console(),
		],
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

// set security headers
const securityHeaders = require('./middleware/security_headers');

app.use(securityHeaders);

// set cors headers
const cors = require('./middleware/cors');

app.use(cors);

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
app.use(morgan('dev', {
	skip(req, res) {
		return req && ((req.route || {}).path || '').includes('tsp-login');
	},
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, `build/${themeName}`)));

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

app.use(session({
	cookie: { maxAge: 1000 * 60 * 60 * 6 },
	rolling: true, // refresh session with every request within maxAge
	store: sessionStore,
	saveUninitialized: true,
	resave: false,
	secret: 'secret', // only used for cookie encryption; the cookie does only contain the session id though
}));

app.use(fileUpload({
	createParentPath: true,
}));

// CSRF middlewares
app.use(duplicateTokenHandler);
app.use(csurf());
app.use(tokenInjector);

const setTheme = require('./helpers/theme');

function removeIds(url) {
	const checkForHexRegExp = /[a-f\d]{24}/ig;
	return url.replace(checkForHexRegExp, 'ID');
}

// Custom flash middleware
app.use(async (req, res, next) => {
	try {
		await authHelper.populateCurrentUser(req, res);
	} catch (error) {
		logger.error('could not populate current user', error);
		return next(error);
	}
	if (SENTRY_DSN) {
		Sentry.configureScope((scope) => {
			if (res.locals.currentUser) {
				scope.setTag({ schoolId: res.locals.currentUser.schoolId });
			}
			const { url, header } = req;
			scope.request = { url: removeIds(url), header };
		});
	}
	// if there's a flash message in the session request, make it available in the response, then delete it
	res.locals.notification = req.session.notification;
	res.locals.inline = req.query.inline || false;
	setTheme(res);
	res.locals.domain = SC_DOMAIN;
	res.locals.production = req.app.get('env') === 'production';
	res.locals.env = req.app.get('env') || false; // TODO: ist das false hier nicht quatsch?
	res.locals.SENTRY_DSN = SENTRY_DSN;
	res.locals.JWT_SHOW_TIMEOUT_WARNING_SECONDS = Number(JWT_SHOW_TIMEOUT_WARNING_SECONDS);
	res.locals.JWT_TIMEOUT_SECONDS = Number(JWT_TIMEOUT_SECONDS);
	res.locals.version = version;
	res.locals.sha = sha;
	delete req.session.notification;
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
app.use(csrfErrorHandler);
app.use((err, req, res, next) => {
	// set locals, only providing error in development
	const status = err.status || err.statusCode || 500;
	if (err.statusCode && err.error) {
		res.setHeader('error-message', err.error.message);
		res.locals.message = err.error.message;
	} else {
		res.locals.message = err.message;
	}

	if (res.locals && res.locals.message.includes('ESOCKETTIMEDOUT') && err.options) {
		const message = `ESOCKETTIMEDOUT by route: ${err.options.baseUrl + err.options.uri}`;
		logger.warn(message);
		Sentry.captureMessage(message);
	}
	res.locals.error = req.app.get('env') === 'development' ? err : { status };

	if (res.locals.currentUser) res.locals.loggedin = true;
	// render the error page
	res.status(status);
	res.render('lib/error', {
		loggedin: res.locals.loggedin,
		inline: res.locals.inline ? true : !res.locals.loggedin,
	});
});

module.exports = app;
