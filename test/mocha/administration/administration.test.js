const assert = require('assert');
const app = require('../../../app');
const chai = require('chai');

const { expect } = chai;
const chaiHttp = require('chai-http');
const loginHelper = require('../helper/login-helper');

chai.use(chaiHttp);

describe('Administration tests', () => {
	before(function (done) {
		this.server = app.listen(3031);
		this.server.once('listening', () => {
			loginHelper.login(app).then((res) => {
				this.agent = res.agent;
				done();
			});
		});
	});

	after(function (done) {
		this.server.close(done);
	});

	it('GET /administration should have no permission with logged in teacher', function () {
		return new Promise((resolve, reject) => {
			this.agent
				.get('/administration/')
				.end((err, res) => {
					expect(res.statusCode).to.equal(401);
					expect(res.text).to.contain('Not authorized');
					resolve();
				});
		});
	});
});
