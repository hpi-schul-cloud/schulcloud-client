module.exports = function injectToken (req, res, next) {
	res.locals.csrfToken = req.csrfToken();
	next();
}; 
