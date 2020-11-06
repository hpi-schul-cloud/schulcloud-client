const assert = require('assert');
const chai = require('chai');
const app = require('../../../app');

const { expect } = chai;
const chaiHttp = require('chai-http');
const loginHelper = require('../helper/login-helper');

chai.use(chaiHttp);
const { i18next } = require('../../../helpers/i18n');

describe('Dashboard tests', () => {
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

	it('GET /dashboard', function () {
		return new Promise((resolve) => {
			this.agent
				.get('/dashboard/')
				.end((err, res) => {
					expect(res.statusCode).to.equal(200);
					expect(res.text).to.contain(i18next.t('dashboard.headline.title'));
					expect(res.text).to.contain('Marla Mathe');
					expect(res.text).to.contain(i18next.t('global.placeholder.Schüler'));
					resolve();
				});
		});
	});

	it('GET /dashboard redirect to login if not logged in', () => new Promise((resolve) => {
		chai.request(app)
			.get('/dashboard/')
			.end((err, res) => {
				expect(res).to.redirect;
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain(i18next.t('home.header.link.login'));
				expect(res.text).to.contain(i18next.t('login.button.moreOptions'));
				resolve();
			});
	}));
});
