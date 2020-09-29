const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../app');

const { expect } = chai;
const loginHelper = require('../helper/login-helper');

chai.use(chaiHttp);
const { i18next } = require('../../../helpers/i18n');

describe('Homework tests', () => {
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

	// OVERVIEW PAGES
	it('GET /homework', () => new Promise((resolve) => {
		this.agent
			.get('/homework/')
			.end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain(i18next.t('courses._course.tab_label.tasks'));
				expect(res.text).to.contain('Mathe');
				resolve();
			});
	}));
	it('GET /homework/asked', () => new Promise((resolve) => {
		this.agent
			.get('/homework/asked')
			.end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain(i18next.t('global.headline.assignedTasks'));
				expect(res.text).to.not.contain('btn btn-secondary btn-sm btn-edit');
				expect(res.text).to.not.contain('btn btn-secondary btn-sm btn-delete');
				resolve();
			});
	}));
	it('GET /homework/private', () => new Promise((resolve) => {
		this.agent
			.get('/homework/private')
			.end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain(i18next.t('global.link.tasksDrafts'));
				expect(res.text).to.contain('btn btn-secondary btn-sm btn-edit');
				expect(res.text).to.contain('btn btn-secondary btn-sm btn-delete');
				resolve();
			});
	}));
	it('GET /homework/archive', () => new Promise((resolve) => {
		this.agent
			.get('/homework/archive')
			.end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain(i18next.t('homework.headline.archivedTasks'));
				expect(res.text).to.contain(i18next.t('global.text.noTasks'));
				resolve();
			});
	}));
	// DETAIL VIEW
	it('GET /homework/{users private task}', () => new Promise((resolve) => {
		this.agent
			.get('/homework/59cce1d381297026d02cdc4b')
			.end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain('Private Aufgabe von Marla');
				resolve();
			});
	}));
	it('GET /homework/{users asked task}', () => new Promise((resolve) => {
		this.agent
			.get('/homework/59d1f63ce0a06325e8b5288b')
			.end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain('Aufgabe an Marla');
				resolve();
			});
	}));
	it('GET /homework/{teachers private task}', () => new Promise((resolve) => {
		this.agent
			.get('/homework/59cce4c3c6abf042248e888e')
			.end((err, res) => {
				expect(res.statusCode).to.not.equal(200);
				expect(res.text).to.not.contain('Private Aufgabe von Cord');
				resolve();
			});
	}));

	// CREATE & EDIT TASKS
	it('GET /homework/new', () => new Promise((resolve) => {
		this.agent
			.get('/homework/new')
			.end((err, res) => {
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain(i18next.t('global.button.addTask'));
				resolve();
			});
	}));
	// users task
	it('GET /homework/{users task}/edit', () => new Promise((resolve, reject) => {
		this.agent
			.get('/homework/59cce2c61113d1132c98dc06/edit')
			.end((err, res) => {
				if (err) reject(err);
				expect(res.statusCode).to.equal(200);
				expect(res.text).to.contain(i18next.t('homework._task.headline.editTask'));
				resolve();
			});
	}));
	// teachers task
	it('GET /homework/{teachers task}/edit', () => new Promise((resolve) => {
		this.agent
			.get('/homework/59cce3f6c6abf042248e888d/edit')
			.end((err, res) => {
				expect(res.statusCode).to.not.equal(200);
				expect(res.text).to.not.contain(i18next.t('homework._task.headline.editTask'));
				resolve();
			});
	}));
});
