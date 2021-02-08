/* eslint-disable no-underscore-dangle */
const _ = require('lodash');
const express = require('express');
const moment = require('moment');
const { Configuration } = require('@hpi-schul-cloud/commons');
const api = require('../api');
const apiEditor = require('../apiEditor');
const { EDITOR_URL } = require('../config/global');
const authHelper = require('../helpers/authentication');
const recurringEventsHelper = require('../helpers/recurringEvents');
const permissionHelper = require('../helpers/permissions');
const redirectHelper = require('../helpers/redirect');
const logger = require('../helpers/logger');
const timesHelper = require('../helpers/timesHelper');

const OPTIONAL_COURSE_FEATURES = ['messenger'];

const router = express.Router();
const { HOST } = require('../config/global');

const getSelectOptions = (req, service, query) => api(req).get(`/${service}`, {
	qs: query,
}).then((data) => data.data);


const markSelected = (options, values = []) => options.map((option) => {
	option.selected = values.includes(option._id);
	return option;
});

/**
 * creates an event for a created course. following params has to be included in @param course for creating the event:
 * startDate {Date} - the date the course is first take place
 * untilDate {Date} -  the date the course is last take place
 * duration {Number} - the duration of a course lesson
 * weekday {Number} - from 0 to 6, the weekday the course take place
 * @param course
 */
const createEventsForCourse = (req, res, course) => {
	// can just run if a calendar service is running on the environment
	if (Configuration.get('CALENDAR_SERVICE_ENABLED') === true) {
		return Promise.all(
			course.times.map((time) => {
				const startDate = timesHelper.fromUTC(course.startDate).add(time.startTime, 'ms');
				const repeatUntil = timesHelper.fromUTC(course.untilDate);
				const event = {
					summary: course.name,
					location: time.room,
					description: course.description,
					startDate: startDate.toISOString(true),
					duration: time.duration,
					repeat_until: repeatUntil.toISOString(true),
					frequency: 'WEEKLY',
					weekday: recurringEventsHelper.getIsoWeekdayForNumber(
						time.weekday,
					),
					scopeId: course._id,
					courseId: course._id,
					courseTimeId: time._id,
				};
				return api(req).post('/calendar', {
					json: event,
				});
			}),
		).catch((error) => {
			logger.warn(
				'failed creating events for the course, the calendar service might be unavailible',
				error,
			);
			req.session.notification = {
				type: 'danger',
				message: res.$t('courses._course.text.eventCouldNotBeSavedContactSupport'),
			};
			return Promise.resolve();
		});
	}

	return Promise.resolve(true);
};

/**
 * Deletes all events from the given course, clear function
 * @param courseId {string} - the id of the course the events will be deleted
 */
const deleteEventsForCourse = (req, res, courseId) => {
	if (Configuration.get('CALENDAR_SERVICE_ENABLED') === true) {
		api(req).delete(`calendar-course/${courseId}`).catch((error) => {
				logger.warn(
				'failed creating events for the course, the calendar service might be unavailable',
					error,
				);
				req.session.notification = {
					type: 'danger',
					message: res.$t('courses._course.text.eventCouldNotBeSavedContactSupport'),
				};
				return Promise.resolve();
		});
	}
	return Promise.resolve(true);
};

const editCourseHandler = (req, res, next) => {
	let coursePromise;
	let action;
	let method;
	if (req.params.courseId) {
		action = `/courses/${req.params.courseId}`;
		method = 'patch';
		coursePromise = api(req).get(`/courses/${req.params.courseId}`);
	} else {
		action = '/courses/';
		method = 'post';
		coursePromise = Promise.resolve({});
	}

	if (req.query.redirectUrl) {
		action += `?redirectUrl=${req.query.redirectUrl}`;
	}


	const classesPromise = api(req)
		.get('/classes', {
			qs: {
				schoolId: res.locals.currentSchool,
				$populate: ['year'],
				$limit: -1,
				$sort: { year: -1, displayName: 1 },
			},
		});
	// .then(data => data.data); needed when pagination is not disabled
	const teachersPromise = getSelectOptions(req, 'users', {
		roles: ['teacher', 'demoTeacher'],
		$limit: false,
	});
	const studentsPromise = getSelectOptions(req, 'users', {
		roles: ['student', 'demoStudent'],
		$limit: false,
		$sort: 'lastName',
	});

	let scopePermissions;
	if (req.params.courseId) {
		scopePermissions = api(req)
			.get(`/courses/${req.params.courseId}/userPermissions/${res.locals.currentUser._id}`);
	}

	Promise.all([
		coursePromise,
		classesPromise,
		teachersPromise,
		studentsPromise,
		scopePermissions,
	]).then(([course, _classes, _teachers, _students, _scopePermissions]) => {
		// these 3 might not change anything because hooks allow just ownSchool results by now, but to be sure:
		const classes = _classes.filter(
			(c) => c.schoolId === res.locals.currentSchool,
		).sort();
		const teachers = _teachers.filter(
			(t) => t.schoolId === res.locals.currentSchool,
		).sort((a, b) => a.firstName.localeCompare(b.firstName));
		const students = _students.filter(
			(s) => s.schoolId === res.locals.currentSchool,
		).sort((a, b) => a.firstName.localeCompare(b.firstName));
		const substitutions = _.cloneDeep(
			teachers,
		).sort((a, b) => a.firstName.localeCompare(b.firstName));

		(course.times || []).forEach((time, count) => {
			time.duration = time.duration / 1000 / 60;
			const duration = moment.duration(time.startTime);
			const hoursString = `00${duration.hours()}`.slice(-2);
			const minutsString = `00${duration.minutes()}`.slice(-2);
			time.startTime = `${hoursString}:${minutsString}`;
			time.count = count;
		});

		// if new course -> add default start and end dates
		if (!req.params.courseId) {
			course.startDate = res.locals.currentSchoolData.years.defaultYear.startDate;
			course.untilDate = res.locals.currentSchoolData.years.defaultYear.endDate;
		}

		// format course start end until date
		if (course.startDate) {
			course.startDate = timesHelper.fromUTC(course.startDate);
			course.untilDate = timesHelper.fromUTC(course.untilDate);
		}

		// preselect current teacher when creating new course
		if (!req.params.courseId) {
			course.teacherIds = [];
			course.teacherIds.push(res.locals.currentUser._id);
		}

		// populate course colors - to be replaced system scope
		const colors = [
			'#ACACAC',
			'#D4AF37',
			'#00E5FF',
			'#1DE9B6',
			'#546E7A',
			'#FFC400',
			'#BCAAA4',
			'#FF4081',
			'#FFEE58',
		];

		// checks for user's 'STUDENT_LIST' permission and filters checked students
		const filterStudents = (ctx, s) => (
			!ctx.locals.currentUser.permissions.includes('STUDENT_LIST')
				? s.filter(({ selected }) => selected) : s
		);

		if (req.params.courseId) {
			if (!_scopePermissions.includes('COURSE_EDIT')) return next(new Error(res.$t('global.text.403')));
			return res.render('courses/edit-course', {
				action,
				method,
				title: res.$t('courses._course.edit.headline.editCourse'),
				submitLabel: res.$t('global.button.saveChanges'),
				closeLabel: res.$t('global.button.cancel'),
				course,
				colors,
				classes: markSelected(classes, course.classIds),
				teachers: markSelected(
					teachers,
					course.teacherIds,
				),
				substitutions: markSelected(
					substitutions,
					course.substitutionIds,
				),
				students: filterStudents(res, markSelected(students, course.userIds)),
				scopePermissions: _scopePermissions,
				schoolData: res.locals.currentSchoolData,
			});
		}
		return res.render('courses/create-course', {
			action,
			method,
			sectionTitle: res.$t('courses.add.headline.addCourse'),
			submitLabel: res.$t('courses.add.button.addCourseAndContinue'),
			closeLabel: res.$t('global.button.cancel'),
			course,
			colors,
			classes: markSelected(classes, course.classIds),
			teachers: markSelected(
				teachers,
				course.teacherIds,
			),
			substitutions: markSelected(
				substitutions,
				course.substitutionIds,
			),
			students: filterStudents(res, markSelected(students, course.userIds)),
			redirectUrl: req.query.redirectUrl || '/courses',
		});
	}).catch(next);
};

const sameId = (id1, id2) => id1.toString() === id2.toString();

const copyCourseHandler = (req, res, next) => {
	let coursePromise;
	let action;
	let method;
	if (req.params.courseId) {
		action = `/courses/copy/${req.params.courseId}`;
		method = 'post';
		coursePromise = api(req).get(`/courses/${req.params.courseId}`);
	} else {
		action = '/courses/copy';
		method = 'post';
		coursePromise = Promise.resolve({});
	}

	const classesPromise = getSelectOptions(req, 'classes', { $limit: 1000 });
	const teachersPromise = getSelectOptions(req, 'users', {
		roles: ['teacher', 'demoTeacher'],
		$limit: 1000,
	});
	const studentsPromise = getSelectOptions(req, 'users', {
		roles: ['student', 'demoStudent'],
		$limit: 1000,
	});

	Promise.all([
		coursePromise,
		classesPromise,
		teachersPromise,
		studentsPromise,
	]).then(([course, _classes, _teachers, _students]) => {
		const classes = _classes.filter((c) => sameId(c.schoolId, res.locals.currentSchool));
		const teachers = _teachers.filter((t) => sameId(t.schoolId, res.locals.currentSchool));
		const students = _students.filter((s) => sameId(s.schoolId, res.locals.currentSchool));
		const substitutions = _.cloneDeep(teachers);

		// map course times to fit into UI
		(course.times || []).forEach((time, count) => {
			time.duration = time.duration / 1000 / 60;
			const duration = moment.duration(time.startTime);
			const hoursString = `00${duration.hours()}`.slice(-2);
			const minutsString = `00${duration.minutes()}`.slice(-2);
			time.startTime = `${hoursString}:${minutsString}`;
			time.count = count;
		});

		// format course start end until date
		if (course.startDate) {
			course.startDate = timesHelper.fromUTC(course.startDate);
		}
		if (course.untilDate) {
			course.untilDate = timesHelper.fromUTC(course.untilDate);
		}
		// preselect current teacher when creating new course
		if (!req.params.courseId) {
			course.teacherIds = [];
			course.teacherIds.push(res.locals.currentUser._id);
		}

		// populate course colors - to be replaced system scope
		const colors = [
			'#ACACAC',
			'#D4AF37',
			'#00E5FF',
			'#1DE9B6',
			'#546E7A',
			'#FFC400',
			'#BCAAA4',
			'#FF4081',
			'#FFEE58',
		];

		course.name = `${course.name} - Kopie`;

		course.isArchived = false;

		// checks for user's 'STUDENT_LIST' permission and filters checked students
		const filterStudents = (ctx, s) => (
			!ctx.locals.currentUser.permissions.includes('STUDENT_LIST')
				? s.filter(({ selected }) => selected) : s
		);

		res.render('courses/edit-course', {
			action,
			method,
			title: res.$t('courses._course.copy.headline.cloneCourse'),
			submitLabel: res.$t('courses._course.copy.button.cloneCourse'),
			closeLabel: res.$t('global.button.cancel'),
			course,
			classes,
			colors,
			teachers: markSelected(teachers, course.teacherIds),
			substitutions,
			students: filterStudents(res, students),
			schoolData: res.locals.currentSchoolData,
		});
	});
};

// secure routes
router.use(authHelper.authChecker);

/**
 *
 * @param {*} courses, string userId
 * @returns [substitutions, others]
 */

const enrichCourse = (course, res) => {
	course.url = `/courses/${course._id}`;
	course.title = course.name;
	course.content = (course.description || '').substr(0, 140);
	course.secondaryTitle = '';
	course.background = course.color;
	course.memberAmount = course.userIds.length;
	(course.times || []).forEach((time) => {
		time.startTime = moment(time.startTime, 'x').utc().format('HH:mm');
		time.weekday = recurringEventsHelper.getWeekdayForNumber(time.weekday, res);
		course.secondaryTitle += `<div>${time.weekday} ${time.startTime} ${time.room ? `| ${time.room}` : ''}</div>`;
	});
	return course;
};

const filterSubstitutionCourses = (courses, userId, res) => {
	const substitutions = [];
	const others = [];

	courses.data.forEach((course) => {
		enrichCourse(course, res);

		if ((course.substitutionIds || []).includes(userId)) {
			substitutions.push(course);
		} else {
			others.push(course);
		}
	});

	return [substitutions, others];
};

router.get('/', (req, res, next) => {
	const { currentUser } = res.locals;
	const userId = currentUser._id.toString();
	const importToken = req.query.import;

	Promise.all([
		api(req).get(`/users/${userId}/courses/`, {
			qs: {
				filter: 'active',
				$limit: 75,
			},
		}),
		api(req).get(`/users/${userId}/courses/`, {
			qs: {
				filter: 'archived',
				$limit: 750,
			},
		}),
	])
		.then(([active, archived]) => {
			let activeSubstitutions = [];
			let activeCourses = [];
			let archivedSubstitutions = [];
			let archivedCourses = [];

			[activeSubstitutions, activeCourses] = filterSubstitutionCourses(
				active,
				userId,
				res,
			);
			[
				archivedSubstitutions,
				archivedCourses,
			] = filterSubstitutionCourses(archived, userId, res);

			if (req.query.json) {
				// used for populating some modals (e.g. calendar event creation)
				res.json(active.data);
			} else if (active.total !== 0 || archived.total !== 0) {
				res.render('courses/overview', {
					title: res.$t('courses.headline.myCourses'),
					activeTab: req.query.activeTab,
					importToken,
					activeCourses,
					activeSubstitutions,
					archivedCourses,
					archivedSubstitutions,
					total: {
						active: active.total,
						archived: archived.total,
					},
					searchLabel: res.$t('courses.input.searchForCourses'),
					searchAction: '/courses',
					showSearch: true,
					liveSearch: true,
				});
			} else {
				res.render('courses/overview-empty', {
					importToken,
				});
			}
		})
		.catch((err) => {
			next(err);
		});
});

router.post('/', (req, res, next) => {
	// map course times to fit model
	(req.body.times || []).forEach((time) => {
		time.startTime = moment
			.duration(time.startTime, 'HH:mm')
			.asMilliseconds();
		time.duration = time.duration * 60 * 1000;
	});

	const startDate = timesHelper.dateStringToMoment(req.body.startDate);
	const untilDate = timesHelper.dateStringToMoment(req.body.untilDate);

	delete req.body.startDate;
	if (startDate.isValid()) {
		req.body.startDate = startDate.toDate();
	}

	delete req.body.untilDate;
	if (untilDate.isValid()) {
		req.body.untilDate = untilDate.toDate();
	}

	req.body.features = [];
	OPTIONAL_COURSE_FEATURES.forEach((feature) => {
		if (req.body[feature] === 'true') {
			req.body.features.push(feature);
		}
		delete req.body[feature];
	});

	api(req)
		.post('/courses/', {
			json: req.body, // TODO: sanitize
		})
		.then((course) => {
			createEventsForCourse(req, res, course).then(() => {
				res.json({ createdCourse: course });
			});
		})
		.catch(() => {
			res.sendStatus(500);
		});
});

router.post('/copy/:courseId', (req, res, next) => {
	// map course times to fit model
	(req.body.times || []).forEach((time) => {
		time.startTime = moment
			.duration(time.startTime, 'HH:mm')
			.asMilliseconds();
		time.duration = time.duration * 60 * 1000;
	});

	const startDate = timesHelper.dateStringToMoment(req.body.startDate);
	const untilDate = timesHelper.dateStringToMoment(req.body.untilDate);

	delete req.body.startDate;
	if (startDate.isValid()) {
		req.body.startDate = startDate.toDate();
	}

	delete req.body.untilDate;
	if (untilDate.isValid()) {
		req.body.untilDate = untilDate.toDate();
	}

	req.body._id = req.params.courseId;
	// req.body.courseId = req.params.courseId;
	req.body.copyCourseId = req.params.courseId;

	req.body.features = [];
	OPTIONAL_COURSE_FEATURES.forEach((feature) => {
		if (req.body[feature] === 'true') {
			req.body.features.push(feature);
		}
		delete req.body[feature];
	});

	api(req)
		.post('/courses/copy/', {
			json: req.body, // TODO: sanitize
		})
		.then((course) => {
			res.redirect(`/courses/${course._id}`);
			res.sendStatus(500);
		});
});

router.get('/add/', editCourseHandler);

/*
 * Single Course
 */

router.get('/:courseId/json', (req, res, next) => {
	Promise.all([
		api(req).get(`/courses/${req.params.courseId}`),
		api(req).get('/lessons/', {
			qs: {
				courseId: req.params.courseId,
			},
		}),
	])
		.then(([course, lessons]) => res.json({ course, lessons }))
		.catch(next);
});

router.get('/:courseId/usersJson', (req, res, next) => {
	Promise.all([
		api(req).get(`/courses/${req.params.courseId}`, {
			qs: {
				$populate: {
					path: 'userIds',
					select: ['firstName', 'lastName', 'fullName'],
				},
			},
		}),
	])
		.then(([course]) => res.json({ course }))
		.catch(next);
});

// EDITOR

router.get('/:courseId/', async (req, res, next) => {
	const promises = [
		api(req).get(`/courses/${req.params.courseId}`),
		api(req).get('/lessons/', {
			qs: {
				courseId: req.params.courseId,
				$sort: 'position',
			},
		}),
		api(req).get('/homework/', {
			qs: {
				courseId: req.params.courseId,
				$populate: ['courseId'],
				archived: { $ne: res.locals.currentUser._id },
				$sort: 'createdAt',
			},
		}),
		api(req).get('/courseGroups/', {
			qs: {
				courseId: req.params.courseId,
				$populate: ['courseId', 'userIds'],
			},
		}),
		api(req).get(`/courses/${req.params.courseId}/userPermissions`, {
			qs: { userId: res.locals.currentUser._id },
		}),
	];

	// ########################### start requests to new Editor #########################
	let editorBackendIsAlive = true;
	if (EDITOR_URL) {
		promises.push(apiEditor(req)
			.get(`course/${req.params.courseId}/lessons`)
			.catch((err) => {
				logger.warn('Can not fetch new editor lessons.', err);
				editorBackendIsAlive = false;
				return {
					total: 0,
					data: [],
				};
			}));
	}

	// ############################ end requests to new Editor ##########################
	const [
		course,
		_lessons,
		_homeworks,
		_courseGroups,
		scopedPermissions,
		_newLessons,
	] = await Promise.all(promises).catch((err) => {
		logger.warn('Can not fetch course datas', err);
		next(err);
	});

	try {
		// ############################## check if new Editor options should show #################
		const edtrUser = (res.locals.currentUser.features || []).includes('edtr');
		const userHasEditorEnabled = EDITOR_URL && edtrUser;
		const courseHasNewEditorLessons = ((_newLessons || {}).total || 0) > 0;

		const isNewEdtrioActivated = editorBackendIsAlive && (courseHasNewEditorLessons || userHasEditorEnabled);
		// ################################ end new Editor check ##################################
		let ltiTools = [];
		if (course.ltiToolIds && course.ltiToolIds.length > 0) {
			ltiTools = await api(req).get('/ltiTools', {
				qs: {
					_id: { $in: course.ltiToolIds },
				},
			});
		}
		ltiTools = (ltiTools.data || []).filter(
			(ltiTool) => ltiTool.isTemplate !== 'true',
		).map((tool) => {
			tool.isBBB = tool.name === 'Video-Konferenz mit BigBlueButton';
			tool.isBettermarks = (tool.name && tool.name.includes('bettermarks'));
			return tool;
		});

		const lessons = (_lessons.data || []).map((lesson) => Object.assign(lesson, {
			url: `/courses/${req.params.courseId}/topics/${lesson._id}/`,
		}));

		const homeworks = (_homeworks.data || []).map((assignment) => {
			assignment.url = `/homework/${assignment._id}`;
			return assignment;
		});

		homeworks.sort((a, b) => {
			if (a.dueDate > b.dueDate || !a.dueDate) {
				return 1;
			}
			return -1;
		});

		const baseUrl = req.headers.origin || HOST || 'http://localhost:3100';
		const courseGroups = permissionHelper.userHasPermission(
			res.locals.currentUser,
			'COURSE_EDIT',
		)
			? _courseGroups.data || []
			: (_courseGroups.data || []).filter((cg) => cg.userIds.some(
				(user) => user._id === res.locals.currentUser._id,
			));

		// ###################### start of code for new Editor ################################
		let newLessons;
		if (isNewEdtrioActivated) {
			newLessons = (_newLessons.data || []).map((lesson) => ({
				...lesson,
				url: `/courses/${req.params.courseId}/topics/${lesson._id}?edtr=true`,
				hidden: !lesson.visible,
			}));
		}

		// ###################### end of code for new Editor ################################
		const user = res.locals.currentUser || {};
		const roles = user.roles.map((role) => role.name);
		const hasRole = (allowedRoles) => roles.some((role) => (allowedRoles || []).includes(role));
		const teacher = ['teacher', 'demoTeacher'];
		const student = ['student', 'demoStudent'];

		res.render(
			'courses/course',
			{
				...course,
				title: course.isArchived
					? `${course.name} (archiviert)`
					: course.name,
				activeTab: req.query.activeTab,
				lessons,
				homeworksCount: (homeworks.filter((task) => !task.private)).length,
				assignedHomeworks: (hasRole(teacher)
					? homeworks.filter((task) => !task.private && !task.stats.submissionCount)
					: homeworks.filter((task) => !task.private && !task.submissions)),
				homeworksWithSubmission: (hasRole(teacher)
					? homeworks.filter((task) => !task.private && task.stats.submissionCount)
					: homeworks.filter((task) => !task.private && task.submissions)),
				privateHomeworks: homeworks.filter((task) => task.private),
				ltiTools,
				courseGroups,
				baseUrl,
				breadcrumb: [
					{
						title: res.$t('courses.headline.myCourses'),
						url: '/courses',
					},
					{
						title: course.name,
						url: `/courses/${course._id}`,
					},
				],
				filesUrl: `/files/courses/${req.params.courseId}`,
				nextEvent: recurringEventsHelper.getNextEventForCourseTimes(
					course.times,
				),
				// #################### new Editor, till replacing old one ######################
				newLessons,
				isNewEdtrioActivated,
				scopedCoursePermission: scopedPermissions[res.locals.currentUser._id],
				isTeacher: hasRole(teacher),
				isStudent: hasRole(student),
			},
		);
	} catch (err) {
		logger.warn(err);
		next(err);
	}
});

router.patch('/:courseId', async (req, res, next) => {
	try {
		const redirectUrl = req.query.redirectUrl || `/courses/${req.params.courseId}`;

		// map course times to fit model
		req.body.times = req.body.times || [];
		req.body.times.forEach((time) => {
			time.startTime = moment.duration(time.startTime).asMilliseconds();
			time.duration = time.duration * 60 * 1000;
		});

		if (!req.body.classIds) {
			req.body.classIds = [];
		}
		if (!req.body.userIds) {
			req.body.userIds = [];
		}
		if (!req.body.substitutionIds) {
			req.body.substitutionIds = [];
		}

		const startDate = timesHelper.dateStringToMoment(req.body.startDate);
		const untilDate = timesHelper.dateStringToMoment(req.body.untilDate);

		delete req.body.startDate;
		if (startDate.isValid()) {
			req.body.startDate = startDate.toDate();
		}

		delete req.body.untilDate;
		if (untilDate.isValid()) {
			req.body.untilDate = untilDate.toDate();
		}

		// unarchive client request do not contain information about feature flags
		if (req.body.unarchive !== 'true') {
			req.body.features = [];
			OPTIONAL_COURSE_FEATURES.forEach((feature) => {
				if (req.body[feature] === 'true') {
					req.body.features.push(feature);
				}
				delete req.body[feature];
			});
		}

		if (req.body.unarchive === 'true') {
			req.body = { untilDate: req.body.untilDate };
		}
		const { courseId } = req.params;

		await deleteEventsForCourse(req, res, courseId);
		await api(req).patch(`/courses/${courseId}`, {
			json: req.body,
		});
		// due to eventual consistency we need to get the course again from server
		// instead of using the response from patch
		const course = await api(req).get(`/courses/${courseId}`);
		await createEventsForCourse(req, res, course);
		res.redirect(303, redirectUrl);
	} catch (e) {
		next(e);
	}
});

router.patch('/:courseId/positions', (req, res, next) => {
	Object.keys(req.body).forEach((key) => {
		api(req).patch(`/lessons/${key}`, {
			json: {
				position: parseInt(req.body[key], 10),
				courseId: req.params.courseId,
			},
		});
	});
	res.sendStatus(200);
});

router.delete('/:courseId', async (req, res, next) => {
	try {
		await deleteEventsForCourse(req, res, req.params.courseId);
		await api(req).delete(`/courses/${req.params.courseId}`);
		res.sendStatus(200);
	} catch (error) {
		next(error);
	}
});

router.get('/:courseId/addStudent', (req, res, next) => {
	const { currentUser } = res.locals;
	// if currentUser isn't a student don't add to course-students
	if (currentUser.roles.filter((r) => r.name === 'student').length <= 0) {
		req.session.notification = {
			type: 'danger',
			message: res.$t('courses._course.addStudent.text.youAreNoStudent'),
		};
		res.redirect(`/courses/${req.params.courseId}`);
		return;
	}

	// check if student is already in course
	api(req)
		.get(`/courses/${req.params.courseId}?link=${req.query.link}`)
		.then((course) => {
			if (_.includes(course.userIds, currentUser._id)) {
				req.session.notification = {
					type: 'danger',
					message: res.$t('courses._course.text.youAreAlreadyMember', { coursename: course.name }),
				};
				res.redirect(`/courses/${req.params.courseId}`);
				return;
			}

			// add Student to course
			course.userIds.push(currentUser._id);
			// eslint-disable-next-line consistent-return
			return api(req)
				.patch(`/courses/${course._id}?link=${req.query.link}`, {
					json: course,
				})
				.then(() => {
					req.session.notification = {
						type: 'success',
						message: res.$t('courses._course.text.youHaveBeenAdded', { coursename: course.name }),
					};
					res.redirect(`/courses/${req.params.courseId}`);
				});
		})
		.catch(next);
});

router.post('/:courseId/importTopic', (req, res, next) => {
	const { shareToken } = req.body;
	// try to find topic for given shareToken
	api(req)
		.get('/lessons/', { qs: { shareToken } })
		.then((lessons) => {
			if ((lessons.data || []).length <= 0) {
				req.session.notification = {
					type: 'danger',
					message: res.$t('global.text.noTopicFoundWithCode'),
				};

				redirectHelper.safeBackRedirect(req, res);
			}

			api(req)
				.post('/lessons/copy', {
					json: {
						lessonId: lessons.data[0]._id,
						newCourseId: req.params.courseId,
						shareToken,
					},
				})
				.then(() => {
					redirectHelper.safeBackRedirect(req, res);
				});
		})
		.catch((err) => res.status(err.statusCode || 500).send(err));
});

router.get('/:courseId/edit', editCourseHandler);

router.get('/:courseId/copy', copyCourseHandler);

// return shareToken
router.get('/:id/share', (req, res, next) => api(req)
	.get(`/courses-share/${req.params.id}`)
	.then((course) => res.json(course)));

// return course Name for given shareToken
router.get('/share/:id', (req, res, next) => api(req)
	.get('/courses-share', { qs: { shareToken: req.params.id } })
	.then((name) => res.json({ msg: name, status: 'success' }))
	.catch(() => res.json({ msg: 'ShareToken is not in use.', status: 'error' })));

router.post('/import', (req, res, next) => {
	const { shareToken } = req.body;
	const courseName = req.body.name;

	api(req)
		.post('/courses-share', { json: { shareToken, courseName } })
		.then((course) => {
			if (course.errors && course.message && course.code) {
				throw course;
			}
			res.redirect(`/courses/${course._id}/edit/`);
		})
		.catch(next);
});

module.exports = router;
