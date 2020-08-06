const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../app');
const loginHelper = require('../helper/login-helper');

const { expect } = chai;

chai.use(chaiHttp);

describe('forcePasswordChange tests', () => {
	before((done) => {
		this.server = app.listen(3031);
		this.server.once('listening', () => {
			loginHelper.login(app).then((res) => {
				this.agent = res.agent;
				done();
			});
		});
	});

	after((done) => {
		this.server.close(done);
	});
	it('GET /forcePasswordChange if the user was not forced to change password, '
		+ 'he will be redirected to dashboard if he '
		+ 'tries to visit forcePasswordChange page', () => new Promise((resolve) => {
		this.agent
			.get('/forcePasswordChange')
			.end((err, res) => {
				expect(res.statusCode)
					.to
					.equal(200);
				expect(res.redirects[0].endsWith('/dashboard'))
					.to
					.equal(true);
				resolve();
			});
	}));
});
