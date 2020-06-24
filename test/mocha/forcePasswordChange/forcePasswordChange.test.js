
const chai = require('chai');

const { expect } = chai;
const chaiHttp = require('chai-http');
const app = require('../../../app');
const loginHelper = require('../helper/login-helper');

chai.use(chaiHttp);

describe('forcePasswordChange tests', function test() {
	before(function (done) {
		this.server = app.listen(3031);
		this.server.once('listening', () => {
			loginHelper.login(app).then(res => {
				this.agent = res.agent;
				done();
			});
		});
	});

	after(function (done) {
		this.server.close(done);
	});

	it('GET /forcePasswordChange', function () {
		return new Promise((resolve, reject) => {
			this.agent
				.get('/forcePasswordChange')
				.end((err, res) => {
					expect(res.statusCode).to.equal(200);
					expect(res.redirects[0].endsWith('/dashboard')).to.equal(true);
					resolve();
				});
		});
	});
});
