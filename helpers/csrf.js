/* eslint-disable no-underscore-dangle */
const Sentry = require('@sentry/node');
const logger = require('./logger');

const tokenInjector = (req, res, next) => {
	res.locals.csrfToken = req.csrfToken();
	next();
};

const duplicateTokenHandler = (req, res, next) => {
	if (req.body && Array.isArray(req.body._csrf)) {
		const allArrayItemsIdentical = req.body._csrf.every((token) => token === req.body._csrf[0]);
		if (!allArrayItemsIdentical) {
			// eslint-disable-next-line max-len
			const error = new Error('Bei der Anfrage wurden mehrere Sicherheitstokens (CSRF) mitgesendet. Bitte probiere es erneut.');
			error.status = 400;
			logger.error(error);
			return next(error);
		}
		logger.warn('Die Anfrage enthält mehrere identische Sicherheitstokens (CSRF).');

		req.body._csrf = req.body._csrf[0];
	}
	return next();
};

const csrfErrorHandler = (err, req, res, next) => {
	if (err.code === 'EBADCSRFTOKEN') {
		Sentry.captureException(err);
		// convert body object to array
		res.locals.csrfToken = req.csrfToken();
		// send base URL for opening in new tab
		const baseUrl = (req.headers.origin);
		const values = Object.keys(req.body).map((name) => ({ name, value: req.body[name] }));
		values.push({
			name: 'csrfErrorcount',
			value: '1',
		});
		// show only a reload button if not all data is present
		const simpleView = (!baseUrl || !values);
		res.render('lib/csrf', {
			loggedin: res.locals.loggedin,
			values,
			previousError: (req.body.csrfErrorcount),
			baseUrl,
			simpleView,
		});
	} else {
		next(err);
	}
};

module.exports = {
	tokenInjector,
	duplicateTokenHandler,
	csrfErrorHandler,
};
