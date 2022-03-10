
const assert = require('assert');
const chai = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { expect } = chai;
const chaiHttp = require('chai-http');
const app = require('../../../app');
const loginHelper = require('../helper/login-helper');
const { i18next } = require('../../../helpers/i18n');

chai.use(chaiHttp);

describe('Login tests', () => {
	before(function (done) {
		this.server = app.listen(3031);
		this.server.once('listening', () => done());
	});

	after(function (done) {
		this.server.close(done);
	});

	it('GET /login', () => new Promise((resolve) => {
		chai.request(app)
			.get('/login/')
			.end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain('Schul-Cloud');
				expect(res.text).to.contain(i18next.t('login.input.emailUsername'));
				expect(res.text).to.contain(i18next.t('global.input.password'));
				resolve();
			});
	}));

	it.skip('POST /login', () => loginHelper.login(app).then((result) => {
		expect(result.res).to.redirect;
		expect(result.res.statusCode).to.equal(200);
		expect(result.res.text).to.contain(i18next.t('global.link.overview'));
		expect(result.res.text).to.contain('Marla Mathe');
		expect(result.res.text).to.contain(i18next.t('global.placeholder.Schüler'));
	}));

	it('login via schoolserver button is not displayed ', () => new Promise((resolve) => {
		const configBefore = Configuration.toObject({ plainSecrets: true });
		Configuration.set('FEATURE_OAUTH_LOGIN_ENABLED', false);
		chai.request(app)
			.get('/login')
			.end((err, res) => {
				expect(res.text).not.contain(i18next.t('login.oauth2.headline.loginIserv'));
				Configuration.reset(configBefore);
				resolve();
			});
	}));
});
