const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const methodOverride = require('method-override');
const csurf = require('csurf');
const handlebars = require('handlebars');
const layouts = require('handlebars-layouts');
const handlebarsWax = require('handlebars-wax');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { initializeSessionStorage } = require('./helpers/sessionStorage');

const { staticAssetsMiddleware } = require('./middleware/assets');
const { version } = require('./package.json');
const {
	filterLog,
	nonceValueSet,
	prometheus,
	tokenInjector,
	duplicateTokenHandler,
	csrfErrorHandler,
	logger,
	sha,
} = require('./helpers');

const {
	KEEP_ALIVE,
	SC_DOMAIN,
	SC_THEME,
	JWT_SHOW_TIMEOUT_WARNING_SECONDS,
	MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE,
	JWT_TIMEOUT_SECONDS,
	API_HOST,
	PUBLIC_BACKEND_URL,
} = require('./config/global');
const authHelper = require('./helpers/authentication');
const securityHeaders = require('./middleware/security_headers');
const cors = require('./middleware/cors');
const handlebarsHelper = require('./helpers/handlebars');
const setTheme = require('./helpers/theme');
const controllers = require('./controllers');
const i18nMiddleware = require('./middleware/i18n');
const datetimeMiddleware = require('./middleware/datetime');

const setupApp = async () => {
	const app = express();

	// print current configuration
	Configuration.printHierarchy();

	// setup prometheus metrics
	prometheus(app);

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
	app.use(securityHeaders);

	// generate nonce value
	if (Configuration.get('CORS')) {
		app.use(nonceValueSet);
	}

	// set cors headers
	app.use(cors);

	app.use(compression());
	app.set('trust proxy', true);
	const themeName = SC_THEME;

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
		let morganLogFormat = Configuration.get('MORGAN_LOG_FORMAT');
		const noColor = Configuration.has('NO_COLOR') && Configuration.get('NO_COLOR');

		if (morganLogFormat === 'dev' && noColor) {
			morganLogFormat = ':method :url :status :response-time ms - :res[content-length]';
		}

		app.use(morgan(morganLogFormat));
	}

	app.use(bodyParser.json({ limit: '10mb' }));
	app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
	app.use(cookieParser());

	staticAssetsMiddleware(app);

	await initializeSessionStorage(app);

	// CSRF middlewares
	if (Configuration.get('FEATURE_CSRF_ENABLED')) {
		app.use(duplicateTokenHandler);
		app.use(csurf());
		app.use(tokenInjector);
		// there follows an csrf error handler below...
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
		res.locals.JWT_SHOW_TIMEOUT_WARNING_SECONDS = Number(
			JWT_SHOW_TIMEOUT_WARNING_SECONDS,
		);
		res.locals.MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE = Number(
			MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE,
		);
		// eslint-disable-next-line max-len
		res.locals.MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_MEGABYTE = MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE / 1024 / 1024;
		res.locals.JWT_TIMEOUT_SECONDS = Number(JWT_TIMEOUT_SECONDS);
		res.locals.API_HOST = PUBLIC_BACKEND_URL || `${API_HOST}/`;
		res.locals.version = version;
		res.locals.sha = sha;
		res.locals.ROCKETCHAT_SERVICE_ENABLED = Configuration.get(
			'ROCKETCHAT_SERVICE_ENABLED',
		);
		delete req.session.notification;
		return next();
	});

	app.use(methodOverride('_method')); // for GET requests
	app.use(
		methodOverride((req, res, next) => {
			// for POST requests
			if (
				req.body
				&& typeof req.body === 'object'
				&& '_method' in req.body
			) {
				// eslint-disable-next-line no-underscore-dangle
				const method = req.body._method;
				// eslint-disable-next-line no-underscore-dangle
				delete req.body._method;
				return method;
			}
			return undefined;
		}),
	);

	// add res.$t method for i18n with users prefered language
	app.use(i18nMiddleware);
	app.use(datetimeMiddleware);

	const redirectUrl = Configuration.get('ROOT_URL_REDIRECT');
	if (redirectUrl !== '') {
		app.get('/', (req, res, next) => {
			res.redirect(redirectUrl);
		});
	}

	// Initialize the modules and their routes
	app.use(controllers);

	// catch 404 and forward to error handler
	app.use((req, res, next) => {
		const url = req.originalUrl || req.url;
		const err = new Error(`Page Not Found ${url}`);
		err.status = 404;
		next(err);
	});

	// error handlers
	if (Configuration.get('FEATURE_CSRF_ENABLED')) {
		app.use(csrfErrorHandler);
	}

	// no statusCode exist for this cases
	const isTimeoutError = (err) => err
		&& err.message
		&& (err.message.includes('ESOCKETTIMEDOUT')
			|| err.message.includes('ECONNREFUSED')
			|| err.message.includes('ETIMEDOUT'));

	const errorHandler = (err) => {
		const error = err.error || err;
		const status = error.status || error.statusCode || 500;
		error.statusCode = status;

		// prevent logging jwts and x-api-keys
		if (error.options && error.options.headers) {
			delete error.options.headers;
		}

		return { error, status };
	};

	app.use((err, req, res, next) => {
		const { error, status } = errorHandler(err);

		if (!res.locals) {
			res.locals = {};
		}

		if (Configuration.get('FEATURE_LOG_REQUEST') === true) {
			const reqInfo = {
				url: req.originalUrl || req.url,
				method: req.originalMethod || req.method,
				params: req.params,
				body: req.body,
			};
			error.requestInfo = filterLog(reqInfo);
		}

		if (res.locals.currentUser) {
			res.locals.loggedin = true;
			const { _id, schoolId, roles } = res.locals.currentUser;
			error.currentUser = {
				userId: _id,
				schoolId,
				roles: (roles || []).map((r) => r.name),
			};
		}

		if (error.message) {
			res.setHeader('error-message', error.message);
			res.locals.message = error.message;
		} else {
			res.locals.message = `Error with statusCode ${status}`;
		}

		// override with try again message by timeouts
		if (isTimeoutError(error)) {
			const baseRoute = typeof err.options.baseUrl === 'string'
				? err.options.baseUrl.slice(0, -1)
				: '';
			const route = baseRoute + err.options.uri;
			const routeMessage = res.locals.production
				? ''
				: ` beim Aufruf der Route ${route}`;
			res.locals.message = `Es ist ein Fehler aufgetreten${routeMessage}. Bitte versuche es erneut.`;
		}

		// do not show full errors in production mode
		res.locals.error = req.app.get('env') !== 'development' ? err : { status };

		logger.error(error);

		// keep sidebar restricted in error page
		authHelper.restrictSidebar(req, res);

		// render the error page
		res.status(status).render('lib/error', {
			pageTitle: res.$t('lib.error.headline.pageTitle'),
			loggedin: res.locals.loggedin,
			inline: res.locals.inline ? true : !res.locals.loggedin,
		});
	});

	process.on('unhandledRejection', (err) => {
		const { error } = errorHandler(err);
		error.message = `unhandledRejection: ${error.message}`;
		logger.error(error);
	});

	return app;
};

module.exports = async () => {
	const app = await setupApp();

	return app;
};
