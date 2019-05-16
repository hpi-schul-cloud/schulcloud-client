const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const querystring = require('querystring');
const methodOverride = require('method-override');


const session = require('express-session');

// template stuff
const handlebars = require('handlebars');
const layouts = require('handlebars-layouts');
const handlebarsWax = require('handlebars-wax');
const authHelper = require('./helpers/authentication');

const app = express();
app.use(compression());
app.set('trust proxy', true);
const themeName = process.env.SC_THEME || 'default';
// view engine setup
const handlebarsHelper = require('./helpers/handlebars');

const wax = handlebarsWax(handlebars)
	.partials(path.join(__dirname, 'views/**/*.{hbs,js}'))
	.helpers(layouts)
	.helpers(handlebarsHelper.helpers);

wax.partials(path.join(__dirname, `theme/${themeName}/views/**/*.{hbs,js}`));

const viewDirs = [path.join(__dirname, 'views')];
viewDirs.unshift(path.join(__dirname, `theme/${themeName}/views/`));

app.set('views', viewDirs);
app.engine('hbs', wax.engine);
app.set('view engine', 'hbs');

app.set('view cache', true);

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, `build/${themeName}`)));

const sessionStore = new session.MemoryStore();
app.use(session({
	cookie: { maxAge: 60000 },
	store: sessionStore,
	saveUninitialized: true,
	resave: 'true',
	secret: 'secret',
}));

const defaultBaseDir = (req, res) => {
	let dir = process.env.DOCUMENT_BASE_DIR || 'https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/';
	dir += `${themeName}/`;
	if (themeName === 'open' && res.locals && res.locals.currentUser && res.locals.currentUser.schoolId) {
		// fixme currentUser missing here (after login)
		dir += `${res.locals.currentUser.schoolId}/`;
	}
	return dir;
};

const defaultDocuments = require('./helpers/content/documents.json');

// Custom flash middleware
app.use(async (req, res, next) => {
	if (!req.session.currentUser) {
		await authHelper.populateCurrentUser(req, res).then(() => {
			req.session.currentUser = res.locals.currentUser;
		});
	} else {
		res.locals.currentUser = req.session.currentUser;
	}
	// if there's a flash message in the session request, make it available in the response, then delete it
	res.locals.notification = req.session.notification;
	res.locals.inline = req.query.inline || false;
	res.locals.theme = {
		title: process.env.SC_TITLE || 'HPI Schul-Cloud',
		short_title: process.env.SC_SHORT_TITLE || 'Schul-Cloud',
		documents: Object.assign({}, {
			baseDir: defaultBaseDir(req, res),
			privacy: process.env.PRIVACY_DOCUMENT
				|| 'Datenschutz/Datenschutzerklaerung-Muster-Schulen-Onlineeinwilligung.pdf',
			termsOfUse: process.env.TERMS_OF_USE_DOCUMENT
				|| 'Datenschutz/Nutzungsordnung-HPI-Schule-Schueler-Onlineeinwilligung.pdf',
		}, defaultDocuments),
	};
	res.locals.domain = process.env.SC_DOMAIN || false;
	delete req.session.notification;
	next();
});


app.use(methodOverride('_method')); // for GET requests
app.use(methodOverride((req, res, next) => { // for POST requests
	if (req.body && typeof req.body === 'object' && '_method' in req.body) {
		const method = req.body._method;
		delete req.body._method;
		return method;
	}
}));

// Initialize the modules and their routes
app.use(require('./controllers/'));

app.get('/', (req, res, next) => {
	res.redirect('/login/');
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use((err, req, res, next) => {
	// set locals, only providing error in development
	const status = err.status || err.statusCode || 500;
	if (err.statusCode && err.error) {
		res.setHeader('error-message', err.error.message);
		res.locals.message = err.error.message;
	} else {
		res.locals.message = err.message;
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
