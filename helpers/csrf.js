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

const csrfErrorHandler = (err, req, res, next) => {
	if (err.code === 'EBADCSRFTOKEN') {
		// convert body object to array
		res.locals.csrfToken = req.csrfToken();
		// send base URL for opening in new tab
		const baseUrl = (req.headers.origin);
		const values = Object.keys(req.body).map(name => ({ name, value: req.body[name] }));
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
		return true;
	}
	return next(err);
};

module.exports = {
	tokenInjector,
	duplicateTokenHandler,
	csrfErrorHandler,
};
