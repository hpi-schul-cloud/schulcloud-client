const chai = require('chai');

const { expect } = chai;
const chaiHttp = require('chai-http');
const app = require('../../../app');
const loginHelper = require('../helper/login-helper');

chai.use(chaiHttp);

describe('Courses tests', () => {
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

	it('GET /courses', () => new Promise((resolve) => {
		this.agent
			.get('/courses/')
			.end((err, res) => {
				expect(res.redirects[0].endsWith('/rooms-overview'));
				resolve();
			});
	}));
});
