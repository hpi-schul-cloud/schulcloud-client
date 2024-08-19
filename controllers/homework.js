/* eslint-disable max-len */
/* eslint no-confusing-arrow: 0 */
/*
 * One Controller per layout view
 */

const express = require('express');
const handlebars = require('handlebars');
const _ = require('lodash');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const permissionHelper = require('../helpers/permissions');
const redirectHelper = require('../helpers/redirect');
const { logger, formatError } = require('../helpers');
const { NOTIFICATION_SERVICE_ENABLED, HOST } = require('../config/global');
const timesHelper = require('../helpers/timesHelper');
const filesStoragesHelper = require('../helpers/files-storage');

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
	link: path + item._id,
	class: 'btn-delete',
	icon: 'trash-o',
	method: 'DELETE',
	title: res.$t('homework.button.deleteSubmissionFromList'),
},
];

const handleTeamSubmissionsBody = (body, currentUser) => {
	if (body.isEvaluation) {
		return;
	}

	body.teamSubmissionOptions === 'courseGroup' ? body.teamMembers = [currentUser._id] : body.courseGroupId = null;
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

function collectUngradedFiles(submissions) {
	const ungradedSubmissionsWithFiles = submissions.filter((submission) => !submission.submission.graded);
	const ungradedFiles = ungradedSubmissionsWithFiles.flatMap((submission) => submission.submission.submissionFiles.filesStorage.files);

	return {
		empty: _.isEmpty(ungradedFiles),
		urls: ungradedFiles.map(filesStoragesHelper.getFileDownloadPath).join(' '),
		fileNames: ungradedFiles.map((file) => file.name),
	};
}

const prepareRequestBodyForHomework = (service, req, res) => {
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
			return false;
		}
	}

	return true;
};

const prepareRequestBodyForSubmission = (service, req, res) => {
	if (service === 'submissions') {
		handleTeamSubmissionsBody(req.body, res.locals.currentUser);

		if (req.body.teamMembers && typeof req.body.teamMembers === 'string') {
			req.body.teamMembers = [req.body.teamMembers];
		}
	}
};

const getCreateHandler = (service) => (req, res, next) => {
	if (!prepareRequestBodyForHomework(service, req, res)) return;

	prepareRequestBodyForSubmission(service, req, res);

	let referrer;
	let base = req.headers.origin || HOST;
	if (service === 'submissions') {
		base = req.header('Referrer');
	}
	if (req.body.referrer) {
		referrer = req.body.referrer;
	} else if (req.header('Referer').indexOf('homework/new') !== -1) {
		referrer = '/homework';
	} else {
		referrer = req.header('Referer');
	}
	delete req.body.referrer;

	api(req).post(`/${service}/`, {
		// TODO: sanitize
		json: req.body,
	}).then((data) => {
		if (data.courseId && !data.private && service === 'homework') {
			api(req).get(`/courses/${data.courseId}`)
				.then((course) => {
					sendNotification(
						data.courseId,
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
						`${base}/${referrer}`,
					);
				}).catch((err) => {
					next(err);
				});
		}

		if (referrer === 'tasks' || referrer.includes('rooms')) {
			referrer = `homework/${data._id}`;
		}
		const url = new URL(referrer, base);
		res.redirect(url);
	}).catch((err) => {
		next(err);
	});
};

const getSilentCreateHandler = (service) => (req, res, next) => {
	if (service === 'homework') {
		if (req.body.name === '') {
			req.body.name = res.$t('global.label.title');
		}
		req.body.private = true;
	}

	if (!prepareRequestBodyForHomework(service, req, res)) return;

	if (service === 'submissions' && !req.body.isEvaluation && !req.body.teamMembers) {
		req.body.teamMembers = [req.body.studentId];
	}

	prepareRequestBodyForSubmission(service, req, res);

	api(req).post(`/${service}/`, {
		json: req.body,
	}).then((data) => {
		data.availableDate = timesHelper
			.fromUTC(data.availableDate)
			.format(res.$t('format.dateTime'));

		if (data.dueDate) {
			data.dueDate = timesHelper
				.fromUTC(data.dueDate)
				.format(res.$t('format.dateTime'));
		}

		res.json(data);
	}).catch((err) => {
		next(err);
	});
};

const getDomain = (url) => {
	let domain;
	try {
		domain = new URL(url);
		return domain.hostname;
	} catch (e) {
		return false;
	}
};

const sanitizeRefererDomain = (allowedDomain, referrer) => {
	const domain = getDomain(referrer);
	if (domain && allowedDomain.indexOf(domain.hostname) === -1) {
		referrer = '/';
	}
	return referrer;
};

const patchFunction = (service, req, res, next) => {
	let referrer;
	let base = req.headers.origin || HOST;
	if (req.body.referrer) {
		referrer = req.body.referrer;
		referrer = sanitizeRefererDomain(base, referrer);
		delete req.body.referrer;
	}

	api(req).patch(`/${service}/${req.params.id}`, {
		// TODO: sanitize
		json: req.body,
	}).then(async (data) => {
		if (service === 'submissions') {
			api(req).get(`/homework/${data.homeworkId}`, { qs: { $populate: ['courseId'] } })
				.then((homework) => {
					sendNotification(data.studentId,
						res.$t('homework._task.text.submissionGradedNotification', {
							coursename: homework.courseId.name,
						}),
						' ',
						data.studentId,
						req,
						`${base}/homework/${homework._id}`);
				});
			base = req.header('Referrer');
		}
		if (referrer) {
			const url = new URL(referrer, base);
			res.redirect(url);
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
				referrer = req.body.referrer;
				delete req.body.referrer;
			}
			const url = new URL(referrer, req.headers.origin || HOST);
			return res.redirect(url);
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
	api(req, { version: 'v3' }).delete(`/${service}/${req.params.id}`).then((_) => {
		if (redirectToReferer) {
			redirectHelper.safeBackRedirect(req, res);
		} else {
			res.redirect(200, `/${service}`);
		}
	}).catch((err) => {
		next(err);
	});
};

router.post('/', getCreateHandler('homework'));
router.post('/silent', getSilentCreateHandler('homework'));
router.patch('/:id', getUpdateHandler('homework'));
router.delete('/:id', getDeleteHandler('tasks'));

router.get('/submit/:id/import', getImportHandler('submissions'));
router.patch('/submit/:id', getUpdateHandler('submissions'));
router.post('/submit', getCreateHandler('submissions'));
router.post('/submit/silent', getSilentCreateHandler('submissions'));
router.delete('/submit/:id', getDeleteHandler('submissions', true));
router.get('/submit/:id/delete', getDeleteHandler('submissions', true));

router.post('/comment', getCreateHandler('comments'));
router.delete('/comment/:id', getDeleteHandler('comments', true));

router.get('/new', (req, res, next) => {
	const coursesPromise = getSelectOptions(req, `users/${res.locals.currentUser._id}/courses`, {
		$limit: false,
	});
	Promise.resolve(coursesPromise).then(async (courses) => {
		courses = courses.sort((a, b) => (a.name.toUpperCase() < b.name.toUpperCase()) ? -1 : 1);
		let lessons = [];

		if (req.query.course) {
			const lessonsPromise = getSelectOptions(req, 'lessons', {
				courseId: req.query.course,
			});

			try {
				lessons = await lessonsPromise;
			} catch (error) {
				// TODO log error
				logger.error('Error getting lessons', formatError(error));
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
		const schoolId = res.locals.currentSchool;
		const parentType = 'tasks';
		const taskFilesStorageData = await filesStoragesHelper.filesStorageInit(schoolId, undefined, parentType, false, req);

		// Render overview
		res.render('homework/edit', {
			title: res.$t('global.headline.taskNew'),
			submitLabel: res.$t('global.button.save'),
			closeLabel: res.$t('global.button.cancel'),
			method: 'post',
			action: '/homework/',
			referrer: req.query.returnUrl || '/tasks/',
			assignment,
			courses,
			lessons: lessons.length ? lessons : false,
			taskFilesStorageData,
		});
	});
});

router.get('/:assignmentId/edit', (req, res, next) => {
	api(req).get(`/homework/${req.params.assignmentId}`, {
		qs: {
			$populate: ['courseId'],
		},
	}).then((assignment) => {
		const isTeacher = (assignment.teacherId == res.locals.currentUser._id) || ((assignment.courseId || {}).teacherIds || []).includes(res.locals.currentUser._id);
		const isSubstitution = ((assignment.courseId || {}).substitutionIds || []).includes(res.locals.currentUser._id);
		if (!isTeacher && !isSubstitution) {
			const error = new Error("You don't have permissions!");
			error.status = 403;
			return next(error);
		}

		if (assignment.availableDate) {
			assignment.availableDate = timesHelper.fromUTC(assignment.availableDate);
		} else {
			assignment.availableDate = timesHelper.currentDate().toISOString();
		}

		if (assignment.dueDate) {
			assignment.dueDate = timesHelper.fromUTC(assignment.dueDate);
		}

		const coursesPromise = getSelectOptions(req, `users/${res.locals.currentUser._id}/courses`, {
			$limit: false,
		});

		Promise.resolve(coursesPromise).then(async (courses) => {
			courses.sort((a, b) => (a.name.toUpperCase() < b.name.toUpperCase()) ? -1 : 1);
			const schoolId = res.locals.currentSchool;
			const parentId = req.params.assignmentId;
			const parentType = 'tasks';
			const taskFilesStorageData = await filesStoragesHelper.filesStorageInit(schoolId, parentId, parentType, false, req);

			// ist der aktuelle Benutzer ein Schueler? -> Für Modal benötigt
			if (assignment.courseId?._id) {
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
						referrer: req.query.returnUrl || '/tasks/',
						assignment,
						courses,
						lessons,
						isSubstitution,
						taskFilesStorageData,
					});
				});
			} else {
				res.render('homework/edit', {
					title: res.$t('homework._task.headline.editTask'),
					submitLabel: res.$t('global.button.save'),
					closeLabel: res.$t('global.button.cancel'),
					method: 'patch',
					action: `/homework/${req.params.assignmentId}`,
					referrer: req.query.returnUrl || '/tasks/',
					assignment,
					courses,
					lessons: false,
					isSubstitution,
					taskFilesStorageData,
				});
			}
		}).catch((err) => {
			next(err);
		});
	}).catch((err) => {
		next(err);
	});
});

router.get('/:assignmentId', (req, res, next) => {
	api(req).get(`/homework/${req.params.assignmentId}`, {
		qs: {
			$populate: ['courseId'],
		},
	}).then(async (assignment) => {
		// Kursfarbe setzen
		assignment.color = (assignment.courseId?.color) ? assignment.courseId.color : '#1DE9B6';

		// convert UTC dates to current timezone
		if (assignment.availableDate) {
			assignment.availableDate = timesHelper.fromUTC(assignment.availableDate);
		}

		assignment.submittable = true;
		assignment.warning = false;
		if (assignment.dueDate) {
			assignment.dueDate = timesHelper.fromUTC(assignment.dueDate);
			const dueDateTimeStamp = timesHelper.splitDate(assignment.dueDate, res.$t('format.date')).timestamp;
			assignment.submittable = (dueDateTimeStamp >= timesHelper.now());
			assignment.warning = (dueDateTimeStamp <= (timesHelper.now() + (24 * 60 * 60 * 1000))
				&& assignment.submittable);
		}

		const promises = [
			// Abgaben auslesen
			api(req).get('/submissions/', {
				qs: {
					homeworkId: assignment._id,
					$populate: ['homeworkId', 'teamMembers', 'studentId', 'courseGroupId'],
				},
			}),
		];

		if (assignment.courseId?._id) {
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
		async function findSubmissionFiles(submission, submitters, teachers, readonly) {
			const { schoolId } = submission;
			const parentId = submission._id;
			const submissionParentType = 'submissions';
			const gradeParentType = 'gradings';
			const isTeacher = teachers.has(res.locals.currentUser._id);
			const isCreator = submitters.has(res.locals.currentUser._id);
			let filesStorage = {
				schoolId,
				parentId,
				files: [],
				readonly,
			};

			if (submission.submitted || isCreator) {
				const result = await filesStoragesHelper.filesStorageInit(schoolId, parentId, submissionParentType, readonly, req);
				// eslint-disable-next-line prefer-destructuring
				filesStorage = result.filesStorage;
			}

			const submissionFilesStorageData = _.clone(filesStorage);
			submissionFilesStorageData.files = filesStorage.files.filter((file) => file.parentType === submissionParentType);
			submissionFilesStorageData.parentType = submissionParentType;
			submissionFilesStorageData.readonly = readonly || (!isCreator && isTeacher);

			const gradeFilesStorageData = _.clone(filesStorage);
			gradeFilesStorageData.files = filesStorage.files.filter((file) => file.parentType === gradeParentType);
			gradeFilesStorageData.parentType = gradeParentType;
			gradeFilesStorageData.readonly = !isTeacher;

			submission.submissionFiles = { filesStorage: submissionFilesStorageData };
			submission.gradeFiles = { filesStorage: gradeFilesStorageData };

			return submission;
		}

		const teachers = new Set();

		await Promise.all(promises).then(async ([submissions, course, courseGroups]) => {
			assignment.submission = _.cloneDeep((submissions || {}).data.map((submission) => {
				submission.teamMemberIds = (submission.teamMembers || []).map((e) => e._id);
				submission.courseGroupMemberIds = (submission.courseGroupId || {}).userIds || [];
				submission.courseGroupMembers = (_.find((courseGroups || {}).data, (cg) => JSON.stringify(cg._id) === JSON.stringify((submission.courseGroupId || {})._id)) || {}).userIds; // need full user objects here, double populating not possible above
				submission.submitters = new Set([submission.studentId, ...submission.teamMemberIds, ...submission.courseGroupMemberIds]);

				return submission;
			}).filter((submission) => ((submission.studentId || {})._id == res.locals.currentUser._id)
				|| (submission.teamMemberIds.includes(res.locals.currentUser._id.toString()))
				|| ((submission.courseGroupMemberIds || []).includes(res.locals.currentUser._id.toString())))[0]);

			courseGroups = permissionHelper.userHasPermission(res.locals.currentUser, 'COURSE_EDIT')
				? ((courseGroups || {}).data || [])
				: ((courseGroups || {}).data || [])
					.filter((cg) => cg.userIds.some((user) => user._id === res.locals.currentUser._id))
					.filter((cg) => (assignment.maxTeamMembers ? cg.userIds.length <= assignment.maxTeamMembers : true)); // filter to big courseGroups

			const courseGroupSelected = ((assignment.submission || {}).courseGroupId || {})._id;

			const students = ((course || {}).userIds || []).filter((user) => (user.firstName && user.lastName))
				.sort((a, b) => ((a.firstName.toUpperCase() < b.firstName.toUpperCase()) ? -1 : 1))
				.sort((a, b) => ((a.lastName.toUpperCase() < b.lastName.toUpperCase()) ? -1 : 1));

			const assignmentCourse = (assignment.courseId || {});

			teachers.add(assignment.teacherId);
			(assignmentCourse.teacherIds || []).forEach((teacher) => teachers.add(teacher));
			(assignmentCourse.substitutionIds || []).forEach((teacher) => teachers.add(teacher));
			const isTeacher = teachers.has(res.locals.currentUser._id);

			const renderOptions = {
				title: (assignment.courseId == null)
					? assignment.name
					: (`${assignment.courseId.name} - ${assignment.name}`),
				isTeacher,
				students,
				courseGroups,
				courseGroupSelected,
			};

			// Abgabenübersicht anzeigen -> weitere Daten berechnen
			if (!assignment.private && (isTeacher || assignment.publicSubmissions)) {
				// Daten für Abgabenübersicht
				const sortByStudentAttribute = (attr) => (a, b) => ((a.studentId[attr].toUpperCase() < b.studentId[attr].toUpperCase()) ? -1 : 1);
				assignment.submissions = submissions.data
					.sort(sortByStudentAttribute('firstName'))
					.sort(sortByStudentAttribute('lastName'))
					.map((sub) => {
						if (Array.isArray(sub.teamMembers)) {
							sub.teamMembers = sub.teamMembers
								.sort((a, b) => ((a.firstName.toUpperCase() < b.firstName.toUpperCase()) ? -1 : 1))
								.sort((a, b) => ((a.lastName.toUpperCase() < b.lastName.toUpperCase()) ? -1 : 1));
						}
						return sub;
					});
				const studentSubmissions = students.map((student) => ({
					student,
					submission: assignment.submissions.filter((submission) => (submission.teamMemberIds?.includes(student._id.toString())))[0],
				}));

				let studentsWithSubmission = [];
				assignment.submissions.forEach((e) => {
					const submitters = [];

					if (e.courseGroupId) {
						e.courseGroupMembers.forEach((c) => {
							submitters.push(c._id.toString());
						});
					} else if (e.teamMembers) {
						e.teamMembers.forEach((c) => {
							submitters.push(c._id.toString());
						});
					} else {
						submitters.push(e.studentId.toString());
					}

					e.submitters = new Set(submitters);
					studentsWithSubmission = [...studentsWithSubmission, ...submitters];
				});
				const studentsWithoutSubmission = [];
				((assignment.courseId || {}).userIds || []).forEach((e) => {
					if (!studentsWithSubmission.includes(e.toString())) {
						studentsWithoutSubmission.push(
							studentSubmissions.filter((s) => (s.student._id.toString() == e.toString())).map((s) => s.student)[0],
						);
					}
				});
				studentsWithoutSubmission.sort((a, b) => ((a.firstName.toUpperCase() < b.firstName.toUpperCase()) ? -1 : 1))
					.sort((a, b) => ((a.lastName.toUpperCase() < b.lastName.toUpperCase()) ? -1 : 1));

				assignment.submissions = assignment.submissions.map((s) => ({ submission: s }));

				renderOptions.studentSubmissions = studentSubmissions;
				renderOptions.studentsWithoutSubmission = studentsWithoutSubmission;

				assignment.submissions = await Promise.all(assignment.submissions.map(async (submission) => ({ submission: await findSubmissionFiles(submission.submission, submission.submission.submitters, teachers, true) })));
				renderOptions.ungradedFileSubmissions = collectUngradedFiles(assignment.submissions);
			}

			const submissionFilesStorageData = { filesStorage: { parentType: 'submissions', schoolId: assignment.schoolId } };

			if (assignment.submission) {
				assignment.submission = await findSubmissionFiles(assignment.submission, assignment.submission.submitters, teachers, !assignment.submittable);
			}

			const { schoolId, _id } = assignment;
			const taskFilesStorageData = await filesStoragesHelper.filesStorageInit(schoolId, _id, 'tasks', true, req);
			res.render('homework/assignment', {
				...assignment, ...renderOptions, taskFilesStorageData, submissionFilesStorageData,
			});
		}).catch((err) => {
			next(err);
		});
	}).catch(next);
});

module.exports = router;
