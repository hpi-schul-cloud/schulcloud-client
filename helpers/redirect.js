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

module.exports = {
	getValidRedirect,
};
