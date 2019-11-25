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
	if (err.code !== 'EBADCSRFTOKEN') return next(err);
	res.render('lib/error', {
		loggedin: res.locals.loggedin,
		message: 'Ungültiger CSRF-Token',
		title: 'Aus Sicherheitsgründen ist die Sitzung abgelaufen. Bitte lade die Seite neu, um die Sitzung wieder zu starten.',
		reload: true,
	});
};

module.exports = {
	tokenInjector,
	duplicateTokenHandler,
	errorHandler,
};
