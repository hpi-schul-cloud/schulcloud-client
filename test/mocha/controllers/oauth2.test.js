const { expect } = require('chai');
const router = require('../../../controllers/oauth2');

describe('OAuth2 username iframe route', () => {
	it('redirects the legacy URL to the server page', () => {
		const route = router.stack.find((layer) => layer.route && layer.route.path === '/username/:pseudonym');
		const handler = route.route.stack[0].handle;
		const request = { params: { pseudonym: 'opaque/id' } };
		let redirect;
		const response = {
			redirect: (status, url) => {
				redirect = { status, url };
			},
		};

		handler(request, response);

		expect(redirect).to.deep.equal({
			status: 307,
			url: '/api/v3/pseudonyms/username/opaque%2Fid',
		});
	});
});
