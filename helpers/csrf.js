/* eslint-disable no-underscore-dangle, max-len */

const tokenInjector = (req, res, next) => {
	res.locals.csrfToken = req.csrfToken();
	next();
};

const duplicateTokenHandler = (req, res, next) => {
	if (req.body && Array.isArray(req.body._csrf)) {
		req.body._csrf = req.body._csrf[0];
	}
	next();
};

const errorHandler = (err, req, res, next) => {
	if (err.code === 'EBADCSRFTOKEN') {
		// convert body object to array
		res.locals.csrfToken = req.csrfToken();
		// send base URL for opening in new tab
		const baseUrl = (req.headers.origin || process.env.HOST || 'http://localhost:3100');
		const values = Object.keys(req.body).map(name => ({ name, value: req.body[name] }));
		res.render('lib/csrf', {
			loggedin: res.locals.loggedin,
			values,
			baseUrl,
		});
		return true;
	}
	return next(err);
};

module.exports = {
	tokenInjector,
	duplicateTokenHandler,
	errorHandler,
};
