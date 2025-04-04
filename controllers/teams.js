// jshint esversion: 8

const _ = require('lodash');
const express = require('express');
const moment = require('moment');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { decode } = require('html-entities');

const authHelper = require('../helpers/authentication');
const recurringEventsHelper = require('../helpers/recurringEvents');
const permissionHelper = require('../helpers/permissions');
const api = require('../api');
const { logger, formatError } = require('../helpers');
const timesHelper = require('../helpers/timesHelper');
const { makeNextcloudFolderName, useNextcloudFilesystem } = require('../helpers/nextcloud');
const { isUserHidden } = require('../helpers/users');

const router = express.Router();
moment.locale('de');

const OPTIONAL_TEAM_FEATURES = ['rocketChat', 'videoconference', 'messenger'];

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

const getSelectOptions = (req, service, query) => api(req)
	.get(`/${service}`, {
		qs: query,
	})
	.then((data) => data.data);

/**
 * Deletes all events from the given course, clear function
 * @param teamId {string} - the id of the course the events will be deleted
 */
const deleteEventsForTeam = async (req, res, teamId) => {
	if (Configuration.get('CALENDAR_SERVICE_ENABLED') === true) {
		const events = await api(req).get('/calendar/', {
			qs: {
				'scope-id': teamId,
			},
		});

		for (const event of events) {
			try {
				await api(req).delete(`/calendar/${event._id}`);
			} catch (e) {
				res.sendStatus(500);
			}
		}
	}
};

/**
 * Check if current user is teamowner and if also
 * other user is teamowner. Return false if only the
 * current user is teamowner
 *
 * @param {name: String, userId, role} current
 * @param {[{userId, role}]} others
 */
const checkIfUserCouldLeaveTeam = (current, others) => {
	if (current.name !== 'teamowner') {
		return true;
	}

	for (const user of others) {
		if (user.userId !== current.userId && user.role === current.role) {
			return true;
		}
	}

	return false;
};

const checkIfUserCanCreateTeam = (res) => {
	const roleNames = res.locals.currentUser.roles.map((role) => role.name);
	let allowedCreateTeam = false;
	if (roleNames.includes('administrator') || roleNames.includes('teacher') || roleNames.includes('student')) {
		allowedCreateTeam = true;
		const currentSchool = res.locals.currentSchoolData;
		if (roleNames.includes('student')
			&& !currentSchool.instanceFeatures.includes('isTeamCreationByStudentsEnabled')
		) {
			allowedCreateTeam = false;
		}
	}
	return allowedCreateTeam;
};

const markSelected = (options, values = []) => options.map((option) => {
	option.selected = values.includes(option._id);
	return option;
});

const editTeamHandler = async (req, res, next) => {
	let teamPromise;
	let action;
	let method;
	let permissions = [];
	if (req.params.teamId) {
		action = `/teams/${req.params.teamId}`;
		method = 'patch';
		teamPromise = api(req).get(`/teams/${req.params.teamId}`);
	} else {
		action = '/teams/';
		method = 'post';
		teamPromise = Promise.resolve({});
	}

	if (req.params.teamId) {
		try {
			permissions = await api(req)
				.get(`/teams/${req.params.teamId}/userPermissions/${res.locals.currentUser._id}`);
		} catch (error) {
			logger.error(formatError(error));
		}
	}

	let instanceUsesRocketChat = Configuration.get('ROCKETCHAT_SERVICE_ENABLED');
	const rocketChatDeprecated = Configuration.has('ROCKET_CHAT_DEPRECATION_DATE');
	if (rocketChatDeprecated) {
		const deprecationDate = new Date(Configuration.get('ROCKET_CHAT_DEPRECATION_DATE'));
		if (deprecationDate < timesHelper.now()) instanceUsesRocketChat = false;
	}

	teamPromise.then((team) => {
		if (req.params.teamId && !permissions.includes('RENAME_TEAM')) {
			return next(new Error(res.$t('global.text.403')));
		}

		if (team.description) team.description = decode(team.description);
		if (team.name) team.name = decode(team.name);

		return res.render('teams/edit-team', {
			action,
			method,
			title: req.params.teamId
				? res.$t('teams.add.headline.editTeam')
				: res.$t('teams.button.createTeam'),
			submitLabel: req.params.teamId
				? res.$t('global.button.saveChanges')
				: res.$t('teams.button.createTeam'),
			closeLabel: res.$t('global.button.cancel'),
			team,
			schoolData: res.locals.currentSchoolData,
			instanceUsesRocketChat,
			rocketChatDeprecated,
		});
	});
};

const copyCourseHandler = (req, res, next) => {
	let coursePromise;
	let action;
	let method;
	if (req.params.teamId) {
		action = `/teams/copy/${req.params.teamId}`;
		method = 'post';
		coursePromise = api(req).get(`/teams/${req.params.teamId}`, {
			qs: {
				$populate: [
					'classIds',
					'teacherIds',
					'userIds',
					'substitutionIds',
				],
			},
		});
	} else {
		action = '/teams/copy';
		method = 'post';
		coursePromise = Promise.resolve({});
	}

	const classesPromise = getSelectOptions(req, 'classes', { $limit: 1000 });
	const teachersPromise = getSelectOptions(req, 'users', {
		roles: ['teacher'],
		$limit: 1000,
	});
	const studentsPromise = getSelectOptions(req, 'users', {
		roles: ['student'],
		$sort: 'lastName',
		$limit: 1000,
	});

	Promise.all([
		coursePromise,
		classesPromise,
		teachersPromise,
		studentsPromise,
	]).then(([course, classes, teachers, students]) => {
		const classesOfCurrentSchool = classes.filter(
			(c) => c.schoolId === res.locals.currentSchool,
		);
		const teachersOfCurrentSchool = teachers.filter(
			(t) => t.schoolId === res.locals.currentSchool,
		);
		const studentsOfCurrentSchool = students.filter(
			(s) => s.schoolId === res.locals.currentSchool,
		);
		const substitutions = _.cloneDeep(teachersOfCurrentSchool);

		// map course times to fit into UI
		(course.times || []).forEach((time, count) => {
			time.duration = time.duration / 1000 / 60;
			const duration = timesHelper.duration(time.startTime);
			time.startTime = `${`00${duration.hours()}`.slice(
				-2,
			)}:${`00${duration.minutes()}`.slice(-2)}`;
			time.count = count;
		});

		// preselect current teacher when creating new course
		if (!req.params.teamId) {
			course.teacherIds = [];
			course.teacherIds.push(res.locals.currentUser);
		}

		course.name = `${course.name} - Kopie`;

		res.render('teams/edit-course', {
			action,
			method,
			title: res.$t('teams.headline.copyTeam'),
			submitLabel: res.$t('teams.button.copyTeam'),
			closeLabel: res.$t('global.button.cancel'),
			course,
			classes: classesOfCurrentSchool,
			teachers: markSelected(
				teachersOfCurrentSchool,
				_.map(course.teacherIds, '_id'),
			),
			substitutions,
			students: studentsOfCurrentSchool,
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

	const allowedCreateTeam = checkIfUserCanCreateTeam(res);

	teams = teams.data.map((team) => {
		team.url = `/teams/${team._id}`;
		team.title = team.name;
		team.content = (team.description || '').substr(0, 140);
		team.secondaryTitle = '';
		team.background = team.color;
		team.memberAmount = team.userIds.length;
		(team.times || []).forEach((time) => {
			time.startTime = moment(time.startTime, 'x')
				.utc()
				.format('HH:mm');
			time.weekday = recurringEventsHelper.getWeekdayForNumber(time.weekday, res);
			team.secondaryTitle += `<div>${time.weekday} ${time.startTime} ${time.room ? `| ${time.room}` : ''
			}</div>`;
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
		team.url = `/teams/invitation/accept/${team._id}`;

		return team;
	});

	if (req.query.json) {
		res.json(teams);
	} else if (teams.length !== 0 || teamInvitations.length !== 0) {
		res.render('teams/overview', {
			title: res.$t('teams.headline.myTeams'),
			teams,
			teamInvitations,
			allowedCreateTeam,
			searchLabel: res.$t('teams.placeholder.searchForTeams'),
			searchAction: '/teams',
			showSearch: true,
			liveSearch: true,
		});
	} else {
		res.render('teams/overview-empty', {
			allowedCreateTeam,
		});
	}
});

router.post('/', (req, res, next) => {
	const features = new Set([]);

	OPTIONAL_TEAM_FEATURES.forEach((feature) => {
		if (req.body[feature] === 'true') {
			features.add(feature);
		}

		delete req.body[feature];
	});

	if (features.size > 0) {
		req.body.features = Array.from(features);
	}

	api(req)
		.post('/teams/', {
			json: req.body,
		})
		.then((team) => res.redirect(`/teams/${team._id}`))
		.catch(next);
});

router.post('/copy/:teamId', (req, res, next) => {
	// map course times to fit model
	(req.body.times || []).forEach((time) => {
		time.startTime = moment.duration(time.startTime, 'HH:mm').asMilliseconds();
		time.duration = time.duration * 60 * 1000;
	});

	// eslint-disable-next-line no-underscore-dangle
	req.body.startDate = moment(req.body.startDate, 'DD:MM:YYYY')._d;
	// eslint-disable-next-line no-underscore-dangle
	req.body.untilDate = moment(req.body.untilDate, 'DD:MM:YYYY')._d;

	if (!moment(req.body.startDate, 'YYYY-MM-DD').isValid()) {
		delete req.body.startDate;
	}
	if (!moment(req.body.untilDate, 'YYYY-MM-DD').isValid()) {
		delete req.body.untilDate;
	}

	req.body._id = req.params.teamId;

	api(req)
		.post('/teams/copy/', {
			json: req.body, // TODO: sanitize
		})
		.then((course) => {
			res.redirect(`/teams/${course._id}`);
		})
		.catch(() => {
			res.sendStatus(500);
		});
});

router.get('/add/', editTeamHandler);

/*
 * Single Course
 */

function mapPermissionRoles(permissions, roles) {
	return permissions.map((permission) => {
		const role = roles.find((r) => r._id === permission.refId);
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
		api(req).get(`/teams/${req.params.teamId}`),
	])
		.then(([result, team]) => {
			const { data: roles } = result;

			team.filePermission = team.filePermission.map((permission) => {
				const role = roles.find((r) => r._id === permission.refId);
				permission.roleName = role ? role.name : '';
				return permission;
			});

			if (team.description) team.description = decode(team.description);
			if (team.name) team.name = decode(team.name);

			res.json({ team });
		})
		.catch((err) => {
			logger.warn(formatError(err));
			res.sendStatus(500);
		});
});

router.get('/:teamId/usersJson', (req, res, next) => {
	Promise.all([
		api(req).get(`/teams/${req.params.teamId}`, {
			qs: {
				$populate: {
					path: 'userIds.userId',
					select: ['firstName', 'lastName', 'fullName'],
				},
			},
		}),
	]).then(([course]) => res.json({ course }));
});

router.get('/:teamId', async (req, res, next) => {
	const { teamId } = req.params;
	const isAllowed = (permissions, role) => {
		const permission = permissions.find((p) => p.roleName === role);
		return Object.keys(permission).every((p) => permission[p]);
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
					{ path: 'schoolIds' },
				],
			},
		});

		if (course.description && course.name) {
			course.description = decode(course.description);
			course.name = decode(course.name);
		}

		let instanceUsesRocketChat = Configuration.get('ROCKETCHAT_SERVICE_ENABLED');
		if (Configuration.has('ROCKET_CHAT_DEPRECATION_DATE')) {
			const deprecationDate = new Date(Configuration.get('ROCKET_CHAT_DEPRECATION_DATE'));
			if (deprecationDate < timesHelper.now()) instanceUsesRocketChat = false;
		}
		const courseUsesRocketChat = course.features.includes('rocketChat');
		const schoolUsesRocketChat = (
			res.locals.currentSchoolData.features || []
		).includes('rocketChat');
		const schoolIsExpertSchool = res.locals.currentSchoolData.purpose === 'expert';

		let rocketChatCompleteURL;
		if (
			instanceUsesRocketChat
			&& courseUsesRocketChat
			&& (schoolUsesRocketChat || schoolIsExpertSchool)
		) {
			try {
				const rocketChatChannel = await api(req).get(
					`/rocketChat/channel/${req.params.teamId}`,
				);
				const rocketChatURL = Configuration.get('ROCKET_CHAT_URI');
				rocketChatCompleteURL = `${rocketChatURL}/group/${rocketChatChannel.channelName
				}`;
			} catch (err) {
				logger.warn(formatError(err));
				rocketChatCompleteURL = undefined;
			}
		}
		course.filePermission = mapPermissionRoles(course.filePermission, roles);

		const allowExternalExperts = isAllowed(course.filePermission, 'teamexpert');
		const allowTeamMembers = isAllowed(course.filePermission, 'teammember');

		let files;

		files = await api(req).get('/fileStorage', {
			qs: {
				owner: course._id,
			},
		});
		/* note: fileStorage can return arrays and error objects */
		if (!Array.isArray(files)) {
			if (files?.code) {
				logger.warn(files);
			}
			files = [];
		}

		files = files.filter((file) => file);

		files = files.map((file) => {
			// set saveName attribute with escaped quotes and encoded specific characters
			file.saveName = file.name.replace(/'/g, "\\'");
			file.saveName = encodeURIComponent(file.name);

			if (file?.permissions) {
				file.permissions = mapPermissionRoles(file.permissions, roles);
				return file;
			}
			return undefined;
		});

		const directories = files.filter((f) => f.isDirectory);
		files = files.filter((f) => !f.isDirectory);

		// Sort by most recent files and limit to 6 files
		files
			.sort((a, b) => {
				if (b?.updatedAt && a?.updatedAt) {
					return timesHelper.fromUTC(b.updatedAt) - timesHelper.fromUTC(a.updatedAt);
				}
				return 0;
			})
			.slice(0, 6);

		files.map(addThumbnails);

		directories
			.sort((a, b) => {
				if (b?.updatedAt && a?.updatedAt) {
					return timesHelper.fromUTC(b.updatedAt) - timesHelper.fromUTC(a.updatedAt);
				}
				return 0;
			})
			.slice(0, 6);

		const news = await api(req, { version: 'v3' })
			.get(`/team/${req.params.teamId}/news`, {
				qs: {
					limit: 3,
				},
			})
			.then((newsres) => newsres.data
				.map((n) => {
					n.url = `/teams/${req.params.teamId}/news/${n.id}`;
					n.secondaryTitle = timesHelper.fromNow(n.displayAt);
					return n;
				}))
			.catch((err) => {
				logger.error(
					`
						Can not fetch data from /news/ in router.get("/:teamId")
						| message: ${err.message} | code: ${err.code}.
					`,
				);
				return [];
			});

		let events = [];
		try {
			events = await api(req).get('/calendar/', {
				qs: {
					'scope-id': req.params.teamId,
					all: false,
				},
			});
			events = events
				.map((event) => {
					const start = timesHelper.fromUTC(event.start);
					const end = timesHelper.fromUTC(event.end);
					event.day = start.format('D');
					event.month = start
						.format('MMM')
						.toUpperCase()
						.split('.')
						.join('');
					event.dayOfTheWeek = start.format('dddd');
					event.fromTo = `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
					return event;
				});
			events = events.sort((a, b) => a.start - b.start);
		} catch (e) {
			events = [];
		}

		const teamUsesVideoconferencing = course.features.includes('videoconference');
		const schoolUsesVideoconferencing = (
			res.locals.currentSchoolData.features || []
		).includes('videoconference');

		let showVideoconferenceOption;
		if (Configuration.get('FEATURE_VIDEOCONFERENCE_WAITING_ROOM_ENABLED')) {
			showVideoconferenceOption = schoolUsesVideoconferencing && teamUsesVideoconferencing;
		} else {
			showVideoconferenceOption = !schoolIsExpertSchool && schoolUsesVideoconferencing && teamUsesVideoconferencing;
		}

		// leave team
		const leaveTeamAction = `/teams/${teamId}/members`;
		// teamowner could not leave if there is no other teamowner
		const couldLeave = checkIfUserCouldLeaveTeam(course.user, course.userIds);

		const permissions = await api(req).get(`/teams/${teamId}/userPermissions/${course.user.userId}`);

		const nextcloudUrl = Configuration.get('NEXTCLOUD_REDIRECT_URL') !== ''
			? Configuration.get('NEXTCLOUD_REDIRECT_URL') + encodeURI(makeNextcloudFolderName(req.params.teamId, course.name))
			: '';

		const useNextcloud = useNextcloudFilesystem(res.locals.currentUser);

		res.render(
			'teams/team',
			{
				...course,
				title: course.name,
				activeTab: req.query.activeTab,
				breadcrumbs: [
					{
						title: res.$t('teams.headline.myTeams'),
						url: '/teams',
						dataTestId: 'navigate-to-course-from-team',
					},
					{},
				],
				permissions,
				course,
				events,
				showVideoconferenceOption,
				directories,
				files,
				filesUrl: `/files/teams/${req.params.teamId}`,
				nextcloudUrl,
				useNextcloud,
				ownerId: req.params.teamId,
				canUploadFile: true,
				canCreateDir: true,
				canCreateFile: true,
				canEditPermissions: permissions.includes('EDIT_ALL_FILES'),
				canEditEvents: permissions.includes('CALENDAR_EDIT'),
				createEventAction: `/teams/${req.params.teamId}/events/`,
				leaveTeamAction,
				couldLeave,
				allowExternalExperts: allowExternalExperts ? 'checked' : '',
				allowTeamMembers: allowTeamMembers ? 'checked' : '',
				defaultFilePermissions: [],
				news,
				nextEvent: recurringEventsHelper.getNextEventForCourseTimes(
					course.times,
				),
				userId: res.locals.currentUser._id,
				teamId: req.params.teamId,
				rocketChatURL: rocketChatCompleteURL,
			},
		);
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
		time.startTime = timesHelper.duration(time.startTime).asMilliseconds();
		time.duration = time.duration * 60 * 1000;
	});

	// eslint-disable-next-line no-underscore-dangle
	req.body.startDate = moment(req.body.startDate, 'DD:MM:YYYY')._d;
	// eslint-disable-next-line no-underscore-dangle
	req.body.untilDate = moment(req.body.untilDate, 'DD:MM:YYYY')._d;

	if (!moment(req.body.startDate, 'YYYY-MM-DD').isValid()) {
		delete req.body.startDate;
	}
	if (!moment(req.body.untilDate, 'YYYY-MM-DD').isValid()) {
		delete req.body.untilDate;
	}

	const currentTeamState = await api(req).get(`/teams/${req.params.teamId}`);
	const features = new Set(currentTeamState.features || []);
	OPTIONAL_TEAM_FEATURES.forEach((feature) => {
		const isFeatureEnabled = (currentTeamState.features || []).includes(feature);
		if (!isFeatureEnabled && req.body[feature] === 'true') {
			features.add(feature);
		} else if (isFeatureEnabled && req.body[feature] !== 'true') {
			features.delete(feature);
		}
		delete req.body[feature];
	});
	req.body.features = Array.from(features);

	try {
		await api(req).patch(`/teams/${req.params.teamId}`, {
			json: req.body, // TODO: sanitize
		});
		res.redirect(`/teams/${req.params.teamId}`);
	} catch (error) {
		next(error);
	}
});

router.patch('/:teamId/permissions', (req, res) => {
	api(req)
		.patch(`/teams/${req.params.teamId}`, {
			json: req.body,
		})
		.then(() => res.sendStatus(200))
		.catch((err) => {
			logger.warn(formatError(err));
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
	req.body.startDate = timesHelper.dateTimeStringToMoment(req.body.startDate)
		.toISOString(true);
	req.body.endDate = timesHelper.dateTimeStringToMoment(req.body.endDate)
		.toISOString(true);

	// filter params
	req.body.scopeId = req.params.teamId;
	req.body.teamId = req.params.teamId;

	api(req)
		.post('/calendar/', { json: req.body })
		.then(() => {
			res.redirect(`/teams/${req.params.teamId}/?activeTab=events`);
		});
});

router.put('/events/:eventId', (req, res, next) => {
	req.body.startDate = timesHelper.dateTimeStringToMoment(req.body.startDate)
		.toISOString(true);
	req.body.endDate = timesHelper.dateTimeStringToMoment(req.body.endDate)
		.toISOString(true);

	api(req)
		.put(`/calendar/${req.params.eventId}`, {
			json: req.body,
		})
		.then(() => {
			res.sendStatus(200);
		})
		.catch((err) => {
			next(err);
		});
});

router.get('/:teamId/news/new', async (req, res, next) => {
	res.redirect(`/news/new?context=teams&contextId=${req.params.teamId}`);
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
	const { sortDirection } = req.query;
	const { sortBy } = req.query;

	const roleTranslations = {
		teammember: res.$t('teams._team.members.text.member'),
		teamexpert: res.$t('teams._team.members.text.expert'),
		teamleader: res.$t('global.role.text.leader'),
		teamadministrator: res.$t('global.role.text.administrator'),
		teamowner: res.$t('global.role.text.owner'),
	};

	const head = [
		res.$t('global.label.firstName'),
		res.$t('global.label.lastName'),
		res.$t('global.label.role'),
		res.$t('global.link.school'),
		res.$t('global.headline.actions'),
	];

	const headClasses = [
		res.$t('global.headline.name'),
		res.$t('global.link.administrationStudents'),
		res.$t('global.headline.actions'),
	];

	const headInvitations = [
		res.$t('teams._team.members.headline.email'),
		res.$t('teams._team.members.headline.invitedOn'),
		res.$t('global.label.role'),
		res.$t('global.headline.actions'),
	];

	const invitationActions = [
		{
			class: 'btn-resend-invitation',
			title: res.$t('teams._team.members.label.sendInvitationAgain'),
			icon: 'envelope',
		},
		{
			class: 'btn-delete-invitation',
			title: res.$t('teams._team.members.label.deleteInvitation'),
			icon: 'trash',
		},
	];

	const getTeam = () => api(req)
		.get(uri, {
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
						populate: ['year', 'gradeLevel'],
					},
				],
				$limit,
			},
		})
		.then((team) => {
			if (team.classIds === undefined) {
				team.classIds = [];
			}
			team.classes = team.classIds; // only for fix
			return team;
		});

	const getUsers = () => api(req)
		.get('/users', {
			qs: { schoolId, $limit, $sort: { lastName: 1, firstName: 1 } },
		})
		.then((userListResponse) => {
			const users = userListResponse.data;

			users.forEach((user) => {
				user.isHidden = isUserHidden(user, res.locals.currentSchoolData);
			});

			return users;
		});

	const getRoles = () => api(req)
		.get('/roles', {
			qs: {
				name: {
					$in: [
						'teammember',
						'teamexpert',
						'teamleader',
						'teamadministrator',
						'teamowner',
						'student',
					],
				},
			},
		})
		.then((roles) => roles.data.map((role) => {
			role.label = roleTranslations[role.name];
			return role;
		}));

	const getClasses = () => api(req)
		.get('/classes', {
			qs: { schoolId, $populate: ['year'], $limit },
		})
		.then((classes) => classes.data);

	const getFederalStates = () => api(req)
		.get('/federalStates')
		.then((federalStates) => federalStates.data);

	try {
		let [
			// eslint-disable-next-line prefer-const
			team,
			users,
			// eslint-disable-next-line prefer-const
			roles,
			// eslint-disable-next-line prefer-const
			classes,
			// eslint-disable-next-line prefer-const
			federalStates,
		] = await Promise.all([
			getTeam(),
			checkIfUserCanCreateTeam(res) ? getUsers() : [],
			getRoles(),
			getClasses(),
			getFederalStates(),
		]).catch((err) => {
			throw new Error('Can not fetch the data', err);
		});

		const { permissions } = team.user || {};
		team.userIds = team.userIds.filter((user) => user.userId !== null); // fix if user do not exist
		const teamUserIds = team.userIds.map((user) => user.userId._id);
		users = users.filter((user) => !teamUserIds.includes(user._id));
		const currentSchool = team.schoolIds.filter((s) => s._id === schoolId)[0];
		const currentFederalStateId = currentSchool?.federalState;
		let couldLeave = true; // will be set to false if current user is the only teamowner

		const rolesExternal = [
			{
				name: 'teamexpert',
				label: res.$t('teams._team.members.label.externExpert'),
				_id: roles.find((role) => role.name === 'teamexpert'),
			},
			{
				name: 'teamadministrator',
				label: res.$t('teams._team.members.label.externTeacher'),
				_id: roles.find((role) => role.name === 'teamadministrator'),
			},
		];

		const addButtonEdit = (actions = []) => {
			if (permissions.includes('CHANGE_TEAM_ROLES')) {
				actions.push({
					class: 'btn-edit-member',
					title: res.$t('teams._team.members.label.editRole'),
					icon: 'edit',
				});
			}
			return actions;
		};

		const addButtonTrash = (actions = []) => {
			if (permissions.includes('REMOVE_MEMBERS')) {
				actions.push({
					class: 'btn-delete-member',
					title: res.$t('teams._team.members.label.removeUser'),
					icon: 'trash',
					testId: 'btn-delete-team-member',
				});
			}
			return actions;
		};

		const addDisabledButtonTrash = (actions = []) => {
			if (permissions.includes('REMOVE_MEMBERS')) {
				actions.push({
					class: 'btn-delete-member disabled',
					title: res.$t('teams._team.members.label.leavingTeamRequiresNewOwner'),
					icon: 'trash',
					testId: 'btn-delete-team-member',
				});
			}
			return actions;
		};

		const addButtonTrashClass = (actions = []) => {
			if (permissions.includes('REMOVE_MEMBERS')) {
				actions.push({
					class: 'btn-delete-class',
					title: res.$t('teams._team.members.label.removeClass'),
					icon: 'trash',
				});
			}
			return actions;
		};

		if (team.user.role.name === 'teamowner') {
			couldLeave = false;
			for (const user of team.userIds) {
				if (
					user.userId._id !== team.user.userId._id
					&& user.role._id === team.user.role._id
				) {
					couldLeave = true;
					break;
				}
			}
		}

		const body = team.userIds.map((user) => {
			let actions = [];
			actions = addButtonEdit(actions);

			if (!couldLeave && user.role.name === 'teamowner') {
				actions = addDisabledButtonTrash(actions);
			} else {
				actions = addButtonTrash(actions);
			}

			const nameSuffix = user.userId.outdatedSince ? ' ~~' : '';

			return [
				user.userId.firstName || '',
				user.userId.lastName ? `${user.userId.lastName}${nameSuffix}` : '',
				roleTranslations[user.role.name],
				(user?.userId?.schoolId?.name) || '',
				{
					payload: {
						userId: user.userId._id,
					},
				},
				actions,
			];
		});

		const bodyClasses = team.classes.map((c) => [
			`${c.fullName || c.name} (${c.year ? c.year.name : ''})`,
			c.userIds.length,
			{
				payload: {
					classId: c._id,
				},
			},
			addButtonTrashClass(),
		]);

		const bodyInvitations = team.invitedUserIds.map((invitation) => [
			invitation.email,
			timesHelper.dateToDateString(invitation.createdAt),
			roleTranslations[invitation.role],
			{
				payload: {
					email: invitation.email,
				},
			},
			invitationActions,
		]);

		const filteredUsers = users.filter((user) => {
			const { _id: studentRoleId } = roles.find((role) => role.name === 'student');
			return res.locals.currentUser.permissions.includes('STUDENT_LIST')
				|| !user.roles.includes(studentRoleId)
				|| res.locals.currentSchoolData.instanceFeatures.includes('isTeamCreationByStudentsEnabled');
		});

		body.sort((a, b) => {
			if (a[sortBy] === b[sortBy]) return 0;

			if (sortDirection === 'asc') {
				return a[sortBy] < b[sortBy] ? -1 : 1;
			}
			return a[sortBy] < b[sortBy] ? 1 : -1;
		});

		res.render(
			'teams/members',
			{
				...team,
				title: res.$t('teams._team.members.headline.teamMembers'),
				action,
				classes,
				addMemberAction: `${uri}/members`,
				inviteExternalMemberAction: `${uri}/members/external`,
				deleteMemberAction: `${uri}/members`,
				deleteInvitationAction: `${uri}/invitation`,
				resendInvitationAction: `${uri}/invitation`,
				permissions: team.user.permissions,
				rolePermissions: res.locals.currentUser.permissions,
				method,
				head,
				body,
				headClasses,
				bodyClasses,
				roles,
				rolesExternal,
				headInvitations,
				bodyInvitations,
				users: filteredUsers,
				federalStates,
				currentFederalState: currentFederalStateId,
				breadcrumbs: [
					{
						title: res.$t('teams.headline.myTeams'),
						url: '/teams',
					},
					{
						title: team.name,
						url: uri,
					},
					{},
				],
			},
		);
	} catch (err) {
		next(err);
	}
});

router.post('/:teamId/members', async (req, res, next) => {
	try {
		const courseOld = await api(req).get(`/teams/${req.params.teamId}`);
		const userIds = courseOld.userIds.concat(req.body.userIds);
		const { classIds } = req.body;

		await api(req).patch(`/teams/${req.params.teamId}`, {
			json: {
				classIds,
				userIds,
			},
		});

		res.sendStatus(200);
	} catch (err) {
		next(err);
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
	} catch (err) {
		next(err);
	}
});

router.post('/external/invite', (req, res, next) => {
	const json = {
		userId: req.body.userId,
		email: req.body.email,
		role: req.body.role,
	};

	return api(req)
		.patch(`/teams/extern/add/${req.body.teamId}`, {
			json,
		})
		.then((result) => {
			res.sendStatus(200);
		})
		.catch(next);
});

router.delete('/:teamId/members', async (req, res, next) => {
	const courseOld = await api(req).get(`/teams/${req.params.teamId}`);
	const userIds = courseOld.userIds.filter(
		(user) => user.userId !== req.body.userIdToRemove,
	);
	const classIds = courseOld.classIds.filter(
		(_class) => _class !== req.body.classIdToRemove,
	);

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
	await api(req)
		.get(`/teams/extern/accept/${req.params.teamId}`)
		.then(() => {
			req.session.notification = {
				type: 'success',
				message: res.$t('teams._team.text.invitationSuccessfullyAccepted'),
			};
			res.redirect(`/teams/${req.params.teamId}`);
		})
		.catch((err) => {
			logger.warn(
				res.$t('teams._team.text.errorAcceptingInvitation'),
				formatError(err),
			);
			res.redirect(`/teams/${req.params.teamId}`);
		});
});

/*
 * Single Team Topics & Lessons
 */

router.get('/:teamId/topics', async (req, res, next) => {
	Promise.all([
		api(req).get(`/teams/${req.params.teamId}`),
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
	])
		.then(([course, lessons, homeworks, courseGroups]) => {
			const lessonsData = (lessons.data || []).map((lesson) => Object.assign(lesson, {
				url: `/teams/${req.params.teamId}/topics/${lesson._id}/`,
			}));

			const homeworksData = (homeworks.data || []).map((assignment) => {
				assignment.url = `/homework/${assignment._id}`;
				return assignment;
			});

			homeworks.sort((a, b) => {
				if (a.dueDate > b.dueDate) {
					return 1;
				}
				return -1;
			});

			const courseGroupsData = permissionHelper.userHasPermission(
				res.locals.currentUser,
				'COURSE_EDIT',
			)
				? courseGroups.data || []
				: (courseGroups.data || []).filter(
					(cg) => cg.userIds.some((user) => user._id === res.locals.currentUser._id),
				);

			res.render(
				'teams/topics',
				{
					...course,
					title: course.name,
					lessons: lessonsData,
					homeworks: homeworksData.filter((task) => !task.private),
					myhomeworks: homeworksData.filter((task) => task.private),
					courseGroups: courseGroupsData,
					breadcrumbs: [
						{
							title: res.$t('teams.headline.myTeams'),
							url: '/teams',
						},
						{
							title: course.name,
							url: `/teams/${course._id}`,
						},
						{},
					],
					filesUrl: `/files/teams/${req.params.teamId}`,
					nextEvent: recurringEventsHelper.getNextEventForCourseTimes(
						course.times,
					),
				},
			);
		})
		.catch((err) => {
			next(err);
		});
});

router.patch('/:teamId/positions', (req, res, next) => {
	for (const elem in req.body) {
		if (Object.prototype.hasOwnProperty.call(req.body, elem)) {
			api(req).patch(`/lessons/${elem}`, {
				json: {
					// eslint-disable-next-line radix
					position: parseInt(req.body[elem]),
					teamId: req.params.teamId,
				},
			});
		}
	}

	res.sendStatus(200);
});

module.exports = router;
