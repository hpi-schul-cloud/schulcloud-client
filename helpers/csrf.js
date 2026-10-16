/* eslint-disable no-underscore-dangle */
const { csrfSync } = require('csrf-sync');
const logger = require('./logger');

// previously the CSRF library csurf was used. As it is deprecated, csrf-sync is now used instead.
// this mirrors csurf's default lookup order (form field, multipart-form query string, AJAX header)
const getTokenFromRequest = (req) => (req.body && req.body._csrf)
	|| (req.query && req.query._csrf)
	|| req.headers['csrf-token'];

const { csrfSynchronisedProtection: csrfProtection } = csrfSync({ getTokenFromRequest });

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
			return next(error);
		}
		logger.warn('Die Anfrage enthält mehrere identische Sicherheitstokens (CSRF).');

		req.body._csrf = req.body._csrf[0];
	}
	return next();
};

const csrfErrorHandler = (err, req, res, next) => {
	if (err.code === 'EBADCSRFTOKEN') {
		res.render('lib/csrf', {
			loggedin: res.locals.loggedin,
		});
	} else {
		next(err);
	}
};

module.exports = {
	tokenInjector,
	duplicateTokenHandler,
	csrfErrorHandler,
	csrfProtection,
};
