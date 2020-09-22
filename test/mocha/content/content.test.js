const { Configuration } = require('@schul-cloud/commons');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../app');

const { expect } = chai;
const loginHelper = require('../helper/login-helper');

chai.use(chaiHttp);

const { i18next } = require('../../../helpers/i18n');

const expectedStringContentStore = i18next.t('content.headline.contentStore');
const expectedStringResultsFound = i18next.t(
	'content.headline.nSearchResultsFoundWith',
	{ searchResultsTotal: '', query: 'Mathe' }
).trim();
const expectedStringNoResultsFound = i18next.t('content.headline.noResultsFoundWith', { query: 'Mathe' });

describe('Content tests', () => {
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

	it('GET /content', () => {
		expect(Configuration.get('LERNSTORE_MODE'), 'LERNSTORE_MODE not set!').to.be.not.equal('DISABLED');
		return new Promise((resolve) => {
			this.agent
				.get('/content/')
				.end((err, res) => {
					expect(res.statusCode).to.equal(200);
					expect(res.text).to.contain(expectedStringContentStore);
					resolve();
				});
		});
	});

	it('GET /content/?q=Mathe', () => {
		expect(Configuration.get('LERNSTORE_MODE'), 'LERNSTORE_MODE not set!').to.be.not.equal('DISABLED');
		return new Promise((resolve) => {
			this.agent
				.get('/content/?q=Mathe')
				.end((err, res) => {
					expect(res.statusCode).to.equal(200);
					expect(res.text).to.contain(expectedStringContentStore);
					expect(res.text).to.contain(expectedStringResultsFound);
					expect(res.text).not.to.contain(expectedStringNoResultsFound);
					resolve();
				});
		});
	});
});
