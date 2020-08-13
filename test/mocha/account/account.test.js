const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../app');


const { expect } = chai;
const loginHelper = require('../helper/login-helper');

chai.use(chaiHttp);

describe('Account tests', () => {
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

	it('GET /account', () => new Promise((resolve) => {
		this.agent
			.get('/account/')
			.end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain('Dein Account');
				expect(res.text).to.not.contain('Vorname');
				expect(res.text).to.contain('Marla');
				expect(res.text).to.not.contain('Nachname');
				expect(res.text).to.contain('Mathe');
				resolve();
			});
	}));
});
