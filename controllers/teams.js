const _ = require('lodash');
const express = require('express');
const moment = require('moment');
const winston = require('winston');

const authHelper = require('../helpers/authentication');
const recurringEventsHelper = require('../helpers/recurringEvents');
const permissionHelper = require('../helpers/permissions');
const api = require('../api');

const router = express.Router();
moment.locale('de');


const logger = winston.createLogger({
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
			),
		}),
	],
});

const addThumbnails = (file) => {
	const thumbs = {
		default: '/images/thumbs/default.png',
		psd: '/images/thumbs/psds.png',
		txt: '/images/thumbs/txts.png',
		doc: '/images/thumbs/docs.png',
		png: '/images/thumbs/pngs.png',
		mp4: '/images/thumbs/mp4s.png',
		mp3: '/images/thumbs/mp3s.png',
		aac: '/images/thumbs/aacs.png',
		avi: '/images/thumbs/avis.png',
		gif: '/images/thumbs/gifs.png',
		html: '/images/thumbs/htmls.png',
		js: '/images/thumbs/jss.png',
		mov: '/images/thumbs/movs.png',
		xls: '/images/thumbs/xlss.png',
		xlsx: '/images/thumbs/xlss.png',
		pdf: '/images/thumbs/pdfs.png',
		flac: '/images/thumbs/flacs.png',
		jpg: '/images/thumbs/jpgs.png',
		jpeg: '/images/thumbs/jpgs.png',
		docx: '/images/thumbs/docs.png',
		ai: '/images/thumbs/ais.png',
		tiff: '/images/thumbs/tiffs.png',
	};

	if (!file.isDirectoy) {
		const ending = file.name.split('.').pop();
		file.thumbnail = thumbs[ending.toLowerCase()] || thumbs.default;
	}
	return file;
};

const getSelectOptions = (req, service, query, values = []) => {
	return api(req).get(`/${service}`, {
		qs: query,
	}).then((data) => {
		return data.data;
	});
};

/**
 * Deletes all events from the given course, clear function
 * @param teamId {string} - the id of the course the events will be deleted
 */
const deleteEventsForTeam = async (req, res, teamId) => {
	if (process.env.CALENDAR_SERVICE_ENABLED) {
		let events = await api(req).get('/calendar/', {
			qs: {
				'scope-id': teamId,
			},
		});

		for (let event of events) {
			try {
				await api(req).delete(`/calendar/${event._id}`);
			} catch (e) {
				res.sendStatus(500);
			}
		}
	}
};

const markSelected = (options, values = []) => {
	return options.map((option) => {
		option.selected = values.includes(option._id);
		return option;
	});
};

const editTeamHandler = (req, res, next) => {
	let teamPromise; let action; let method;
	if (req.params.teamId) {
		action = `/teams/${req.params.teamId}`;
		method = 'patch';
		teamPromise = api(req).get(`/teams/${req.params.teamId}`);
	} else {
		action = '/teams/';
		method = 'post';
		teamPromise = Promise.resolve({});
	}

	teamPromise.then((team) => {
		res.render('teams/edit-team', {
			action,
			method,
			title: req.params.teamId ? 'Team bearbeiten' : 'Team anlegen',
			submitLabel: req.params.teamId ? 'Änderungen speichern' : 'Team anlegen',
			closeLabel: 'Abbrechen',
			team,
			schoolData: res.locals.currentSchoolData,
		});
	});
};

const copyCourseHandler = (req, res, next) => {
	let coursePromise; let action; let method;
	if (req.params.teamId) {
		action = `/teams/copy/${req.params.teamId}`;
		method = 'post';
		coursePromise = api(req).get(`/teams/${req.params.teamId}`, {
			qs: {
				$populate: ['ltiToolIds', 'classIds', 'teacherIds', 'userIds', 'substitutionIds'],
			},
		});
	} else {
		action = '/teams/copy';
		method = 'post';
		coursePromise = Promise.resolve({});
	}

	const classesPromise = getSelectOptions(req, 'classes', { $limit: 1000 });
	const teachersPromise = getSelectOptions(req, 'users', { roles: ['teacher', 'demoTeacher'], $limit: 1000 });
	const studentsPromise = getSelectOptions(req, 'users', { roles: ['student', 'demoStudent'], $limit: 1000 });

	Promise.all([
		coursePromise,
		classesPromise,
		teachersPromise,
		studentsPromise,
	]).then(([course, classes, teachers, students]) => {
		classes = classes.filter(c => c.schoolId == res.locals.currentSchool);
		teachers = teachers.filter(t => t.schoolId == res.locals.currentSchool);
		students = students.filter(s => s.schoolId == res.locals.currentSchool);
		let substitutions = _.cloneDeep(teachers);

		// map course times to fit into UI
		(course.times || []).forEach((time, count) => {
			time.duration = time.duration / 1000 / 60;
			const duration = moment.duration(time.startTime);
			time.startTime = `${('00' + duration.hours()).slice(-2)}:${('00' + duration.minutes()).slice(-2)}`;
			time.count = count;
		});

		// format course start end until date
		if (course.startDate) {
			course.startDate = moment(new Date(course.startDate).getTime()).format('DD.MM.YYYY');
			course.untilDate = moment(new Date(course.untilDate).getTime()).format('DD.MM.YYYY');
		}

		// preselect current teacher when creating new course
		if (!req.params.teamId) {
			course.teacherIds = [];
			course.teacherIds.push(res.locals.currentUser);
		}

		course.name = `${course.name} - Kopie`;

		res.render('teams/edit-course', {
			action,
			method,
			title: 'Kurs klonen',
			submitLabel: 'Kurs klonen',
			closeLabel: 'Abbrechen',
			course,
			classes,
			teachers: markSelected(teachers, _.map(course.teacherIds, '_id')),
			substitutions,
			students,
		});
	});
};

// secure routes
router.use(authHelper.authChecker);

/*
 * Teams
 */

router.get('/', async (req, res, next) => {
	let teams = await api(req).get('/teams/', {
		qs: {
			userIds: {
				$elemMatch: { userId: res.locals.currentUser._id },
			},
			$limit: false,
		},
	});

	teams = teams.data.map((team) => {
		team.url = `/teams/${team._id}`;
		team.title = team.name;
		team.content = (team.description || '').substr(0, 140);
		team.secondaryTitle = '';
		team.background = team.color;
		team.memberAmount = team.userIds.length;
		(team.times || []).forEach((time) => {
			time.startTime = moment(time.startTime, 'x').utc().format('HH:mm');
			time.weekday = recurringEventsHelper.getWeekdayForNumber(time.weekday);
			team.secondaryTitle += `<div>${time.weekday} ${time.startTime} ${(time.room) ? (`| ${time.room}`) : ''}</div>`;
		});

		return team;
	});

	let teamInvitations = (await api(req).get('/teams/extern/get/')).data;

	teamInvitations = teamInvitations.map((team) => {
		team.title = team.name;
		team.content = (team.description || '').substr(0, 140);
		team.secondaryTitle = '';
		team.background = team.color;
		team.memberAmount = team.userIds.length;
		team.id = team._id;

		return team;
	});

	if (req.query.json) {
		res.json(teams);
	} else {
		res.render('teams/overview', {
			title: 'Meine Teams',
			teams,
			teamInvitations,
			// substitutionCourses,
			searchLabel: 'Suche nach Teams',
			searchAction: '/teams',
			showSearch: true,
			liveSearch: true,
		});
	}
	// });
});

router.post('/', async (req, res, next) => {
	// map course times to fit model
	(req.body.times || []).forEach((time) => {
		time.startTime = moment.duration(time.startTime, 'HH:mm').asMilliseconds();
		time.duration = time.duration * 60 * 1000;
	});

	req.body.startDate = moment(req.body.startDate, 'DD:MM:YYYY')._d;
	req.body.untilDate = moment(req.body.untilDate, 'DD:MM:YYYY')._d;

	if (!(moment(req.body.startDate, 'YYYY-MM-DD').isValid()))
		delete req.body.startDate;
	if (!(moment(req.body.untilDate, 'YYYY-MM-DD').isValid()))
		delete req.body.untilDate;

	if (req.body.rocketchat === 'true') {
		req.body.features = ['rocketChat'];
	}
	delete req.body.rocketchat;

	api(req).post('/teams/', {
		json: req.body, // TODO: sanitize
	}).then((course) => {
		res.redirect(`/teams/${course._id}`);
	}).catch((err) => {
		logger.warn(err); // todo add req.body
		res.sendStatus(500);
	});
});

router.post('/copy/:teamId', (req, res, next) => {
	// map course times to fit model
	(req.body.times || []).forEach((time) => {
		time.startTime = moment.duration(time.startTime, 'HH:mm').asMilliseconds();
		time.duration = time.duration * 60 * 1000;
	});

	req.body.startDate = moment(req.body.startDate, 'DD:MM:YYYY')._d;
	req.body.untilDate = moment(req.body.untilDate, 'DD:MM:YYYY')._d;

	if (!(moment(req.body.startDate, 'YYYY-MM-DD').isValid()))
		delete req.body.startDate;
	if (!(moment(req.body.untilDate, 'YYYY-MM-DD').isValid()))
		delete req.body.untilDate;

	req.body._id = req.params.teamId;

	api(req).post('/teams/copy/', {
		json: req.body, // TODO: sanitize
	}).then((course) => {
		res.redirect(`/teams/${course._id}`);
	}).catch((err) => {
		res.sendStatus(500);
	});
});

router.get('/add/', editTeamHandler);


/*
 * Single Course
 */

function mapPermissionRoles(permissions, roles) {
	return permissions.map((permission) => {
		const role = roles.find(role => role._id === permission.refId);
		permission.roleName = role ? role.name : '';
		return permission;
	});
}

router.get('/:teamId/json', (req, res, next) => {
	Promise.all([
		api(req).get('/roles', {
			qs: {
				name: {
					$regex: '^team',
				},
			},
		}),
		api(req).get(`/teams/${req.params.teamId}`, {
			qs: {
				$populate: ['ltiToolIds'],
			},
		}),
		api(req).get('/lessons/', {
			qs: {
				teamId: req.params.teamId,
			},
		}),
	]).then(([result, team, lessons]) => {
		const { data: roles } = result;

		team.filePermission = team.filePermission.map((permission) => {
			const role = roles.find(role => role._id === permission.refId);
			permission.roleName = role ? role.name : '';
			return permission;
		});


		res.json({ team, lessons });
	}).catch((e) => {
		logger.warn(e);
		res.sendStatus(500);
	});
});

router.get('/:teamId/usersJson', (req, res, next) => {
	Promise.all([
		api(req).get(`/teams/${req.params.teamId}`, {
			qs: {
				$populate: ['userIds.userId'],
			},
		}),
	]).then(([course]) => res.json({ course }));
});

router.get('/:teamId', async (req, res, next) => {
	const isAllowed = (permissions, role) => {
		const permission = permissions.find(p => p.roleName === role);
		return Object.keys(permission).every(p => permission[p]);
	};

	try {
		const roles = (await api(req).get('/roles', {
			qs: {
				name: {
					$regex: '^team',
				},
			},
		})).data;

		const course = await api(req).get(`/teams/${req.params.teamId}`, {
			qs: {
				$populate: [
					'ltiToolIds',
				],
			},
		});

		const instanceUsesRocketChat = process.env.ROCKETCHAT_SERVICE_ENABLED;
		const courseUsesRocketChat = course.features.includes('rocketChat');
		const schoolUsesRocketChat = (res.locals.currentSchoolData.features || []).includes('rocketChat');

		let rocketChatCompleteURL;
		if (instanceUsesRocketChat && courseUsesRocketChat && schoolUsesRocketChat) {
			try {
				const rocketChatChannel = await api(req).get(`/rocketChat/channel/${req.params.teamId}`);
				const rocketChatURL = process.env.ROCKET_CHAT_URI
				rocketChatCompleteURL = `${rocketChatURL}/group/${rocketChatChannel.channelName}`;
			}
			catch (e) {
				logger.warn(e);
				rocketChatCompleteURL = undefined;
			}
		}

		course.filePermission = mapPermissionRoles(course.filePermission, roles);

		const allowExternalExperts = isAllowed(course.filePermission, 'teamexpert');
		const allowTeamMembers = isAllowed(course.filePermission, 'teammember');


		let files; let directories;

		files = await api(req).get('/fileStorage', {
			qs: {
				owner: course._id,
			},
		});
		/* note: fileStorage can return arrays and error objects */
		if (!Array.isArray(files)) {
			if ((files || {}).code) {
				logger.warn(files);
			}
			files = [];
		}

		files = files.filter(file => file);

		files = files.map((file) => {
			if (file && file.permissions) {
				file.permissions = mapPermissionRoles(file.permissions, roles);
				return file;
			} else {
				return undefined;
			}
		});

		directories = files.filter(f => f.isDirectory);
		files = files.filter(f => !f.isDirectory);

		// Sort by most recent files and limit to 6 files
		files.sort(function (a, b) {
			if (b && b.updatedAt && a && a.updatedAt) {
				return new Date(b.updatedAt) - new Date(a.updatedAt);
			} else {
				return 0;
			}
		})
			.slice(0, 6);

		files.map(addThumbnails);

		directories.sort(function (a, b) {
			if (b && b.updatedAt && a && a.updatedAt) {
				return new Date(b.updatedAt) - new Date(a.updatedAt);
			} else {
				return 0;
			}
		})
			.slice(0, 6);

		let news = (await api(req).get('/news/', {
			qs: {
				target: req.params.teamId,
				$limit: 6,
			},
		})).data;

		const colors = ['F44336', 'E91E63', '3F51B5', '2196F3', '03A9F4', '00BCD4', '009688', '4CAF50', 'CDDC39', 'FFC107', 'FF9800', 'FF5722'];
		news = news.map((news) => {
			news.url = `/teams/${req.params.teamId}/news/${news._id}`;
			news.secondaryTitle = moment(news.displayAt).fromNow();
			news.background = `#${colors[(news.title || '').length % colors.length]}`;
			return news;
		});

		let events = [];

		try {
			events = await api(req).get('/calendar/', {
				qs: {
					'scope-id': req.params.teamId,
					all: true,
				},
			});

			events = events.map((event) => {
				let start = moment(event.start);
				let end = moment(event.end);
				event.day = start.format('D');
				event.month = start.format('MMM').toUpperCase().split('.').join('');
				event.dayOfTheWeek = start.format('dddd');
				event.fromTo = `${start.format('hh:mm')} - ${end.format('hh:mm')}`;
				return event;
			});
		} catch (e) {
			events = [];
		}

		let test = course.user.permissions.includes('EDIT_ALL_FILES')

		res.render('teams/team', Object.assign({}, course, {
			title: course.name,
			breadcrumb: [{
				title: 'Meine Teams',
				url: '/teams',
			},
			{},
			],
			permissions: course.user.permissions,
			course,
			events,
			directories,
			files,
			filesUrl: `/files/teams/${req.params.teamId}`,
			ownerId: req.params.teamId,
			canUploadFile: true,
			canCreateDir: true,
			canCreateFile: true,
			canEditPermissions: course.user.permissions.includes('EDIT_ALL_FILES'),
			createEventAction: `/teams/${req.params.teamId}/events/`,
			allowExternalExperts: allowExternalExperts ? 'checked' : '',
			allowTeamMembers: allowTeamMembers ? 'checked' : '',
			defaultFilePermissions: [],
			news,
			nextEvent: recurringEventsHelper.getNextEventForCourseTimes(course.times),
			userId: res.locals.currentUser._id,
			teamId: req.params.teamId,
			rocketChatURL: rocketChatCompleteURL,
		}));
	} catch (e) {
		next(e);
	}
});

router.get('/:teamId/edit', editTeamHandler);

router.get('/:teamId/copy', copyCourseHandler);

router.patch('/:teamId', async (req, res, next) => {
	// map course times to fit model
	req.body.times = req.body.times || [];
	req.body.times.forEach((time) => {
		time.startTime = moment.duration(time.startTime).asMilliseconds();
		time.duration = time.duration * 60 * 1000;
	});

	req.body.startDate = moment(req.body.startDate, 'DD:MM:YYYY')._d;
	req.body.untilDate = moment(req.body.untilDate, 'DD:MM:YYYY')._d;

	if (!(moment(req.body.startDate, 'YYYY-MM-DD').isValid()))
		delete req.body.startDate;
	if (!(moment(req.body.untilDate, 'YYYY-MM-DD').isValid()))
		delete req.body.untilDate;

	// first delete all old events for the course
	// deleteEventsForCourse(req, res, req.params.teamId).then(async _ => {

	const currentTeamState = await api(req).get(`/teams/${req.params.teamId}`);
	const isChatAllowed = (currentTeamState.features || []).includes('rocketChat');
	if (!isChatAllowed && req.body.rocketchat === 'true') {
		// add rocketChat feature
		await api(req).patch(`/teams/${req.params.teamId}`, {
			json: {
				$push: {
					features: 'rocketChat',
				},
			},
		});
	} else if (isChatAllowed && req.body.rocketchat !== 'true') {
		// remove rocketChat feature
		await api(req).patch(`/teams/${req.params.teamId}`, {
			json: {
				$pull: {
					features: 'rocketChat',
				},
			},
		});
	}
	delete req.body.rocketchat;

	await api(req).patch(`/teams/${req.params.teamId}`, {
		json: req.body, // TODO: sanitize
	});

	// await createEventsForCourse(req, res, courseUpdated);

	res.redirect(`/teams/${req.params.teamId}`);

	// }).catch(error => {
	//     res.sendStatus(500);
	// });
});

router.patch('/:teamId/permissions', (req, res) => {
	api(req).patch(`/teams/${req.params.teamId}`, {
		json: req.body,
	})
		.then(() => res.sendStatus(200))
		.catch((e) => {
			logger.warn(e);
			res.sendStatus(500);
		});
});

router.get('/:teamId/delete', async (req, res, next) => {
	try {
		await deleteEventsForTeam(req, res, req.params.teamId);
		res.sendStatus(200);
	} catch (e) {
		res.sendStatus(500);
	}
});

router.delete('/:teamId', async (req, res, next) => {
	try {
		await deleteEventsForTeam(req, res, req.params.teamId);
		await api(req).delete(`/teams/${req.params.teamId}`);

		res.sendStatus(200);
	} catch (e) {
		res.sendStatus(500);
	}
});

router.post('/:teamId/events/', (req, res, next) => {
	req.body.startDate = moment(req.body.startDate, 'DD.MM.YYYY HH:mm')._d.toLocalISOString();
	req.body.endDate = moment(req.body.endDate, 'DD.MM.YYYY HH:mm')._d.toLocalISOString();

	// filter params
	req.body.scopeId = req.params.teamId;
	req.body.teamId = req.params.teamId;

	api(req).post('/calendar/', { json: req.body }).then((event) => {
		res.redirect(`/teams/${req.params.teamId}`);
	});
});

router.put('/events/:eventId', (req, res, next) => {
	req.body.startDate = moment(req.body.startDate, 'DD.MM.YYYY HH:mm')._d.toLocalISOString();
	req.body.endDate = moment(req.body.endDate, 'DD.MM.YYYY HH:mm')._d.toLocalISOString();

	api(req).put(`/calendar/${req.params.eventId}`, {
		json: req.body,
	}).then((_) => {
		res.sendStatus(200);
	}).catch((err) => {
		next(err);
	});
});

router.get('/:teamId/news/new', async (req, res, next) => {
	res.redirect(`/news/new?context=teams&contextId=${req.params.teamId}`)
});

/*
 * Single Course Members
 */


router.get('/:teamId/members', async (req, res, next) => {
	const action = `/teams/${req.params.teamId}`;
	const { teamId } = req.params;
	const uri = `/teams/${teamId}`;
	const schoolId = res.locals.currentSchool;
	const $limit = false;
	const method = 'patch';

	const roleTranslations = {
		teammember: 'Teilnehmer',
		teamexpert: 'externer Experte',
		teamleader: 'Leiter',
		teamadministrator: 'Team-Admin',
		teamowner: 'Team-Admin (Eigentümer)',
	};

	const head = [
		'Vorname',
		'Nachname',
		'Rolle',
		'Schule',
		'Aktionen',
	];

	const headClasses = [
		'Name',
		'Schüler',
		'Aktionen',
	];

	const headInvitations = [
		'E-Mail',
		'Eingeladen am',
		'Rolle',
		'Aktionen',
	];

	const invitationActions = [{
		class: 'btn-resend-invitation',
		title: 'Einladung erneut versenden',
		icon: 'envelope',
	}, {
		class: 'btn-delete-invitation',
		title: 'Einladung löschen',
		icon: 'trash',
	}];

	const getTeam = () => api(req).get(uri, {
		qs: {
			$populate: [
				{
					path: 'schoolIds',
				},
				{
					path: 'userIds.userId',
					populate: ['schoolId'],
				},
				{ path: 'userIds.role' },
				{ path: 'userIds.schoolId' },
				{
					path: 'classIds',
					populate: ['year'],
				},
			],
			$limit,
		},
	}).then((team) => {
		if (team.classIds === undefined) {
			team.classIds = [];
		}
		team.classes = team.classIds; // only for fix
		return team;
	});

	const getUsers = () => api(req).get('/users', {
		qs: { schoolId, $limit },
	}).then(users => users.data);

	const getRoles = () => api(req).get('/roles', {
		qs: {
			name: {
				$in: ['teammember', 'teamexpert', 'teamleader',
					'teamadministrator', 'teamowner'],
			},
		},
	}).then((roles) => {
		roles = roles.data;
		return roles.map((role) => {
			role.label = roleTranslations[role.name];
			return role;
		});
	});

	const getClasses = () => api(req).get('/classes', {
		qs: { schoolId, $populate: ['year'], $limit },
	}).then((classes => classes.data));

	const getFederalStates = () => api(req).get('/federalStates').then(federalStates => federalStates.data);

	try {
		let [
			team,
			users,
			roles,
			classes,
			federalStates,
		] = await Promise.all([
			getTeam(), getUsers(), getRoles(), getClasses(), getFederalStates(),
		]).catch((err) => {
			throw new Error('Can not fetch the data', err);
		});

		const { permissions } = team.user || {};
		team.userIds = team.userIds.filter(user => user.userId !== null); // fix if user do not exist
		const teamUserIds = team.userIds.map(user => user.userId._id);
		users = users.filter(user => !teamUserIds.includes(user._id));
		const currentSchool = team.schoolIds.filter(s => s._id === schoolId)[0];
		const currentFederalStateId = currentSchool.federalState;

		const rolesExternal = [
			{
				name: 'teamexpert',
				label: 'externer Experte',
				_id: roles.find(role => role.name === 'teamexpert'),
			},
			{
				name: 'teamadministrator',
				label: 'Lehrer anderer Schule (Team-Admin)',
				_id: roles.find(role => role.name === 'teamadministrator'),
			},
		];

		const addButtonEdit = (actions = []) => {
			if (permissions.includes('CHANGE_TEAM_ROLES')) {
				actions.push({
					class: 'btn-edit-member',
					title: 'Rolle bearbeiten',
					icon: 'edit',
				});
			}
			return actions;
		};

		const addButtonTrash = (actions = []) => {
			if (permissions.includes('REMOVE_MEMBERS')) {
				actions.push({
					class: 'btn-delete-member',
					title: 'Nutzer entfernen',
					icon: 'trash',
				});
			}
			return actions;
		};

		const addButtonTrashClass = (actions = []) => {
			if (permissions.includes('REMOVE_MEMBERS')) {
				actions.push({
					class: 'btn-delete-class',
					title: 'Klasse entfernen',
					icon: 'trash',
				});
			}
			return actions;
		};

		const body = team.userIds.map(user => [
			user.userId.firstName || '',
			user.userId.lastName || '',
			roleTranslations[user.role.name],
			user.userId.schoolId.name || '',
			{
				payload: {
					userId: user.userId._id,
				},
			},
			addButtonTrash(addButtonEdit()),
		]);

		const bodyClasses = team.classes.map(c => [
			`${c.displayName || c.name} (${c.year ? c.year.name : ''})`,
			c.userIds.length,
			{
				payload: {
					classId: c._id,
				},
			},
			addButtonTrashClass(),
		]);

		const bodyInvitations = team.invitedUserIds.map(invitation => [
			invitation.email,
			moment(invitation.createdAt).format('DD.MM.YYYY'),
			roleTranslations[invitation.role],
			{
				payload: {
					email: invitation.email,
				},
			},
			invitationActions,
		]);

		res.render('teams/members', Object.assign({}, team, {
			title: 'Deine Team-Teilnehmer',
			action,
			classes,
			addMemberAction: `${uri}/members`,
			inviteExternalMemberAction: `${uri}/members/external`,
			deleteMemberAction: `${uri}/members`,
			deleteInvitationAction: `${uri}/invitation`,
			resendInvitationAction: `${uri}/invitation`,
			permissions: team.user.permissions,
			method,
			head,
			body,
			headClasses,
			bodyClasses,
			roles,
			rolesExternal,
			headInvitations,
			bodyInvitations,
			users,
			federalStates,
			currentFederalState: currentFederalStateId,
			breadcrumb: [{
				title: 'Meine Teams',
				url: '/teams',
			},
			{
				title: team.name,
				url: uri,
			},
			{},
			],
		}));
	} catch (err) {
		logger.warn('Can not fetch, or render get teams/members', err);
		next(err);
	}
});

router.post('/:teamId/members', async (req, res, next) => {
	try {
		const courseOld = await api(req).get(`/teams/${req.params.teamId}`);
		let userIds = courseOld.userIds.concat(req.body.userIds);
		let classIds = req.body.classIds;

		await api(req).patch(`/teams/${req.params.teamId}`, {
			json: {
				classIds,
				userIds,
			},
		});

		res.sendStatus(200);
	} catch (e) {
		console.log(e);
	}
});

router.patch('/:teamId/members', async (req, res, next) => {
	try {
		const team = await api(req).get(`/teams/${req.params.teamId}`);
		const userIds = team.userIds.map((user) => {
			if (user.userId === req.body.user.userId) {
				user.role = req.body.user.role;
			}
			return user;
		});

		await api(req).patch(`/teams/${req.params.teamId}`, {
			json: {
				userIds,
			},
		});

		res.sendStatus(200);
	} catch (e) {
		console.log(e);
	}
});

router.post('/external/invite', (req, res) => {
	const json = {
		userId: req.body.userId,
		email: req.body.email,
		role: req.body.role,
	};

	return api(req).patch(`/teams/extern/add/${req.body.teamId}`, {
		json,
	}).then((result) => {
		res.sendStatus(200);
	}).catch((error) => {
		res.sendStatus(500);
	});
});

router.delete('/:teamId/members', async (req, res, next) => {
	const courseOld = await api(req).get(`/teams/${req.params.teamId}`);
	let userIds = courseOld.userIds.filter(user => user.userId !== req.body.userIdToRemove);
	let classIds = courseOld.classIds.filter(_class => _class !== req.body.classIdToRemove);

	await api(req).patch(`/teams/${req.params.teamId}`, {
		json: {
			userIds,
			classIds,
		},
	});

	res.sendStatus(200);
});

router.patch('/:teamId/invitation', async (req, res, next) => {
	try {
		await api(req).patch(`/teams/extern/add/${req.params.teamId}`, {
			json: {
				email: req.body.email,
			},
		});
		res.sendStatus(200);
	} catch (e) {
		res.sendStatus(500);
	}
});

router.delete('/:teamId/invitation', async (req, res, next) => {
	try {
		await api(req).patch(`/teams/extern/remove/${req.params.teamId}`, {
			json: {
				email: req.body.email,
			},
		});
		res.sendStatus(200);
	} catch (e) {
		res.sendStatus(500);
	}
});

router.get('/invitation/accept/:teamId', async (req, res, next) => {
	await api(req).get(`/teams/extern/accept/${req.params.teamId}`).then(() => {
		req.session.notification = { type: 'success', message: 'Teameinladung erfolgreich angenommen.' };
		res.redirect(`/teams/${req.params.teamId}`);
	}).catch((err) => {
		logger.warn('Fehler beim Annehmen einer Einladung, der Nutzer hat nicht die Rechte oder ist schon Mitglied des Teams. ', err);
		res.redirect('/teams/');
	});
});

/*
 * Single Team Topics, Tools & Lessons
 */

router.get('/:teamId/topics', async (req, res, next) => {
	Promise.all([
		api(req).get(`/teams/${req.params.teamId}`, {
			qs: {
				$populate: ['ltiToolIds'],
			},
		}),
		api(req).get('/lessons/', {
			qs: {
				teamId: req.params.teamId,
				$sort: 'position',
			},
		}),
		api(req).get('/homework/', {
			qs: {
				teamId: req.params.teamId,
				$populate: ['teamId'],
				archived: { $ne: res.locals.currentUser._id },
			},
		}),
		api(req).get('/courseGroups/', {
			qs: {
				teamId: req.params.teamId,
				$populate: ['teamId', 'userIds'],
			},
		}),
	]).then(([course, lessons, homeworks, courseGroups]) => {
		let ltiToolIds = (course.ltiToolIds || []).filter(ltiTool => ltiTool.isTemplate !== 'true');
		lessons = (lessons.data || []).map((lesson) => {
			return Object.assign(lesson, {
				url: `/teams/${req.params.teamId}/topics/${lesson._id}/`,
			});
		});

		homeworks = (homeworks.data || []).map((assignment) => {
			assignment.url = `/homework/${assignment._id}`;
			return assignment;
		});

		homeworks.sort((a, b) => {
			if (a.dueDate > b.dueDate) {
				return 1;
			} else {
				return -1;
			}
		});

		courseGroups = permissionHelper.userHasPermission(res.locals.currentUser, 'COURSE_EDIT') ?
			courseGroups.data || [] :
			(courseGroups.data || []).filter(cg => cg.userIds.some(user => user._id === res.locals.currentUser._id));

		res.render('teams/topics', Object.assign({}, course, {
			title: course.name,
			lessons,
			homeworks: homeworks.filter(function (task) { return !task.private; }),
			myhomeworks: homeworks.filter(function (task) { return task.private; }),
			ltiToolIds,
			courseGroups,
			breadcrumb: [{
				title: 'Meine Teams',
				url: '/teams',
			},
			{
				title: course.name,
				url: `/teams/${course._id}`,
			},
			{},
			],
			filesUrl: `/files/teams/${req.params.teamId}`,
			nextEvent: recurringEventsHelper.getNextEventForCourseTimes(course.times),
		}));
	}).catch((err) => {
		next(err);
	});
});

router.patch('/:teamId/positions', (req, res, next) => {
	for (var elem in req.body) {
		api(req).patch(`/lessons/${elem}`, {
			json: {
				position: parseInt(req.body[elem]),
				teamId: req.params.teamId,
			},
		});
	}

	res.sendStatus(200);
});

router.post('/:teamId/importTopic', (req, res, next) => {
	let shareToken = req.body.shareToken;
	// try to find topic for given shareToken
	api(req).get('/lessons/', { qs: { shareToken, $populate: ['teamId'] } }).then((lessons) => {
		if ((lessons.data || []).length <= 0) {
			req.session.notification = {
				type: 'danger',
				message: 'Es wurde kein Thema für diesen Code gefunden.',
			};

			res.redirect(req.header('Referer'));
		}

		api(req).post('/lessons/copy', { json: { lessonId: lessons.data[0]._id, newTeamId: req.params.teamId, shareToken } })
			.then((_) => {
				res.redirect(req.header('Referer'));
			});
	}).catch(err => res.status((err.statusCode || 500)).send(err));
});

// return shareToken
router.get('/:id/share', (req, res, next) => {
	return api(req).get(`/teams/share/${req.params.id}`)
		.then((course) => {
			return res.json(course);
		});
});

// return course Name for given shareToken
router.get('/share/:id', (req, res, next) => {
	return api(req).get('/teams/share', { qs: { shareToken: req.params.id } })
		.then((name) => {
			return res.json({ msg: name, status: 'success' });
		})
		.catch((err) => {
			return res.json({ msg: 'ShareToken is not in use.', status: 'error' });
		});
});

router.post('/import', (req, res, next) => {
	let shareToken = req.body.shareToken;
	let courseName = req.body.name;

	api(req).post('/teams/share', { json: { shareToken, courseName } })
		.then((course) => {
			res.redirect(`/teams/${course._id}/edit/`);
		})
		.catch((err) => {
			res.status((err.statusCode || 500)).send(err);
		});
});

module.exports = router;
