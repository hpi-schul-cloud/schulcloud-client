const chai = require('chai');

const { expect } = chai;
const chaiHttp = require('chai-http');
const app = require('../../../app');

chai.use(chaiHttp);

describe.only('Link tests', () => {
	before((done) => {
		this.server = app.listen(3031);
		this.server.once('listening', () => {
			done();
		});
	});

	after((done) => {
		this.server.close(done);
	});

	it('GET /link/:id', () => {
		const testId = 'sc42';
		return new Promise((resolve) => {
			chai.request(app)
				.get(`/link/${testId}`)
				.end((err, res) => {
					// check that this link is redirected to error page
					expect(res.text).to.contain('Dieser Link existiert nicht.');
					resolve();
				});
		});
	});
});
