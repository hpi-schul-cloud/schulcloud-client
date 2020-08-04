/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../app');
const loginHelper = require('../helper/login-helper');

const { expect } = chai;
chai.use(chaiHttp);

const { SC_SUPERHERO_USER_NAME, SC_SUPERHERO_USER_PASSWORD } = require('../../../config/global');

describe('Superhero Log-in tests', function () {
	before(function (done) {
		this.server = app.listen(3031);
		this.server.once('listening', () => {
			done();
		});
	});

	after(function (done) {
		this.server.close(done);
	});

	// Log-in as superhero should be forbidden
	it('GET /login/superhero', function (done) {
		loginHelper.login(app, SC_SUPERHERO_USER_NAME, SC_SUPERHERO_USER_PASSWORD).then((response) => {
			expect(response.res.statusCode).to.equal(200);
			expect(response.res.text).to
				.contain('Du versuchst dich mit einem Superhero Account anzumelden.');
			done();
		});
	});
});
