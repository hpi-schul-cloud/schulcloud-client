const assert = require('assert');
const app = require('../../../app');
const chai = require('chai');

const { expect } = chai;
const chaiHttp = require('chai-http');
const loginHelper = require('../helper/login-helper');

chai.use(chaiHttp);

const { i18next } = require('../../../helpers/i18n');

describe('Files tests', () => {
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

	it('GET /files/', function () {
		return new Promise((resolve, reject) => {
			this.agent.get('/files/').end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain(i18next.t('global.link.files'));
				expect(res.text).to.contain(i18next.t('files.label.myPersonalData'));
				expect(res.text).to.contain(i18next.t('global.link.courseData'));
				expect(res.text).to.contain(i18next.t('global.link.teamData'));
				resolve();
			});
		});
	});

	it('GET /files/my/', function () {
		return new Promise((resolve, reject) => {
			this.agent.get('/files/my/').end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain(i18next.t('global.headline.files'));
				expect(res.text).to.contain(i18next.t('files.text.storeFilesForUpload'));
				expect(res.text).to.contain(i18next.t('files.label.myPersonalData'));
				resolve();
			});
		});
	});

	it('GET /files/courses', function () {
		return new Promise((resolve, reject) => {
			this.agent.get('/files/courses/').end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain(i18next.t('files.label.filesFromMyCourse'));
				resolve();
			});
		});
	});

	it('GET /files/classes', function () {
		return new Promise((resolve, reject) => {
			this.agent.get('/files/classes/').end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain(i18next.t('files.label.filesFromMyClasses'));
				resolve();
			});
		});
	});
});
