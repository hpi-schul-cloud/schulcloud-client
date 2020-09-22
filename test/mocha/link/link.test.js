const assert = require('assert');
const app = require('../../../app');
const chai = require('chai');

const { expect } = chai;
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

const { BACKEND_URL } = require('../../../config/global');

describe('Link tests', () => {
	before(function (done) {
		this.server = app.listen(3031);
		this.server.once('listening', () => {
			done();
		});
	});

	after(function (done) {
		this.server.close(done);
	});

	it('GET /link/:id', () => {
		const testId = 'sc42';
		return new Promise((resolve, reject) => {
			chai.request(app)
				.get(`/link/${testId}`)
				.end((err, res) => {
					// NOTE It is unclear why res.redirects is an array. However, to make the test agnostic, we loop through all

					expect(res.status).to.be.equal(404);
					resolve();
				});
		});
	});
});
