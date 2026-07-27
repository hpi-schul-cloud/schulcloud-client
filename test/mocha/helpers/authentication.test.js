const chai = require('chai');

const loadAuthenticationHelper = (apiImplementation) => {
	const authPath = require.resolve('../../../helpers/authentication');
	const apiPath = require.resolve('../../../api');
	const originalApiModule = require.cache[apiPath];

	delete require.cache[authPath];
	require.cache[apiPath] = {
		id: apiPath,
		filename: apiPath,
		loaded: true,
		exports: apiImplementation,
	};

	// eslint-disable-next-line global-require
	const authenticationHelper = require('../../../helpers/authentication');

	const restore = () => {
		delete require.cache[authPath];
		if (originalApiModule) {
			require.cache[apiPath] = originalApiModule;
		} else {
			delete require.cache[apiPath];
		}
	};

	return { authenticationHelper, restore };
};

const { generateConsentPassword } = require('../../../helpers/authentication');

/**
 * PASSWORD PATTERN BASED ON PASSWORD POLICY:
 * - should contain at least one capital letter,
 * - should contain at least one small letter,
 * - should contain at least one digit,
 * - length of the password should be at least 12.
 */
const PASSWORD_POLICY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,255}$/;

describe('authentication helpers tests', () => {
	describe('generateConsentPassword should', () => {
		it('matches password policy requirements', () => {
			// when
			const generatedPassword = generateConsentPassword();

			// then
			chai.expect(generatedPassword).to.match(PASSWORD_POLICY_PATTERN);
		});
	});

	describe('isAuthenticated should', () => {
		it('clear stale cookies when server rejects the jwt as unauthenticated', async () => {
			const apiImplementation = () => ({
				post: async () => Promise.reject(Object.assign(new Error('auto-logout'), {
					statusCode: 401,
					error: { className: 'auto-logout' },
				})),
			});
			const { authenticationHelper, restore } = loadAuthenticationHelper(apiImplementation);
			const clearCookieCalls = [];
			let destroyedSession = false;
			const req = {
				cookies: {
					jwt: 'stale-jwt',
				},
				session: {
					destroy: (callback) => {
						destroyedSession = true;
						callback();
					},
				},
			};
			const res = {
				clearCookie: (cookieName) => clearCookieCalls.push(cookieName),
			};

			try {
				const result = await authenticationHelper.isAuthenticated(req, res);

				chai.expect(result).to.equal(false);
				chai.expect(destroyedSession).to.equal(true);
				chai.expect(clearCookieCalls).to.deep.equal(['jwt', 'isLoggedIn']);
			} finally {
				restore();
			}
		});

		it('keep cookies when authentication fails for a non-auth reason', async () => {
			const apiImplementation = () => ({
				post: async () => Promise.reject(Object.assign(new Error('service unavailable'), {
					statusCode: 503,
				})),
			});
			const { authenticationHelper, restore } = loadAuthenticationHelper(apiImplementation);
			const clearCookieCalls = [];
			let destroyedSession = false;
			const req = {
				cookies: {
					jwt: 'maybe-valid-jwt',
				},
				session: {
					destroy: (callback) => {
						destroyedSession = true;
						callback();
					},
				},
			};
			const res = {
				clearCookie: (cookieName) => clearCookieCalls.push(cookieName),
			};

			try {
				const result = await authenticationHelper.isAuthenticated(req, res);

				chai.expect(result).to.equal(false);
				chai.expect(destroyedSession).to.equal(false);
				chai.expect(clearCookieCalls).to.deep.equal([]);
			} finally {
				restore();
			}
		});

		it('clear stale cookies when session destruction fails', async () => {
			const apiImplementation = () => ({
				post: async () => Promise.reject(Object.assign(new Error('auto-logout'), {
					statusCode: 401,
				})),
			});
			const { authenticationHelper, restore } = loadAuthenticationHelper(apiImplementation);
			const clearCookieCalls = [];
			const req = {
				cookies: { jwt: 'stale-jwt' },
				session: {
					destroy: (callback) => callback(new Error('session store unavailable')),
				},
			};
			const res = {
				clearCookie: (cookieName) => clearCookieCalls.push(cookieName),
			};

			try {
				const result = await authenticationHelper.isAuthenticated(req, res);

				chai.expect(result).to.equal(false);
				chai.expect(clearCookieCalls).to.deep.equal(['jwt', 'isLoggedIn']);
			} finally {
				restore();
			}
		});
	});
});
