/* eslint no-confusing-arrow: 0 */
/*
 * One Controller per layout view
 */

const express = require('express');
const marked = require('marked');
const handlebars = require('handlebars');
const _ = require('lodash');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const permissionHelper = require('../helpers/permissions');
const redirectHelper = require('../helpers/redirect');
const logger = require('../helpers/logger');
const { NOTIFICATION_SERVICE_ENABLED, HOST } = require('../config/global');
const { getGradingFileDownloadPath, getGradingFileName, isGraded } = require('../helpers/homework');
const timesHelper = require('../helpers/timesHelper');

const router = express.Router();

handlebars.registerHelper('ifvalue', (conditional, options) => {
	if (options.hash.value === conditional) {
		return options.fn(this);
	}
	return options.inverse(this);
});

router.use(authHelper.authChecker);

const getSelectOptions = (req, service, query, values = []) => api(req).get(`/${service}`, {
	qs: query,
}).then((data) => data.data);

const getActions = (res, item, path) => [{
	link: `${path + item._id}/edit`,
	class: 'btn-edit',
	icon: 'edit',
	title: res.$t('homework.button.editSubmissionFromList'),
},
{
	link: `${path + item._id}/copy`,
	class: 'btn-copy',
	icon: 'copy',
	title: res.$t('homework.button.copySubmissionFromList'),
},
{
	link: path + item._id,
	class: 'btn-delete',
	icon: 'trash-o',
	method: 'DELETE',
	title: res.$t('homework.button.deleteSubmissionFromList'),
},
];

const handleTeamSubmissionsBody = (body, currentUser) => {
	body.teamSubmissionOptions === 'courseGroup' ? body.teamMembers = [currentUser._id] : body.courseGroupId = null;
};

const getCreateHandler = (service) => (req, res, next) => {
	if (service === 'homework') {
		const {
			courseId,
			lessonId,
			dueDate,
			availableDate,
			publicSubmissions,
		} = req.body;

		if ((!courseId) || (courseId && courseId.length <= 2)) { // todo for what is lessonId.length <= 2 ?
			req.body.courseId = null;
			req.body.private = true;
		}
		if ((!lessonId) || (lessonId && lessonId.length <= 2)) { // todo for what is lessonId.length <= 2 ?
			req.body.lessonId = null;
		}
		if (dueDate) {
			// rewrite german format to ISO
			req.body.dueDate = timesHelper
				.dateTimeStringToMoment(dueDate)
				.toISOString();
		}

		if (publicSubmissions === 'public') {
			req.body.publicSubmissions = true;
		}

		const dateTimePickerMask = res.$t('format.dateTimePickerMask');
		const datePickerPlaceholder = dateTimePickerMask.replace(/[0-9]/g, '_');

		if (availableDate && availableDate !== datePickerPlaceholder) {
			req.body.availableDate = timesHelper
				.dateTimeStringToMoment(availableDate)
				.toISOString();
		} else {
			req.body.availableDate = timesHelper.currentDate().toISOString();
		}

		// after set dates, finaly test...
		if (req.body.dueDate && req.body.availableDate >= req.body.dueDate) {
			req.session.notification = {
				type: 'danger',
				message: res.$t('homework._task.text.startDateBeforeSubmissionDate'),
			};
			redirectHelper.safeBackRedirect(req, res);
			return;
		}
	}

	handleTeamSubmissionsBody(req.body, res.locals.currentUser);

	if (req.body.teamMembers && typeof req.body.teamMembers === 'string') {
		req.body.teamMembers = [req.body.teamMembers];
	}
	let referrer = (req.body.referrer)
		? (req.body.referrer)
		: ((req.header('Referer').indexOf('homework/new') !== -1)
			? '/homework'
			: req.header('Referer'));
	delete req.body.referrer;
	api(req).post(`/${service}/`, {
		// TODO: sanitize
		json: req.body,
	}).then((data) => {
		if (data.courseId && !data.private && service === 'homework') {
			api(req).get(`/courses/${data.courseId}`)
				.then((course) => {
					sendNotification(data.courseId,
						res.$t('homework._task.text.newHomeworkCourseNotification',
							{ coursename: course.name }),
						res.$t('homework._task.text.newHomeworkDueDateNotification',
							{
								homeworkname: data.name,
								duedate: timesHelper
									.fromUTC(data.dueDate)
									.format(res.$t('format.dateTime')),
							}),
						data.teacherId,
						req,
						`${(req.headers.origin || HOST)}/homework/${data._id}`);
				});
		}
		const promise = service === 'submissions'
			? addFilePermissionsForTeamMembers(req, data.teamMembers, data.courseGroupId, data.fileIds)
			: Promise.resolve({});
		return promise.then((_) => {
			if (service === 'homework') {
				if (req.body.courseId) {
					// homework was created from inside a course with course reference
					referrer = `/courses/${data.courseId}?activeTab=homeworks`;
				} else if (!req.body.courseId && referrer.includes('/courses')) {
					// homework is created inside a course but course reference was unset before create ("Kurs = Keine Zuordnung")
					referrer = `${(req.headers.origin || HOST)}/homework/${data._id}`;
				} else {
					// homework was created from homeworks overview
					referrer += data._id;
				}
			} else if (service === 'submissions') {
				referrer += '#activetabid=submissions';
			}
			// includes submission was done
			res.redirect(referrer);
		});
	}).catch((err) => {
		next(err);
	});
};

const sendNotification = (courseId, title, message, userId, req, link) => {
	if (NOTIFICATION_SERVICE_ENABLED) {
		api(req).post('/notification/messages', {
			json: {
				title,
				body: message,
				token: userId,
				priority: 'high',
				action: link,
				scopeIds: [
					courseId,
				],
			},
		});
	}
};

/**
 * adds file permissions for co workers to a submission file
 */
const addFilePermissionsForTeamMembers = (req, teamMembers, courseGroupId, fileIds) => {
	// if submission has an courseGroup, use the corresponding users instead of teamMembers
	const courseGroupPromise = courseGroupId
		? api(req).get(`/courseGroups/${courseGroupId}`, { qs: { $populate: ['userIds'] } })
		: Promise.resolve({ userIds: teamMembers });
	const filePromises = fileIds.map((f) => api(req).get(`/files/${f}`));

	return Promise.all([courseGroupPromise, Promise.all(filePromises)])
		.then(([{ userIds }, files]) => {
			const filePatchPromises = files.map((file) => {
				const userPermissions = userIds
					.filter((id) => file.permissions.findIndex((p) => p.refId.toString() === id.toString()) === -1)
					.map((id) => ({
						refId: id,
						refPermModel: 'user',
						write: false,
						read: true,
						create: false,
						delete: false,
					}));

				file.permissions = [...file.permissions, ...userPermissions];

				return api(req).patch(`/files/${file._id}`, { json: file });
			});
			return Promise.all(filePatchPromises);
		});
};

const patchFunction = (service, req, res, next) => {
	if (req.body.referrer) {
		var referrer = req.body.referrer.replace('/edit', '');
		delete req.body.referrer;
	}
	api(req).patch(`/${service}/${req.params.id}`, {
		// TODO: sanitize
		json: req.body,
	}).then((data) => {
		if (service === 'submissions') {
			// add file permissions for co Worker
			const { fileIds } = data;
			const { teamMembers } = data;
			const { courseGroupId } = data;

			return addFilePermissionsForTeamMembers(req, teamMembers, courseGroupId, fileIds).then((_) => {
				api(req).get(`/homework/${data.homeworkId}`, { qs: { $populate: ['courseId'] } })
					.then((homework) => {
						sendNotification(data.studentId,
							res.$t('homework._task.text.submissionGradedNotification', {
								coursename: homework.courseId.name,
							}),
							' ',
							data.studentId,
							req,
							`${(req.headers.origin || HOST)}/homework/${homework._id}`);
					});
				const redirect_path = `${req.header('Referrer')}#activetabid=submissions`;
				res.redirect(redirect_path);
			});
		}
		if (referrer) {
			res.redirect(referrer);
		} else {
			res.sendStatus(200);
		}
	}).catch((err) => {
		next(err);
	});
};

const getUpdateHandler = (service) => function updateHandler(req, res, next) {
	let referrer;
	if (service === 'homework') {
		// check archived
		if (req.body.archive) {
			return api(req).get(`/homework/${req.params.id}`, {}).then((homework) => {
				const archived = homework.archived || [];
				if (archived.includes(res.locals.currentUser._id) && req.body.archive === 'open') {
					archived.splice(homework.archived.indexOf(res.locals.currentUser._id), 1);
				} else if (!archived.includes(res.locals.currentUser._id) && req.body.archive === 'done') {
					archived.push(res.locals.currentUser._id);
				}
				req.body.archived = archived;
				delete req.body.archive;
				return patchFunction(service, req, res, next);
			});
		}
		if ((!req.body.courseId) || (req.body.courseId && req.body.courseId.length <= 2)) {
			req.body.courseId = null;
			req.body.private = true;
		}
		if ((!req.body.lessonId) || (req.body.lessonId && req.body.lessonId.length <= 2)) {
			req.body.lessonId = null;
		}

		req.body.private = !!req.body.private;
		req.body.publicSubmissions = !!req.body.publicSubmissions;
		req.body.teamSubmissions = !!req.body.teamSubmissions;

		// rewrite german format to ISO
		if (req.body.availableDate) {
			req.body.availableDate = timesHelper
				.dateTimeStringToMoment(req.body.availableDate)
				.toISOString();
		}
		if (req.body.dueDate) {
			req.body.dueDate = timesHelper
				.dateTimeStringToMoment(req.body.dueDate)
				.toISOString();
		}
		if (req.body.availableDate && req.body.dueDate && req.body.availableDate >= req.body.dueDate) {
			req.session.notification = {
				type: 'danger',
				message: res.$t('homework._task.text.startDateBeforeSubmissionDate'),
			};
			if (req.body.referrer) {
				referrer = req.body.referrer.replace('/edit', '');
				delete req.body.referrer;
			}
			return res.redirect(referrer);
		}
	}
	if (service === 'submissions') {
		if (req.body.teamMembers && typeof req.body.teamMembers === 'string') {
			req.body.teamMembers = [req.body.teamMembers];
		}
		if (req.body.grade) {
			req.body.grade = parseInt(req.body.grade, 10);
		}
		handleTeamSubmissionsBody(req.body, res.locals.currentUser);
	}
	return patchFunction(service, req, res, next);
};


const getImportHandler = (service) => (req, res, next) => {
	api(req).get(`/${service}/${req.params.id}`).then(
		(data) => {
			res.json(data);
		},
	).catch((err) => {
		next(err);
	});
};


const getDeleteHandler = (service, redirectToReferer) => (req, res, next) => {
	api(req).delete(`/${service}/${req.params.id}`).then((_) => {
		if (redirectToReferer) {
			redirectHelper.safeBackRedirect(req, res);
		} else {
			res.sendStatus(200);
			res.redirect(`/${service}`);
		}
	}).catch((err) => {
		next(err);
	});
};

router.post('/', getCreateHandler('homework'));
router.patch('/:id', getUpdateHandler('homework'));
router.delete('/:id', getDeleteHandler('homework'));

router.delete('/:id/file', (req, res, next) => {
	const { fileId } = req.body;
	const homeworkId = req.params.id;
	api(req).get(`/homework/${homeworkId}`).then((homework) => {
		const fileIds = _.filter(homework.fileIds, (id) => JSON.stringify(id) !== JSON.stringify(fileId));
		return api(req).patch(`/homework/${homeworkId}`, {
			json: {
				fileIds,
			},
		});
	})
		.then((result) => res.json(result))
		.catch((err) => next(err));
});

router.get('/submit/:id/import', getImportHandler('submissions'));
router.patch('/submit/:id', getUpdateHandler('submissions'));
router.post('/submit', getCreateHandler('submissions'));
router.delete('/submit/:id', getDeleteHandler('submissions', true));
router.get('/submit/:id/delete', getDeleteHandler('submissions', true));

router.post('/submit/:id/files', (req, res, next) => {
	const submissionId = req.params.id;
	api(req).get(`/submissions/${submissionId}`).then((submission) => {
		delete submission.grade;
		delete submission.gradeComment;
		delete submission.comment;

		const files = req.body.fileId || req.body.fileIds;
		submission.fileIds = submission.fileIds.concat(files);

		return api(req).patch(`/submissions/${submissionId}`, {
			json: submission,
		});
	})
		.then((result) => res.json(result))
		.catch((err) => next(err));
});

router.post('/submit/:id/grade-files', (req, res, next) => {
	const submissionId = req.params.id;
	api(req).get(`/submissions/${submissionId}`).then((submission) => {
		if ('fileId' in req.body) {
			submission.gradeFileIds.push(req.body.fileId);
		} else if ('fileIds' in req.body) {
			submission.gradeFileIds = submission.gradeFileIds.concat(req.body.fileIds);
		}
		return api(req).patch(`/submissions/${submissionId}`, {
			json: submission,
		});
	})
		.then((result) => res.json(result))
		.catch((err) => next(err));
});

/* adds shared permission for teacher in the corresponding homework */
router.post('/submit/:id/files/:fileId/permissions', async (req, res) => {
	const { fileId, id: submissionId } = req.params;
	const { homeworkId, teamMembers } = req.body;

	// if homework is already given, just fetch homework
	const homeworkPromise = homeworkId
		? api(req).get(`/homework/${homeworkId}`)
		: api(req).get(`/submissions/${submissionId}`, { qs: { $populate: ['homeworkId'] } });

	const filePromise = api(req).get(`/files/${fileId}`);
	const promises = teamMembers ? [filePromise, homeworkPromise] : [filePromise];

	try {
		const [file, homework] = await Promise.all(promises);

		if (teamMembers) {
			// wait for result now
			// todo move logic to backend
			await addFilePermissionsForTeamMembers(
				req, teamMembers, homework.courseGroupId, [fileId],
			);
		}
		res.json(file);
	} catch (err) {
		res.send(err);
	}
});

router.delete('/submit/:id/files', (req, res, next) => {
	const submissionId = req.params.id;
	api(req).get(`/submissions/${submissionId}`).then((submission) => {
		submission.fileIds = _.filter(submission.fileIds, (id) => JSON.stringify(id) !== JSON.stringify(req.body.fileId));
		return api(req).patch(`/submissions/${submissionId}`, {
			json: submission,
		});
	})
		.then((result) => res.json(result))
		.catch((err) => next(err));
});

router.post('/comment', getCreateHandler('comments'));
router.delete('/comment/:id', getDeleteHandler('comments', true));

const overview = (titleKey) => (req, res, next) => {
	const { _id: userId, schoolId } = res.locals.currentUser || {};
	let query = {
		$populate: ['courseId'],
		archived: { $ne: res.locals.currentUser._id },
		schoolId,
	};

	const tempOrgQuery = (req.query || {}).filterQuery;
	const filterQueryString = (tempOrgQuery) ? (`&filterQuery=${escape(tempOrgQuery)}`) : '';

	let itemsPerPage = 10;
	if (tempOrgQuery) {
		const filterQuery = JSON.parse(unescape(req.query.filterQuery));
		if (filterQuery.$limit) {
			itemsPerPage = filterQuery.$limit;
		}
		query = Object.assign(query, filterQuery);
	} else {
		if (req._parsedUrl.pathname.includes('private')) {
			query.private = true;
		}
		if (req._parsedUrl.pathname.includes('asked')) {
			query.private = { $ne: true };
		}
	}
	if (req._parsedUrl.pathname.includes('archive')) {
		query.archived = userId;
	}
	// TODO: homework and user in Promise.all, remove populate courseId in homeworks
	api(req).get('/homework/', {
		qs: query,
	}).then((homeworks) => {
		// ist der aktuelle Benutzer ein Schueler? -> Für Sichtbarkeit von Daten benötigt
		api(req).get(`/users/${userId}`, {
			qs: {
				$populate: ['roles'],
			},
		}).then((user) => {
			const isStudent = (user.roles.map((role) => role.name).indexOf('student') != -1);

			homeworks = homeworks.data.map((assignment) => { // alle Hausaufgaben aus DB auslesen
				// kein Kurs -> Private Hausaufgabe
				if (assignment.courseId == null) {
					assignment.color = '#1DE9B6';
					assignment.private = true;
				} else {
					if (!assignment.private) {
						assignment.userIds = assignment.courseId.userIds;
					}
					// Kursfarbe setzen
					assignment.color = assignment.courseId.color;
				}
				// Schüler sehen Beginndatum nicht in der Übersicht über gestellte Aufgaben (übersichtlicher)
				if (!assignment.private && isStudent) {
					delete assignment.availableDate;
				}

				assignment.url = `/homework/${assignment._id}`;
				assignment.privateclass = assignment.private ? 'private' : ''; // Symbol für Private Hausaufgabe anzeigen?

				assignment.currentUser = res.locals.currentUser;

				assignment.isSubstitution = !assignment.private && ((assignment.courseId || {}).substitutionIds || []).includes(assignment.currentUser._id.toString());
				assignment.isTeacher = assignment.isSubstitution
						|| ((assignment.courseId || {}).teacherIds || []).includes(assignment.currentUser._id.toString())
						|| assignment.teacherId == res.locals.currentUser._id;
				assignment.actions = getActions(res, assignment, '/homework/');
				if (!assignment.isTeacher) {
					assignment.stats = undefined;
				}

				// convert UTC dates to current timezone
				if (assignment.availableDate) {
					assignment.availableDate = timesHelper.fromUTC(assignment.availableDate);
				}
				if (assignment.dueDate) {
					assignment.dueDate = timesHelper.fromUTC(assignment.dueDate);
				}

				const dueDateArray = timesHelper.splitDate(assignment.dueDate, res.$t('format.date'));
				assignment.submittable = dueDateArray.timestamp >= timesHelper.now() || !assignment.dueDate;
				assignment.warning = ((dueDateArray.timestamp <= (timesHelper.now() + (24 * 60 * 60 * 1000)))
					&& assignment.submittable);
				return assignment;
			});

			const coursesPromise = getSelectOptions(req, `users/${res.locals.currentUser._id}/courses`, {
				$limit: false,
			});
			Promise.resolve(coursesPromise).then((courses) => {
				const courseList = courses.map((course) => [course._id, course.name]);
				const filterSettings =						[{
					type: 'sort',
					title: res.$t('global.headline.sorting'),
					displayTemplate: res.$t('global.label.sortBy'),
					options: [
						['createdAt', res.$t('global.label.creationDate')],
						['updatedAt', res.$t('homework.label.sortByLastUpdate')],
						['availableDate', res.$t('homework.label.sortByAvailabilityDate')],
						['dueDate', res.$t('homework.label.sortByDueDate')],
					],
					defaultSelection: 'dueDate',
				},
				{
					type: 'select',
					title: res.$t('global.sidebar.link.administrationCourses'),
					displayTemplate: res.$t('homework.label.filterCourses'),
					property: 'courseId',
					multiple: true,
					expanded: true,
					options: courseList,
				},
				{
					type: 'date',
					title: res.$t('homework.headline.dueDate'),
					displayTemplate: res.$t('homework.label.filterDueDate'),
					property: 'dueDate',
					mode: 'fromto',
					fromLabel: res.$t('homework.label.filterDueDateFrom'),
					toLabel: res.$t('homework.label.filterDueDateTo'),
				},
				{
					type: 'boolean',
					title: res.$t('homework.headline.more'),
					options: {
						private: res.$t('homework.label.filterMorePrivateTask'),
						publicSubmissions: res.$t('homework.label.filterMorePublicSubmissions'),
						teamSubmissions: res.$t('homework.label.filterMoreTeamSubmissions'),
					},
					defaultSelection: {
						private: ((query.private !== undefined) ? ((query.private === true)) : undefined),
					},
					applyNegated: {
						private: [true, false],
						publicSubmissions: [true, false],
						teamSubmissions: [true, false],
					},
				}];
					// Pagination in client, because filters are in afterhook
				const currentPage = parseInt(req.query.p) || 1;
				const pagination = {
					currentPage,
					numPages: Math.ceil(homeworks.length / itemsPerPage),
					baseUrl: `${req.baseUrl + req._parsedUrl.pathname}?`
							+ `p={{page}}${filterQueryString}`,
				};
				const end = currentPage * itemsPerPage;
				homeworks = homeworks.slice(end - itemsPerPage, end);
				// Render overview
				res.render('homework/overview', {
					title: titleKey ? res.$t(titleKey) : '',
					pagination,
					homeworks,
					courses,
					filterSettings: JSON.stringify(filterSettings),
					addButton: (req._parsedUrl.pathname == '/'
						|| req._parsedUrl.pathname.includes('private')
						|| (req._parsedUrl.pathname.includes('asked')
							&& !isStudent)
					),
					createPrivate: req._parsedUrl.pathname.includes('private') || isStudent,
				});
			});
		});
	}).catch((err) => {
		next(err);
	});
};

router.get('/', overview('global.headline.tasks'));
router.get('/asked', overview('global.headline.assignedTasks'));
router.get('/private', overview('homework.headline.drafts'));
router.get('/archive', overview('homework.headline.archivedTasks'));

router.get('/new', (req, res, next) => {
	const coursesPromise = getSelectOptions(req, `users/${res.locals.currentUser._id}/courses`, {
		$limit: false,
	});
	Promise.resolve(coursesPromise).then(async (courses) => {
		courses = courses.sort((a, b) => (a.name.toUpperCase() < b.name.toUpperCase()) ? -1 : 1);
		let lessons = [];
		if (req.query.course) {
			lessonsPromise = getSelectOptions(req, 'lessons', {
				courseId: req.query.course,
			});
			try {
				lessons = await lessonsPromise;
			} catch (error) {
				// TODO log error
				logger.error('Error getting lessons', error);
			}
			lessons = (lessons || []).sort((a, b) => (a.name.toUpperCase() < b.name.toUpperCase()) ? -1 : 1);
		}
		const assignment = { private: (req.query.private == 'true') };
		if (req.query.course) {
			assignment.courseId = { _id: req.query.course };
		}
		if (req.query.topic) {
			assignment.lessonId = req.query.topic;
		}
		// Render overview
		res.render('homework/edit', {
			title: res.$t('global.button.addTask'),
			submitLabel: res.$t('global.button.add'),
			closeLabel: res.$t('global.button.cancel'),
			method: 'post',
			action: '/homework/',
			referrer: req.query.course ? `/courses/${req.query.course}/?activeTab=homeworks` : '/homework/',
			assignment,
			courses,
			lessons: lessons.length ? lessons : false,
		});
	});
});

router.get('/:assignmentId/copy', (req, res, next) => {
	api(req).get(`/homework/copy/${req.params.assignmentId}`)
		.then((assignment) => {
			if (!assignment || !assignment._id) {
				const error = new Error(res.$t('homework._task.text.errorInvalidTaskId'));
				error.status = 500;
				return next(error);
			}
			return res.redirect(`/homework/${assignment._id}/edit`);
		}).catch((err) => {
			next(err);
		});
});

router.get('/:assignmentId/edit', (req, res, next) => {
	api(req).get(`/homework/${req.params.assignmentId}`, {
		qs: {
			$populate: ['courseId', 'fileIds'],
		},
	}).then((assignment) => {
		const isTeacher = (assignment.teacherId == res.locals.currentUser._id) || ((assignment.courseId || {}).teacherIds || []).includes(res.locals.currentUser._id);
		const isSubstitution = ((assignment.courseId || {}).substitutionIds || []).includes(res.locals.currentUser._id);
		if (!isTeacher && !isSubstitution) {
			const error = new Error("You don't have permissions!");
			error.status = 403;
			return next(error);
		}

		assignment.availableDate = timesHelper.fromUTC(assignment.availableDate);
		assignment.dueDate = timesHelper.fromUTC(assignment.dueDate);

		addClearNameForFileIds(assignment);
		// assignment.submissions = assignment.submissions.map((s) => { return { submission: s }; });

		const coursesPromise = getSelectOptions(req, `users/${res.locals.currentUser._id}/courses`, {
			$limit: false,
		});

		Promise.resolve(coursesPromise).then((courses) => {
			courses.sort((a, b) => (a.name.toUpperCase() < b.name.toUpperCase()) ? -1 : 1);
			// ist der aktuelle Benutzer ein Schueler? -> Für Modal benötigt
			if (assignment.courseId && assignment.courseId._id) {
				const lessonsPromise = getSelectOptions(req, 'lessons', {
					courseId: assignment.courseId._id,
				});
				Promise.resolve(lessonsPromise).then((lessons) => {
					(lessons || []).sort((a, b) => (a.name.toUpperCase() < b.name.toUpperCase()) ? -1 : 1);
					res.render('homework/edit', {
						title: res.$t('homework._task.headline.editTask'),
						submitLabel: res.$t('global.button.save'),
						closeLabel: res.$t('global.button.cancel'),
						method: 'patch',
						action: `/homework/${req.params.assignmentId}`,
						referrer: '/homework/',
						assignment,
						courses,
						lessons,
						isSubstitution,
					});
				});
			} else {
				res.render('homework/edit', {
					title: res.$t('homework._task.headline.editTask'),
					submitLabel: res.$t('global.button.save'),
					closeLabel: res.$t('global.button.cancel'),
					method: 'patch',
					action: `/homework/${req.params.assignmentId}`,
					referrer: '/homework/',
					assignment,
					courses,
					lessons: false,
					isSubstitution,
				});
			}
		});
	}).catch((err) => {
		next(err);
	});
});

// files>single=student=upload,teacher=upload || files>multi=teacher=overview ||
const addClearNameForFileIds = (files) => {
	if (files == undefined) return;

	if (files.length > 0) {
		files.forEach((submission) => {
			addClearNameForFileIds(submission);
		});
	} else if (files.fileIds && files.fileIds.length > 0) {
		return files.fileIds.map((file) => {
			if (file.name) {
				file.clearName = file.name.replace(/%20/g, ' '); // replace to spaces
			}
			return file;
		});
	}
};

router.get('/:assignmentId', (req, res, next) => {
	api(req).get(`/homework/${req.params.assignmentId}`, {
		qs: {
			$populate: ['courseId', 'fileIds'],
		},
	}).then((assignment) => {
		// Kursfarbe setzen
		assignment.color = (assignment.courseId && assignment.courseId.color) ? assignment.courseId.color : '#1DE9B6';

		// convert UTC dates to current timezone
		if (assignment.availableDate) {
			assignment.availableDate = timesHelper.fromUTC(assignment.availableDate);
		}
		if (assignment.dueDate) {
			assignment.dueDate = timesHelper.fromUTC(assignment.dueDate);
		}
			const dueDateTimeStamp = timesHelper.splitDate(assignment.dueDate, res.$t('format.date')).timestamp;
			assignment.submittable = (dueDateTimeStamp >= timesHelper.now() || !assignment.dueDate);
			assignment.warning = ((dueDateTimeStamp <= (timesHelper.now() + (24 * 60 * 60 * 1000)))
				&& assignment.submittable);



		// file upload path, todo: maybe use subfolders
		const submissionUploadPath = `users/${res.locals.currentUser._id}/`;

		const breadcrumbTitle = ((assignment.archived || []).includes(res.locals.currentUser._id))
			? (res.$t('homework.headline.breadcrumbArchived'))
			: ((assignment.private)
				? (res.$t('homework.headline.breadcrumbPrivate'))
				: (res.$t('homework.headline.breadcrumbAssigned')));
		const breadcrumbUrl = ((assignment.archived || []).includes(res.locals.currentUser._id))
			? ('/homework/archive')
			: ((assignment.private)
				? ('/homework/private')
				: ('/homework/asked'));
		const promises = [
			// Abgaben auslesen
			api(req).get('/submissions/', {
				qs: {
					homeworkId: assignment._id,
					$populate: ['homeworkId', 'fileIds', 'gradeFileIds', 'teamMembers', 'studentId', 'courseGroupId'],
				},
			}),
		];

		if (assignment.courseId && assignment.courseId._id) {
			promises.push(
				// Alle Teilnehmer des Kurses
				api(req).get(`/courses/${assignment.courseId._id}`, {
					qs: {
						$populate: ['userIds'],
					},
				}),
			);

			promises.push(
				// Schülergruppen für Kurs
				api(req).get('/courseGroups/', {
					qs: {
						courseId: assignment.courseId._id,
						$populate: ['userIds'],
					},
				}),
			);
		}
		Promise.all(promises).then(([submissions, course, courseGroups]) => {
			assignment.submission = (submissions || {}).data.map((submission) => {
				submission.teamMemberIds = (submission.teamMembers || []).map((e) => e._id);
				submission.courseGroupMemberIds = (submission.courseGroupId || {}).userIds;
				submission.courseGroupMembers = (_.find((courseGroups || {}).data, (cg) => JSON.stringify(cg._id) === JSON.stringify((submission.courseGroupId || {})._id)) || {}).userIds; // need full user objects here, double populating not possible above
				return submission;
			}).filter((submission) => ((submission.studentId || {})._id == res.locals.currentUser._id)
					|| (submission.teamMemberIds.includes(res.locals.currentUser._id.toString()))
					|| ((submission.courseGroupMemberIds || []).includes(res.locals.currentUser._id.toString())))[0];

			courseGroups = permissionHelper.userHasPermission(res.locals.currentUser, 'COURSE_EDIT')
				? ((courseGroups || {}).data || [])
				: ((courseGroups || {}).data || [])
					.filter((cg) => cg.userIds.some((user) => user._id === res.locals.currentUser._id))
					.filter((cg) => (assignment.maxTeamMembers ? cg.userIds.length <= assignment.maxTeamMembers : true)); // filter to big courseGroups

			const courseGroupSelected = ((assignment.submission || {}).courseGroupId || {})._id;

			const students = ((course || {}).userIds || []).filter((user) => (user.firstName && user.lastName))
				.sort((a, b) => ((a.lastName.toUpperCase() < b.lastName.toUpperCase()) ? -1 : 1))
				.sort((a, b) => ((a.firstName.toUpperCase() < b.firstName.toUpperCase()) ? -1 : 1));


			const assignmentCourse = (assignment.courseId || {});
			const isCreator = assignment.teacherId.toString() === res.locals.currentUser._id.toString();
			const isCourseTeacher = (assignmentCourse.teacherIds || []).includes(res.locals.currentUser._id);
			const isCourseSubstitutionTeacher = (assignmentCourse.substitutionIds || []).includes(res.locals.currentUser._id);
			const isTeacher = isCreator || isCourseTeacher || isCourseSubstitutionTeacher;

			const renderOptions = {
				title: (assignment.courseId == null)
					? assignment.name
					: (`${assignment.courseId.name} - ${assignment.name}`),
				breadcrumb: [
					{
						title: res.$t('homework.headline.breadcrumb', { breadcrumbtitle: breadcrumbTitle }),
						url: breadcrumbUrl,
					},
				],
				isTeacher,
				students,
				courseGroups,
				courseGroupSelected,
				path: submissionUploadPath,
			};

			// Abgabenübersicht anzeigen -> weitere Daten berechnen
			if (!assignment.private && (isTeacher || assignment.publicSubmissions)) {
				// Daten für Abgabenübersicht
				const sortByStudentAttribute = (attr) => (a, b) => ((a.studentId[attr].toUpperCase() < b.studentId[attr].toUpperCase()) ? -1 : 1);
				assignment.submissions = submissions.data.filter((submission) => submission.studentId)
					.sort(sortByStudentAttribute('lastName'))
					.sort(sortByStudentAttribute('firstName'))
					.map((sub) => {
						if (Array.isArray(sub.teamMembers)) {
							sub.teamMembers = sub.teamMembers
								.sort((a, b) => ((a.lastName.toUpperCase() < b.lastName.toUpperCase()) ? -1 : 1))
								.sort((a, b) => ((a.firstName.toUpperCase() < b.firstName.toUpperCase()) ? -1 : 1));
						}
						return sub;
					});
				const studentSubmissions = students.map((student) => ({
					student,
					submission: assignment.submissions.filter((submission) => (submission.studentId._id == student._id)
								|| (submission.teamMembers && submission.teamMembers.includes(student._id.toString())))[0],
				}));

				const studentsWithSubmission = [];
				assignment.submissions.forEach((e) => {
					if (e.courseGroupId) {
						e.courseGroupMembers.forEach((c) => {
							studentsWithSubmission.push(c._id.toString());
						});
					} else if (e.teamMembers) {
						e.teamMembers.forEach((c) => {
							studentsWithSubmission.push(c._id.toString());
						});
					} else {
						studentsWithSubmission.push(e.studentId.toString());
					}
				});
				const studentsWithoutSubmission = [];
				((assignment.courseId || {}).userIds || []).forEach((e) => {
					if (!studentsWithSubmission.includes(e.toString())) {
						studentsWithoutSubmission.push(
							studentSubmissions.filter((s) => (s.student._id.toString() == e.toString())).map((s) => s.student)[0],
						);
					}
				});
				studentsWithoutSubmission.sort((a, b) => ((a.lastName.toUpperCase() < b.lastName.toUpperCase()) ? -1 : 1))
					.sort((a, b) => ((a.firstName.toUpperCase() < b.firstName.toUpperCase()) ? -1 : 1));


				// submission>single=student=upload || submissionS>multi=teacher=overview
				addClearNameForFileIds(assignment.submission || assignment.submissions);
				assignment.submissions = assignment.submissions.map((s) => ({ submission: s }));

				renderOptions.studentSubmissions = studentSubmissions;
				renderOptions.studentsWithoutSubmission = studentsWithoutSubmission;

				renderOptions.ungradedFileSubmissions = collectUngradedFiles(submissions.data);
			}

			if (assignment.submission) {
				assignment.submission.hasFile = false;
				if (assignment.submission.fileIds.length > 0) {
					assignment.submission.hasFile = true;
				}
			}

			res.render('homework/assignment', { ...assignment, ...renderOptions });
		});
	}).catch(next);
});

function collectUngradedFiles(submissions) {
	const ungradedSubmissionsWithFiles = submissions.filter(
		(submission) => !isGraded(submission) && !_.isEmpty(submission.fileIds),
	);
	const ungradedFiles = ungradedSubmissionsWithFiles.flatMap((submission) => submission.fileIds);
	const fileNames = _.fromPairs(
		submissions.flatMap((submission) => submission.fileIds.map((file) => [
			getGradingFileName(file),
			{ submissionId: submission._id, teamMemberIds: submission.teamMemberIds },
		])),
	);

	return {
		empty: _.isEmpty(ungradedFiles),
		urls: ungradedFiles.map(getGradingFileDownloadPath).join(' '),
		fileNames,
	};
}

module.exports = router;
