const global = require('../config/global');

/**
 * Collapse leading slashes to one slash to avoid redirects to other websides
 * @param {string} redirectUrl URL to which the user should be redirected
 * @returns {string} URL without multiple leading slashes
 */
const collapseLeadingSlashes = (redirectUrl) => redirectUrl.replace(/^\/+/, '/');

/**
 * Transform given URL to relative redirect URL
 * @param {string} redirectUrl URL to which the user should be redirected
 * @returns {string} valid redirect URL
 */
const getValidRedirect = (redirectUrl) => {
	if (!redirectUrl) return '/';
	let relativeUrl = '/';
	const parsedUrl = URL.parse(collapseLeadingSlashes(redirectUrl), global.HOST);
	if (parsedUrl) {
		relativeUrl = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
	}

	return relativeUrl;
};

const joinPathWithQuery = (path, paramsString) => (paramsString ? `${path}?${paramsString}` : path);

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
	joinPathWithQuery,
};
