
const assert = require('assert');
const app = require('../../../app');
const chai = require('chai');

const { expect } = chai;
const chaiHttp = require('chai-http');
const { logger } = require('handlebars');
const { logError } = require('gulp-sass');
const loginHelper = require('../helper/login-helper');

chai.use(chaiHttp);

describe('Content tests', () => {
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

	it.only('GET /content', function () {
		return new Promise((resolve, reject) => {
			this.agent
				.get('/content/')
				.end((err, res) => {
					if (err) logger.ERROR(err);
					logger.INFO(res);
					expect(res.statusCode).to.equal(200);
					expect(res.text).to.contain('Lern-Store');
					resolve();
				});
		});
	});

	it('GET /content/?q=Mathe', function () {
		return new Promise((resolve, reject) => {
			this.agent
				.get('/content/?q=Mathe')
				.end((err, res) => {
					expect(res.statusCode).to.equal(200);
					expect(res.text).to.contain('Lern-Store');
					expect(res.text).to.contain('Suchergebnisse für "Mathe"');
					expect(res.text).not.to.contain('keine Ergebnisse');
					resolve();
				});
		});
	});
});
