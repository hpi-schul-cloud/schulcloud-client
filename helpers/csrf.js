/* eslint-disable no-underscore-dangle */

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

module.exports = {
	tokenInjector,
	duplicateTokenHandler,
};
