/* eslint-disable max-len */
const chai = require('chai');
const cookieHelper = require('../../../helpers/cookieHelper');

const mockRes = {
	cookie: (name, value, options) => {
		const optionsString = Object.keys(options).map((key) => `${key}=${options[key]}`).join('; ');
		this.resultCookie = `Set-Cookie: ${name}=${value}; ${optionsString}`;
	},
	getCookie: () => this.resultCookie,
};

describe('cookie helper tests', () => {
	describe('setCookie should', () => {
		it('matches cookie string', () => {
			const cookieName = 'testCookie';
			const cookieValue = 'testValue';
			const cookieExpires = 'Wed Nov 18 2020 10:36:23 GMT+0100';
			// eslint-disable-next-line no-trailing-spaces
			const checkString = `Set-Cookie: ${cookieName}=${cookieValue}; httpOnly=false; hostOnly=false; sameSite=Lax; secure=false; expires=${cookieExpires}`;
			cookieHelper.setCookie(mockRes, cookieName, cookieValue, { expires: cookieExpires });

			const result = mockRes.getCookie();

			// then
			chai.expect(result).to.equal(checkString);
		});
	});
});
