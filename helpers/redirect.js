const url = require('url');

/**
 * Collapse leading slashes to one slash to avoid redirects to other websides
 * @param {string} redirectUrl URL to which the user should be redirected
 * @returns {string} URL without multiple leading slashes
 */
const collapseLeadingSlashes = (str) => str.replace(/^\/*/, '/');

/**
 * Sanitize given URL
 * @param {string} redirectUrl URL to which the user should be redirected
 * @returns {string} sanitized URL
 */
const sanitizeUrl = collapseLeadingSlashes;

/**
 * Transform given URL to valid redirect URL
 * @param {string} redirectUrl URL to which the user should be redirected
 * @returns {string} valid redirect URL
 */
const getValidRedirect = (redirectUrl) => {
	if (!redirectUrl) return '/';
	const targetUrl = url.parse(redirectUrl);
	return encodeURI(sanitizeUrl(targetUrl.path));
};

/**
 * Perform a safe redirect to the referer header of the request
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {string} [appendage=''] string that should be attached to the redirect
 */
const safeBackRedirect = (req, res, appendage = '') => {
	const location = req.body.referrer || req.header('Referer') || '/';
	return res.redirect(getValidRedirect(location) + appendage);
};

module.exports = {
	getValidRedirect,
	safeBackRedirect,
};
