const chai = require('chai');

const { expect } = chai;
const chaiHttp = require('chai-http');
const app = require('../../../app');
const loginHelper = require('../helper/login-helper');
const { i18next } = require('../../../helpers/i18n');

chai.use(chaiHttp);

describe('News tests', () => {
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

	it('GET /news', () => new Promise((resolve) => {
		this.agent
			.get('/news/?lng=de')
			.end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain(i18next.t('global.headline.news'));
				resolve();
			});
	}));
});
