const fs = require('fs');
const path = require('path');
const vm = require('vm');
const express = require('express');
const url = require('url');
const shortid = require('shortid');
const lodash = require('lodash');
const { expect } = require('chai');

const loadController = (name, dependencies, fallback) => {
	const filename = path.resolve(__dirname, '../../../controllers', `${name}.js`);
	const controllerModule = { exports: {} };
	const controllerRequire = (dependency) => {
		if (Object.prototype.hasOwnProperty.call(dependencies, dependency)) {
			return dependencies[dependency];
		}
		if (fallback) return fallback(dependency);
		throw new Error(`Unexpected dependency: ${dependency}`);
	};
	vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
		module: controllerModule,
		require: controllerRequire,
	}, { filename });
	return controllerModule.exports;
};

const fileDependencies = (api) => ({
	express,
	url,
	shortid,
	lodash,
	'@hpi-schul-cloud/commons': { Configuration: { get: () => false } },
	'../api': api,
	'../helpers/authentication': { authChecker: (req, res, next) => next() },
	'../helpers/redirect': {},
	'../helpers': { logger: {} },
});

describe('Teams removal from legacy routing', () => {
	it('does not register Teams mounts and keeps independent routes', () => {
		const mounts = [];
		const imports = [];
		const router = { use: (...args) => mounts.push(args[0]) };
		loadController('index', {
			express: { Router: () => router },
			'../helpers/handlebars': { middleware: () => {} },
		}, (dependency) => {
			imports.push(dependency);
			return () => {};
		});
		expect(mounts.filter((entry) => typeof entry === 'string' && entry.startsWith('/teams'))).to.have.lengthOf(0);
		expect(imports).not.to.include('./teams');
		expect(mounts).to.include.members([
			'/courses/',
			'/courses/:courseId/topics/',
			'/courses/:courseId/groups/',
			'/files/',
			'/news/',
			'/calendar/',
		]);
	});

	it('keeps visibility editable without the old Teams account routes', () => {
		const router = loadController('account', {
			express,
			'../api': () => {},
			'../helpers/authentication': { authChecker: (req, res, next) => next() },
		});
		const routes = router.stack.filter((layer) => layer.route).map((layer) => layer.route);
		expect(routes.some((route) => route.path === '/visibility' && route.methods.post)).to.equal(true);
		expect(routes.some((route) => /teams|teamSettings/.test(route.path))).to.equal(false);
		expect(routes.some((route) => route.path === '/' && route.methods.get)).to.equal(true);
	});

	[
		{ discoverable: 'true', expected: true },
		{ discoverable: 'false', expected: false },
		{ discoverable: undefined, expected: null },
	].forEach(({ discoverable, expected }) => {
		it(`preserves the visibility value ${expected}`, async () => {
			let savedPath;
			let savedValue;
			let redirect;
			let reloaded = false;
			const router = loadController('account', {
				express,
				'../api': () => ({
					patch: (target, options) => {
						savedPath = target;
						savedValue = options.json.discoverable;
						return Promise.resolve();
					},
				}),
				'../helpers/authentication': {
					authChecker: (req, res, next) => next(),
					populateCurrentUser: () => { reloaded = true; },
				},
			});
			const route = router.stack.find((layer) => layer.route?.path === '/visibility').route;
			await route.stack[0].handle({ body: { discoverable } }, {
				locals: { currentUser: { _id: 'current-user' } },
				redirect: (target) => { redirect = target; },
			});
			expect(savedPath).to.equal('/users/current-user');
			expect(savedValue).to.equal(expected);
			expect(reloaded).to.equal(true);
			expect(redirect).to.equal('/account/');
		});
	});

	it('submits the account visibility form to the neutral route', () => {
		const template = fs.readFileSync(path.resolve(__dirname, '../../../views/account/settings.hbs'), 'utf8');
		expect(template).to.include('action="/account/visibility"');
		expect(template).not.to.include('/account/teamSettings');
	});

	it('keeps independent file routes without Teams or Nextcloud dependencies', () => {
		const router = loadController('files', fileDependencies(() => {}));
		const paths = router.stack.filter((layer) => layer.route).map((layer) => layer.route.path);
		expect(paths.some((entry) => entry.includes('/teams'))).to.equal(false);
		expect(paths).to.include.members(['/courses/', '/shared/', '/my/{:folderId}{/:subFolderId}']);
	});

	it('hides old Teams events while preserving course and personal events', async () => {
		const events = [
			{ _id: 'team-event', 'x-sc-teamId': 'team' },
			{ _id: 'old-team-event', 'x-sc-teamid': 'team' },
			{ _id: 'course-event', 'x-sc-courseId': 'course' },
			{ _id: 'personal-event' },
		];
		const mapped = [];
		let response;
		const router = loadController('calendar', {
			express,
			'../api': () => ({ get: () => Promise.resolve(events) }),
			'../helpers/authentication': { authChecker: (req, res, next) => next() },
			'../helpers/timesHelper': {},
			'../helpers/recurringEvents': {
				mapEventProps: (event) => { mapped.push(event._id); return event; },
				mapRecurringEvent: (event) => [event],
			},
		});
		const route = router.stack.find((layer) => layer.route?.path === '/events/' && layer.route.methods.get).route;
		await route.stack[0].handle({}, { json: (value) => { response = value; } });
		expect(mapped).to.deep.equal(['course-event', 'personal-event']);
		expect(response.map((event) => event._id)).to.deep.equal(mapped);
	});

	it('rejects Teams event creation before calling the backend', () => {
		let status;
		const router = loadController('calendar', {
			express,
			'../api': () => { throw new Error('Teams must not call the backend'); },
			'../helpers/authentication': { authChecker: (req, res, next) => next() },
			'../helpers/timesHelper': {},
			'../helpers/recurringEvents': {},
		});
		const route = router.stack.find((layer) => layer.route?.path === '/events/' && layer.route.methods.post).route;
		route.stack[0].handle({ body: { teamId: 'team' } }, { sendStatus: (value) => { status = value; } });
		expect(status).to.equal(404);
	});

	it('keeps course administration without any Teams administration route', () => {
		const router = loadController('administration', {
			express,
			'@hpi-schul-cloud/commons': { Configuration: { get: () => undefined } },
			'../api': () => {},
			'../helpers/authentication': { authChecker: (req, res, next) => next() },
			'../helpers/permissions': { permissionsChecker: () => (req, res, next) => next() },
			'../helpers/recurringEvents': {},
			'../helpers/redirect': {},
			'../helpers/timesHelper': {},
			'../helpers/users': { isUserHidden: () => false },
			'../helpers/schoolHelper': () => {},
		}, require);
		const paths = router.stack.filter((layer) => layer.route).map((layer) => layer.route.path);
		expect(paths.some((entry) => entry.includes('/teams'))).to.equal(false);
		expect(paths).to.include('/courses/:id');
	});

	it('offers personal and course move targets without requesting Teams', async () => {
		const calls = [];
		let response;
		const router = loadController('files', fileDependencies(() => ({
			get: (target) => {
				calls.push(target);
				if (target === '/courses/') return Promise.resolve({ data: [{ _id: 'course', name: 'Course' }] });
				if (target === '/fileStorage/directories') return Promise.resolve([]);
				throw new Error(`Unexpected request: ${target}`);
			},
		})));
		const { route } = router.stack.find((layer) => layer.route?.path === '/permittedDirectories/');
		await route.stack[0].handle({}, {
			locals: { currentUser: { _id: 'current-user' } },
			$t: (key) => key,
			json: (value) => { response = value; },
		});
		expect(calls).to.deep.equal(['/courses/', '/fileStorage/directories']);
		expect(response.map((entry) => entry.model)).to.deep.equal(['user', 'course']);
	});

	it('keeps independent permission entries while hiding Teams roles', async () => {
		let response;
		const permissions = [
			{ name: 'teacher' },
			{ name: 'student' },
			{ name: 'teammember' },
			{ name: 'teamexpert' },
			{ name: 'teamleader' },
			{ name: 'teamadministrator' },
			{ name: 'teamowner' },
			{ name: 'Another user' },
		];
		const router = loadController('files', fileDependencies(() => ({
			get: () => Promise.resolve(permissions),
		})));
		const { route } = router.stack
			.find((layer) => layer.route?.path === '/permissions/' && layer.route.methods.get);
		await route.stack[0].handle({ query: { file: 'file' } }, { json: (value) => { response = value; } });
		expect(response.map((entry) => entry.name)).to.deep.equal(['teacher', 'student', 'Another user']);
	});

	['course', 'personal'].forEach((kind) => {
		it(`preserves ${kind} calendar event creation`, async () => {
			let saved;
			let redirect;
			const router = loadController('calendar', {
				express,
				'../api': () => ({ post: (target, options) => { saved = options.json; return Promise.resolve(); } }),
				'../helpers/authentication': { authChecker: (req, res, next) => next() },
				'../helpers/timesHelper': { dateTimeStringToMoment: (value) => ({ toISOString: () => value }) },
				'../helpers/recurringEvents': {},
			});
			const { route } = router.stack
				.find((layer) => layer.route?.path === '/events/' && layer.route.methods.post);
			await route.stack[0].handle({
				body: {
					startDate: 'start',
					endDate: 'end',
					scopeId: 'current-user',
					courseId: kind === 'course' ? 'course' : '',
				},
			}, { redirect: (target) => { redirect = target; } }, (error) => { throw error; });
			expect(saved.scopeId).to.equal(kind === 'course' ? 'course' : 'current-user');
			expect(saved).not.to.have.property('teamId');
			expect(redirect).to.equal('/calendar');
		});
	});

	['teams', 'schools', 'courses'].forEach((targetModel) => {
		it(`handles ${targetModel} news without rendering removed Teams content`, async () => {
			let status;
			let view;
			const router = loadController('news', {
				express,
				'../api': () => ({ get: () => Promise.resolve({ targetModel, title: 'News' }) }),
				'../helpers/authentication': { authChecker: (req, res, next) => next() },
				'../helpers/timesHelper': {},
			});
			const { route } = router.stack.find((layer) => layer.route?.path === '/:newsId');
			await route.stack[0].handle({ params: { newsId: 'news' } }, {
				sendStatus: (value) => { status = value; },
				render: (value) => { view = value; },
			}, (error) => { throw error; });
			expect(status).to.equal(targetModel === 'teams' ? 404 : undefined);
			expect(view).to.equal(targetModel === 'teams' ? undefined : 'news/article');
		});
	});

	['de', 'en', 'es', 'uk'].forEach((language) => {
		it(`keeps neutral visibility and group submissions in ${language}`, () => {
			const localePath = path.resolve(__dirname, `../../../locales/${language}.json`);
			const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
			expect(locale).not.to.have.property('teams');
			expect(locale.account).not.to.have.property('teams');
			expect(locale.account.visibility.label.optIn).to.be.a('string');
			expect(locale.account.visibility.label.optOut).to.be.a('string');
			expect(locale.courses.form_importCourse.text.aCourseFolderIsAutomaticallyCreated).to.be.a('string');
			expect(lodash.get(locale, 'homework._task.label.teamSubmission')).to.be.a('string');
			expect(locale.homework.label.selectTeamMembers).to.be.a('string');
			expect(locale.administration.controller.link.sendEntryToDevelopmentTeam).to.be.a('string');
		});
	});
});
