

const assert = require('assert');
const chai = require('chai');

const { expect } = chai;
const chaiHttp = require('chai-http');
const app = require('../../../app');
const loginHelper = require('../helper/login-helper');

chai.use(chaiHttp);

describe('Login tests', () => {
	before(function (done) {
		this.server = app.listen(3031);
		this.server.once('listening', () => done());
	});

	after(function (done) {
		this.server.close(done);
	});

	it('GET /login', () => new Promise((resolve, reject) => {
		chai.request(app)
			.get('/login/')
			.end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain('Schul-Cloud');
				expect(res.text).to.contain('E-Mail / Nutzername');
				expect(res.text).to.contain('Passwort');
				resolve();
			});
	}));

	it.skip('POST /login', () => loginHelper.login(app).then((result) => {
		expect(result.res).to.redirect;
		expect(result.res.statusCode).to.equal(200);
		expect(result.res.text).to.contain('Übersicht');
		expect(result.res.text).to.contain('Marla Mathe');
		expect(result.res.text).to.contain('Schüler');
	}));
});
