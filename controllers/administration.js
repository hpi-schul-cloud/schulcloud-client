/* eslint-disable prefer-destructuring */
/*
 * One Controller per layout view
 */

const express = require('express');
const logger = require('../helpers/logger');
const moment = require('moment');
const multer = require('multer');
const encoding = require('encoding-japanese');
const _ = require('lodash');
const { Configuration } = require('@hpi-schul-cloud/commons');
const queryString = require('querystring');
const api = require('../api');
const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const recurringEventsHelper = require('../helpers/recurringEvents');
const redirectHelper = require('../helpers/redirect');
const timesHelper = require('../helpers/timesHelper');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const { HOST, CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS } = require('../config/global');
const { isUserHidden } = require('../helpers/users');
const renameIdsInSchool = require('../helpers/schoolHelper');

// eslint-disable-next-line no-unused-vars
const getSelectOptions = (req, service, query, values = []) => api(req)
	.get(`/${service}`, {
		qs: query,
	})
	.then((data) => data.data);

const getSelectableYears = (school) => {
	let years = [];
	if (school && school.years) {
		years = years.concat([
			school.years.activeYear,
			school.years.nextYear,
			school.years.lastYear,
		].filter((y) => !!y));
	}
	return years;
};

const cutEditOffUrl = (url) => {
	// nicht optimal, aber req.header('Referer')
	// gibt auf einer edit Seite die edit Seite, deshalb diese URL Manipulation
	let workingURL = url;
	if (url.endsWith('/edit')) {
		workingURL = workingURL.replace('/edit', '');
		workingURL = workingURL.substring(0, workingURL.lastIndexOf('/'));
	}
	return workingURL;
};

/**
 * maps the event props from the server to fit the ui components, e.g. date and time
 * @param data {object} - the plain data object
 * @param service {string} - the model or service type
 */
const mapEventProps = (data, service) => {
	if (service === 'courses') {
		// map course times to fit into UI
		(data.times || []).forEach((time, count) => {
			time.duration = time.duration / 1000 / 60;
			time.startTime = moment(time.startTime, 'x').format('HH:mm');
			time.count = count;
		});

		// format course start end until date
		if (data.startDate) {
			data.startDate = moment(new Date(data.startDate).getTime()).format(
				'YYYY-MM-DD',
			);
			data.untilDate = moment(new Date(data.untilDate).getTime()).format(
				'YYYY-MM-DD',
			);
		}
	}

	return data;
};

/**
 * sets undefined array-course properties to an empty array
 */
const mapEmptyCourseProps = (req, res, next) => {
	const courseBody = req.body;
	if (!courseBody.classIds) courseBody.classIds = [];
	if (!courseBody.teacherIds) courseBody.teacherIds = [];
	if (!courseBody.userIds) courseBody.userIds = [];
	if (!courseBody.substitutionIds) courseBody.substitutionIds = [];

	next();
};

/**
 * sets undefined array-class properties to an empty array
 */
const mapEmptyClassProps = (req, res, next) => {
	const classBody = req.body;
	if (!classBody.teacherIds) classBody.teacherIds = [];
	if (!classBody.userIds) classBody.userIds = [];
	next();
};

/**
 * maps the request-data to fit model, e.g. for course times
 * @param data {object} - the request-data object
 * @param service {string} - maps
 */
const mapTimeProps = (req, res, next) => {
	// map course times to fit model
	req.body.times = req.body.times || [];
	(req.body.times || []).forEach((time) => {
		time.startTime = moment.duration(time.startTime, 'HH:mm').asMilliseconds();
		time.duration = time.duration * 60 * 1000;
	});

	next();
};

/**
 * creates an event for a created course. following params has to be included in @param data for creating the event:
 * startDate {Date} - the date the course is first take place
 * untilDate {Date} -  the date the course is last take place
 * duration {Number} - the duration of a course lesson
 * weekday {Number} - from 0 to 6, the weekday the course take place
 * @param data {object}
 * @param service {string}
 * @param req
 * @param res
 */
const createEventsForData = (data, service, req, res) => {
	// can just run if a calendar service is running on the environment and the course have a teacher
	if (
		Configuration.get('CALENDAR_SERVICE_ENABLED') === true
		&& service === 'courses'
		&& data.teacherIds[0]
		&& data.times.length > 0
	) {
		return Promise.all(
			data.times.map((time) => api(req).post('/calendar', {
				json: {
					summary: data.name,
					location: res.locals.currentSchoolData.name,
					description: data.description,
					startDate: new Date(
						new Date(data.startDate).getTime() + time.startTime,
					).toISOString(),
					duration: time.duration,
					repeat_until: data.untilDate,
					frequency: 'WEEKLY',
					weekday: recurringEventsHelper.getIsoWeekdayForNumber(time.weekday),
					scopeId: data._id,
					courseId: data._id,
					courseTimeId: time._id,
				},
				qs: { userId: data.teacherIds[0] },
			})),
		);
	}

	return Promise.resolve(true);
};

/**
 * Deletes all events from the given dataId in @param req.params, clear function
 * @param service {string}
 */
const deleteEventsForData = (service) => (req, res, next) => {
	if (Configuration.get('CALENDAR_SERVICE_ENABLED') === true && service === 'courses') {
		return api(req)
			.get(`courses/${req.params.id}`)
			.then((course) => {
				if (course.teacherIds.length < 1 || course.times.length < 1) {
					// if no teacher, no permission for deleting
					next();
					return;
				}
				// eslint-disable-next-line consistent-return
				return Promise.all(
					// eslint-disable-next-line
					(course.times || []).map(t => {
						if (t.eventId) {
							return api(req).delete(`calendar/${t.eventId}`, {
								qs: { userId: course.teacherIds[0] },
							});
						}
					}),
				).then(() => next());
			});
	}

	return next();
};

/**
 * Generates short registration link, optionally with user hash.
 * email and sendMail will be gathered from req.body of not set.
 * @param params {
 *          role: user role = string "teacher"/"student"
 *          save: hash will be generated with URI-safe characters
 *          patchUser: hash will be patched into the user (DB)
 *          host: current webaddress from client = string, looks for req.headers.origin first
 *          schoolId: users schoolId = string
 *          toHash: optional, user account mail for hash generation = string
 * 			classId: optional, classId alle the users belongs to, only for the bulkcall
 *      }
 */
const generateRegistrationLink = (params, bulkCall) => function registrationLink(req, res, next) {
	const options = JSON.parse(JSON.stringify(params));
	if (!options.role) options.role = req.body.role || '';
	if (!options.save) options.save = req.body.save || '';
	if (!options.patchUser) options.patchUser = req.body.patchUser || '';
	if (!options.host) options.host = req.headers.origin || req.body.host || '';
	if (!options.schoolId) options.schoolId = req.body.schoolId || '';
	if (!options.toHash) {
		options.toHash = req.body.email || req.body.toHash || '';
	}

	if (bulkCall) {
		return api(req).post('/users/qrRegistrationLinkLegacy', {
			json: options,
		});
	}
	return api(req)
		.post('/registrationlink/', {
			json: options,
		})
		.then((linkData) => {
			res.locals.linkData = linkData;
			if (options.patchUser) req.body.importHash = linkData.hash;
			next();
		})
		.catch((err) => {
			req.session.notification = {
				type: 'danger',
				message: res.$t('administration.controller.text.errorCreatingRegistrationLink', {
					errMessage: (err.error || {}).message || err.message || err || '',
				}),
			};
			redirectHelper.safeBackRedirect(req, res);
		});
};

// secure routes
router.use(authHelper.authChecker);

// client-side use
router.post(
	'/registrationlink/',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE', 'STUDENT_EDIT'], 'or'),
	generateRegistrationLink({}),
	(req, res) => {
		res.json(res.locals.linkData);
	},
);

const sendMailHandler = (user, req, res, internalReturn) => {
	if (
		user
		&& user.email
		&& user.schoolId
		&& (user.shortLink || res.locals.linkData.shortLink)
	) {
		return api(req)
			.post('/mails/', {
				json: {
					email: user.email,
					subject: res.$t('administration.controller.text.invitationEmailSubject', {
						title: res.locals.theme.title,
					}),
					headers: {},
					content: {
						text: res.$t('administration.controller.text.invitationEmailContent', {
							title: res.locals.theme.title,
							theme_title: res.locals.theme.theme_title,
							firstName: user.firstName,
							lastName: user.lastName,
							shortLink: user.shortLink || res.locals.linkData.shortLink,
							shortTitle: res.locals.theme.short_title,
						}),
					},
				},
			})
			.then(() => {
				if (internalReturn) return true;
				req.session.notification = {
					type: 'success',
					message:
						res.$t('administration.controller.text.userCreatedSuccessfullyAndRegistration'),
				};
				return redirectHelper.safeBackRedirect(req, res);
			})
			.catch((err) => {
				if (internalReturn) return false;
				req.session.notification = {
					type: 'danger',
					message: res.$t('administration.controller.text.userCreatedErrorSendingTheMail', {
						errMessage: (err.error || {}).message || err.message || err || '',
					}),
				};
				return redirectHelper.safeBackRedirect(req, res);
			});
	}
	if (internalReturn) return true;
	req.session.notification = {
		type: 'success',
		message: res.$t('administration.controller.text.userCreatedSuccessfully'),
	};
	return redirectHelper.safeBackRedirect(req, res);
};

const getUserCreateHandler = (internalReturn) => function userCreate(req, res, next) {
	const { shortLink } = req.body;
	if (req.body.birthday) {
		req.body.birthday = timesHelper.dateStringToMoment(req.body.birthday);
	}
	return api(req)
		.post('/users/', {
			json: req.body,
		})
		.then(async (newuser) => {
			res.locals.createdUser = newuser;
			if (req.body.sendRegistration && newuser.email && newuser.schoolId) {
				newuser.shortLink = shortLink;
				return sendMailHandler(newuser, req, res, internalReturn);
			}
			if (internalReturn) return true;
			req.session.notification = {
				type: 'success',
				message: res.$t('administration.controller.text.userCreatedSuccessfully'),
			};
			return redirectHelper.safeBackRedirect(req, res);

			/*
			createEventsForData(data, service, req, res).then(_ => {
				next();
			});
			*/
		})
		.catch((err) => {
			if (internalReturn) return false;
			req.session.notification = {
				type: 'danger',
				message: res.$t('administration.controller.text.failedToCreateUser', {
					error: err.error.message || '',
				}),
			};
			return redirectHelper.safeBackRedirect(req, res);
		});
};

const getCSVImportHandler = () => async function handler(req, res, next) {
	const buildMessage = (stats) => {
		const numberOfUsers = stats.users.successful + stats.users.failed;
		return (
			res.$t(
				(numberOfUsers > 1
					? 'administration.controller.text.successfullyImportedUsers'
					: 'administration.controller.text.successfullyImportedUser'),
				{
					amountImported: stats.users.successful,
					amountTotal: numberOfUsers,
					amountCreated: stats.users.created,
					amountUpdated: stats.users.updated,
				},
			)
		);
	};
	const buildErrorMessage = (stats) => {
		const whitelist = ['file', 'user', 'invitation', 'class'];
		let errorText = stats.errors
			.filter((err) => whitelist.includes(err.type))
			.map((err) => `${err.entity} (${err.message})`)
			.join(', ');
		if (errorText === '') {
			errorText = res.$t('administration.controller.text.anUnknownErrorOccurred');
		}
		return errorText;
	};
	try {
		const csvData = Buffer.from(encoding.convert(req.file.buffer, { to: 'UTF8', from: 'AUTO' })).toString('UTF-8');
		const [stats] = await api(req).post('/sync/', {
			qs: {
				target: 'csv',
				school: req.body.schoolId,
				role: req.body.roles[0],
				sendEmails: Boolean(req.body.sendRegistration),
				schoolYear: req.body.schoolYear,
			},
			json: {
				data: csvData,
			},
		});
		let messageType = 'success';
		let message = buildMessage(stats);
		if (!stats.success) {
			messageType = 'warning';
			message += ` ${res.$t('administration.controller.text.errorImportingUsers', {
				errorMessage: buildErrorMessage(stats),
			})}`;
		}
		req.session.notification = {
			type: messageType,
			message,
		};
		const query = queryString.stringify({
			'toast-type': 'success',
			'toast-message': message,
		});
		redirectHelper.safeBackRedirect(req, res, `/?${query}`);
		return;
	} catch (err) {
		let query;
		if (err.error && err.error.code && err.error.code === 'ESOCKETTIMEDOUT') {
			const message = res.$t('administration.controller.text.importMayBeStillRunning');
			req.session.notification = {
				type: 'info',
				message,
			};
			query = queryString.stringify({
				'toast-type': 'info',
				'toast-message': message,
			});
		} else {
			const message = res.$t('administration.controller.text.importFailed');
			req.session.notification = {
				type: 'danger',
				message,
			};
			query = queryString.stringify({
				'toast-type': 'error',
				'toast-message': message,
			});
		}

		redirectHelper.safeBackRedirect(req, res, `/?${query}`);
	}
};

const getUpdateHandler = (service) => function updateHandler(req, res, next) {
	api(req)
		.patch(`/${service}/${req.params.id}`, {
			// TODO: sanitize
			json: req.body,
		})
		.then((data) => {
			createEventsForData(data, service, req, res).then(() => {
				res.redirect(cutEditOffUrl(req.header('Referer')));
			});
		})
		.catch((err) => {
			next(err);
		});
};

const getDetailHandler = (service) => function detailHandler(req, res, next) {
	api(req)
		.get(`/${service}/${req.params.id}`)
		.then((data) => {
			res.json(mapEventProps(data, service));
		})
		.catch(next);
};

const getDeleteHandler = (service, redirectUrl, apiVersion = 'v1') => function deleteHandler(req, res, next) {
	api(req, { version: apiVersion })
		.delete(`/${service}/${req.params.id}`)
		.then(() => {
			if (redirectUrl) {
				res.redirect(redirectUrl);
			} else {
				redirectHelper.safeBackRedirect(req, res);
			}
		})
		.catch((err) => {
			next(err);
		});
};

const removeSystemFromSchoolHandler = (req, res, next) => {
	api(req, { version: 'v3' })
		.patch(`school/${res.locals.currentSchool}/system/${req.params.id}/remove/`)
		.then(() => {
			redirectHelper.safeBackRedirect(req, res);
		})
		.catch((err) => {
			next(err);
		});
};

const createSystemHandler = (req, res, next) => {
	api(req)
		.post('/systems/', { json: req.body })
		.then((system) => {
			api(req)
				.patch(`/schools/${req.body.schoolId}`, {
					json: {
						$push: {
							systems: system.id,
						},
					},
				})
				.then(() => {
					res.redirect('/administration/school');
				})
				.catch((err) => {
					next(err);
				});
		});
};

const getStorageProviders = (res) => [
	{
		label: res.locals.theme.short_title,
		value: 'awsS3',
	},
];

const getSSOTypes = () => [
	{ label: 'Moodle', value: 'moodle' },
	{ label: 'itslearning', value: 'itslearning' },
	{ label: 'IServ', value: 'iserv' },
	{ label: 'LDAP', value: 'ldap', hidden: true },
];

const createBucket = (req, res, next) => {
	if (req.body.fileStorageType) {
		Promise.all([
			api(req).post('/fileStorage/bucket', {
				json: {
					fileStorageType: req.body.fileStorageType,
					schoolId: req.params.id,
				},
			}),
			api(req).patch(`/schools/${req.params.id}`, {
				json: req.body,
			}),
		])
			.then(() => {
				redirectHelper.safeBackRedirect(req, res);
			})
			.catch((err) => {
				next(err);
			});
	}
};

const updatePolicy = (req, res, next) => {
	const body = req.body;
	// TODO: set correct API request
	api(req).post('/consentVersions', {
		json: {
			title: body.consentTitle,
			consentText: body.consentText,
			publishedAt: timesHelper.currentDate(),
			consentTypes: ['privacy'],
			schoolId: body.schoolId,
			consentData: body.consentData,
		},
	}).then(() => {
		redirectHelper.safeBackRedirect(req, res);
	}).catch((err) => {
		next(err);
	});
};

const returnAdminPrefix = (roles, res) => {
	let prefix;
	// eslint-disable-next-line array-callback-return
	roles.forEach((role) => {
		// eslint-disable-next-line no-unused-expressions
		role.name === 'teacher'
			? (prefix = res.$t('administration.controller.headline.management'))
			: (prefix = res.$t('administration.controller.headline.administration'));
	});
	return prefix;
};

// with userId to accountId
const userIdToAccountIdUpdate = () => async function useIdToAccountId(req, res, next) {
	const { password, accountId } = req.body;
	api(req, { json: true, version: 'v3' }).patch(`/account/${accountId}`, { json: { password } })
		.then((response) => {
			req.session.notification = {
				type: 'success',
				message: res.$t('administration.controller.text.changesSuccessfullySaved'),
			};
			redirectHelper.safeBackRedirect(req, res);
		})
		.catch((error) => {
			next(error);
		});
};

const userFilterSettings = (res, defaultOrder, isTeacherPage = false) => [
	{
		type: 'sort',
		title: res.$t('global.headline.sorting'),
		displayTemplate: res.$t('global.label.sortBy'),
		options: [
			['firstName', res.$t('global.label.firstName')],
			['lastName', res.$t('global.label.lastName')],
			['email', res.$t('administration.controller.global.label.email')],
			['classes', res.$t('global.headline.classes')],
			['consentStatus', res.$t('administration.controller.global.label.consentStatus')],
			['createdAt', res.$t('global.label.creationDate')],
		],
		defaultSelection: defaultOrder || 'firstName',
		defaultOrder: 'DESC',
	},
	{
		type: 'limit',
		title: res.$t('global.headline.entriesPerPage'),
		displayTemplate: res.$t('global.label.entriesPerPage'),
		options: [25, 50, 100],
		defaultSelection: 25,
	},
	{
		type: 'select',
		title: res.$t('administration.controller.headline.declarationOfConsentStatus'),
		displayTemplate: res.$t('administration.controller.label.status'),
		property: 'consentStatus',
		multiple: true,
		expanded: true,
		options: isTeacherPage
			? [
				['missing', res.$t('administration.controller.text.noDeclarationOfConsentAvailable')],
				['ok', res.$t('administration.controller.text.declarationOfConsentAvailable')],
			]
			: [
				['missing', res.$t('administration.controller.text.noDeclarationOfConsentAvailable')],
				[
					'parentsAgreed',
					res.$t('administration.controller.text.parentsAgreed'),
				],
				['ok', res.$t('administration.controller.text.declarationOfConsentAvailable')],
			],
	},
];

const skipRegistration = (req, res, next) => {
	const userid = req.params.id;
	const {
		passwd,
		// eslint-disable-next-line camelcase
		parent_privacyConsent,
		// eslint-disable-next-line camelcase
		parent_termsOfUseConsent,
		privacyConsent,
		termsOfUseConsent,
		birthday,
	} = req.body;
	const parsedDate = timesHelper.dateStringToMoment(birthday);
	api(req).post(`/users/${userid}/skipregistration`, {
		json: {
			password: passwd,
			parent_privacyConsent,
			parent_termsOfUseConsent,
			privacyConsent,
			termsOfUseConsent,
			birthday: parsedDate,
		},
	}).then(() => {
		res.render('administration/users_registrationcomplete', {
			title: res.$t('administration.controller.text.agreementSuccessfullyDeclared'),
			submitLabel: res.$t('global.button.done'),
			users: [
				{
					email: req.body.email,
					password: req.body.passwd,
					fullname: `${req.body.firstName} ${req.body.lastName}`,
				},
			],
			single: true,
			linktarget: '/administration/students',
		});
	}).catch(() => {
		req.session.notification = {
			type: 'danger',
			message: res.$t('administration.controller.text.setupFailed'),
		};
		redirectHelper.safeBackRedirect(req, res);
	});
};

const getConsentStatusIcon = (consentStatus, isTeacher = false) => {
	const check = '<i class="fa fa-check consent-status"></i>';
	const times = '<i class="fa fa-times consent-status"></i>'; // is red x
	const doubleCheck = '<i class="fa fa-check consent-status double-check"></i>'
		+ '<i class="fa fa-check consent-status double-check"></i>';

	switch (consentStatus) {
		case 'parentsAgreed':
			return check;
		case 'ok':
			return isTeacher ? check : doubleCheck;
		case 'missing':
		default:
			return times;
	}
};

// teacher admin permissions
router.get(
	'/',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_LIST', 'TEACHER_LIST'], 'or'),
	(req, res, next) => {
		res.render('administration/dashboard', {
			title: res.$t('administration.controller.headline.administration'),
			inMaintenance: res.locals.currentSchoolData.inMaintenance,
			inUserMigration: res.locals.currentSchoolData.inUserMigration,
		});
	},
);

const getTeacherUpdateHandler = () => async function teacherUpdateHandler(req, res, next) {
	// extract consent
	if (req.body.form) {
		req.body.consent = {
			userConsent: {
				form: req.body.form || 'analog',
				privacyConsent: req.body.privacyConsent || false,
				termsOfUseConsent: req.body.termsOfUseConsent || false,
			},
		};
	}

	const promises = [
		api(req).patch(`/users/admin/teachers/${req.params.id}`, { json: req.body }),
	]; // TODO: sanitize

	// extract class information
	if (req.body.classes && !Array.isArray(req.body.classes)) {
		req.body.classes = [req.body.classes];
	}
	const usersClasses = (await api(req).get('/classes', {
		qs: {
			teacherIds: req.params.id,
		},
	})).data.map((c) => c._id);
	const addedClasses = (req.body.classes || []).filter(
		(i) => !usersClasses.includes(i),
	);
	const removedClasses = usersClasses.filter(
		(i) => !(req.body.classes || []).includes(i),
	);
	addedClasses.forEach((addClass) => {
		promises.push(
			api(req).patch(`/classes/${addClass}`, {
				json: { $push: { teacherIds: req.params.id } },
			}),
		);
	});
	removedClasses.forEach((removeClass) => {
		promises.push(
			api(req).patch(`/classes/${removeClass}`, {
				json: { $pull: { teacherIds: req.params.id } },
			}),
		);
	});

	// do all db requests
	Promise.all(promises)
		.then(() => {
			redirectHelper.safeBackRedirect(req, res);
		})
		.catch((err) => {
			req.session.notification = {
				type: 'danger',
				message: err.error.message,
			};
			res.redirect(`${req.originalUrl}/edit`);
		});
};

router.post(
	'/registrationlinkMail/',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE', 'STUDENT_EDIT'], 'or'),
	generateRegistrationLink({}),
	(req, res) => {
		const email = req.body.email || req.body.toHash || '';
		api(req).get('/users', { qs: { email }, $limit: 1 })
			.then((users) => {
				if (users.total === 1) {
					sendMailHandler({ ...users.data[0], email }, req, res, true);
					res.status(200).json({ status: 'ok' });
				} else {
					res.status(500).send();
				}
			});
	},
);

router.post(
	'/teachers/',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'),
	generateRegistrationLink({ role: 'teacher', patchUser: true, save: true }),
	getUserCreateHandler(),
);
router.post(
	'/teachers/import/',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'),
	upload.single('csvFile'),
	getCSVImportHandler(),
);
router.get(
	'/teachers/import',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'),
	async (req, res, next) => {
		const years = getSelectableYears(res.locals.currentSchoolData);
		res.render('administration/import', {
			title: res.$t('administration.controller.headline.teacherImport'),
			roles: 'teacher',
			action: `/administration/teachers/import?_csrf=${res.locals.csrfToken}`,
			redirectTarget: '/administration/teachers',
			schoolCurrentYear: res.locals.currentSchoolData.currentYear,
			years,
		});
	},
);
router.post(
	'/teachers/:id',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_EDIT'], 'or'),
	getTeacherUpdateHandler(),
);
router.patch(
	'/teachers/:id/pw',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_EDIT'], 'or'),
	userIdToAccountIdUpdate('accounts'),
);
router.get(
	'/teachers/:id',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_LIST'], 'or'),
	getDetailHandler('users'),
);
router.delete(
	'/teachers/:id',
	getDeleteHandler('users/v2/admin/teacher', '/administration/teachers'),
);

router.get(
	'/teachers',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_LIST'], 'or'),
	(req, res, next) => {
		const tempOrgQuery = (req.query || {}).filterQuery;
		const filterQueryString = tempOrgQuery
			? `&filterQuery=${decodeURI(tempOrgQuery)}`
			: '';

		let itemsPerPage = 25;
		let filterQuery = {};
		if (tempOrgQuery) {
			filterQuery = JSON.parse(decodeURI(req.query.filterQuery));
			if (filterQuery.$limit) {
				itemsPerPage = filterQuery.$limit;
			}
		}

		const currentPage = parseInt(req.query.p, 10) || 1;
		const title = returnAdminPrefix(res.locals.currentUser.roles, res);

		let query = {
			$limit: itemsPerPage,
			$skip: itemsPerPage * (currentPage - 1),
		};
		query = Object.assign(query, filterQuery);

		api(req)
			.get('users/admin/teachers', {
				qs: query,
			})
			.then(async (teachersResponse) => {
				const currentUser = res.locals.currentUser;
				const hasEditPermission = permissionsHelper.userHasPermission(currentUser, 'TEACHER_EDIT');
				const users = teachersResponse.data;
				const years = getSelectableYears(res.locals.currentSchoolData);
				const head = [
					res.$t('global.label.firstName'),
					res.$t('global.label.lastName'),
					res.$t('administration.controller.global.label.email'),
					res.$t('global.headline.classes'),
				];
				if (
					res.locals.currentUser.roles
						.map((role) => role.name)
						.includes('administrator')
					&& hasEditPermission
				) {
					head.push(res.$t('administration.controller.global.label.createdOn'));
					head.push(res.$t('administration.controller.global.label.consentStatus'));
					head.push('');
				}
				const body = users.map((user) => {
					const statusIcon = getConsentStatusIcon(
						user.consentStatus,
						true,
					);
					const icon = `<p class="text-center m-0">${statusIcon}</p>`;
					let classesString = '';
					if (user.classes && Array.isArray(user.classes) && user.classes.length !== 0) {
						classesString = user.classes.join(', ');
					}
					const row = [
						user.firstName || '',
						user.lastName || '',
						user.email || '',
						classesString,
					];
					if (hasEditPermission) {
						row.push(timesHelper.dateToDateString(user.createdAt));
						row.push({
							useHTML: true,
							content: icon,
						});
						row.push([
							{
								link: `/administration/teachers/${user._id}/edit`,
								title: res.$t('administration.controller.link.editUsers'),
								icon: 'edit',
							},
						]);
					}
					return row;
				});

				const pagination = {
					currentPage,
					numPages: Math.ceil(teachersResponse.total / itemsPerPage),
					baseUrl: `/administration/teachers/?p={{page}}${filterQueryString}`,
				};

				res.render('administration/teachers', {
					title: res.$t('administration.controller.headline.teacher', { title }),
					head,
					body,
					pagination,
					filterSettings: JSON.stringify(userFilterSettings(res, 'lastName', true)),
					schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier,
					schoolCurrentYear: res.locals.currentSchoolData.currentYear,
					years,
				});
			});
	},
);

router.get(
	'/teachers/:id/edit',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_EDIT'], 'or'),
	(req, res, next) => {
		const userPromise = api(req, { version: 'v3' }).get(`users/admin/teachers/${req.params.id}`);
		const classesPromise = getSelectOptions(req, 'classes', {
			$populate: ['year'],
			$sort: 'displayName',
		});
		const accountPromise = api(req, { json: true, version: 'v3' })
			.get('/account', {
				qs: { type: 'userId', value: req.params.id },
			});

		Promise.all([
			userPromise,
			classesPromise,
			accountPromise,
		])
			.then(([user, _classes, accountList]) => {
				const account = accountList.data[0];
				const hidePwChangeButton = !account;

				const classes = _classes.map((c) => {
					c.selected = c.teacherIds.includes(user._id);
					return c;
				});
				const canDeleteUser = res.locals.currentUser.permissions.includes('TEACHER_DELETE');
				res.render('administration/users_edit', {
					title: res.$t('administration.controller.link.editTeacher'),
					action: `/administration/teachers/${user._id}`,
					submitLabel: res.$t('global.button.save'),
					closeLabel: res.$t('global.button.cancel'),
					user,
					canDeleteUser,
					consentStatusIcon: getConsentStatusIcon(user.consentStatus, true),
					consent: user.consent,
					classes,
					editTeacher: true,
					hidePwChangeButton,
					isAdmin: res.locals.currentUser.permissions.includes('ADMIN_VIEW'),
					schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier,
					referrer: req.header('Referer'),
					hasAccount: !!account,
					accountId: account ? account.id : null,
					consentNecessary: res.locals.theme.consent_necessary,
				});
			})
			.catch((err) => {
				next(err);
			});
	},
);

/*
    STUDENTS
*/

const getStudentUpdateHandler = () => async function studentUpdateHandler(req, res, next) {
	if (req.body.birthday) {
		req.body.birthday = timesHelper.dateStringToMoment(req.body.birthday);
	}

	const promises = [];

	// Consents
	if (req.body.student_form) {
		req.body.consent = req.body.consent || {};
		req.body.consent.userConsent = {
			form: req.body.student_form || 'analog',
			privacyConsent: req.body.student_privacyConsent === 'true',
			termsOfUseConsent: req.body.student_termsOfUseConsent === 'true',
		};
	}
	if (req.body.parent_form) {
		req.body.consent = req.body.consent || {};
		req.body.consent.parentConsents = [];
		req.body.consent.parentConsents[0] = {
			form: req.body.parent_form || 'analog',
			privacyConsent: req.body.parent_privacyConsent === 'true',
			termsOfUseConsent: req.body.parent_termsOfUseConsent === 'true',
		};
	}

	// remove all consent infos from user post
	Object.keys(req.body).forEach((key) => {
		if (key.startsWith('parent_') || key.startsWith('student_')) {
			delete req.body[key];
		}
	});

	promises.push(
		api(req).patch(`/users/admin/students/${req.params.id}`, { json: req.body }),
	); // TODO: sanitize

	Promise.all(promises)
		.then(() => {
			redirectHelper.safeBackRedirect(req, res);
		})
		.catch((err) => {
			req.session.notification = {
				type: 'danger',
				message: err.error.message,
			};
			res.redirect(`${req.originalUrl}/edit`);
		});
};

router.post(
	'/students/',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'),
	generateRegistrationLink({ role: 'student', patchUser: true, save: true }),
	getUserCreateHandler(),
);
router.post(
	'/students/import/',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'),
	upload.single('csvFile'),
	getCSVImportHandler(),
);
router.get(
	'/students/import',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'),
	async (req, res, next) => {
		const years = getSelectableYears(res.locals.currentSchoolData);
		res.render('administration/import', {
			title: res.$t('administration.controller.headline.studentImport'),
			roles: 'student',
			action: `/administration/students/import?_csrf=${res.locals.csrfToken}`,
			redirectTarget: '/administration/students',
			schoolCurrentYear: res.locals.currentSchoolData.currentYear,
			years,
		});
	},
);
router.patch(
	'/students/:id/pw',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_EDIT'], 'or'),
	userIdToAccountIdUpdate('accounts'),
);
router.post(
	'/students/:id',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_EDIT'], 'or'),
	getStudentUpdateHandler(),
);
router.get(
	'/students/:id',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_LIST'], 'or'),
	getDetailHandler('users'),
);
router.delete(
	'/students/:id',
	getDeleteHandler('users/v2/admin/student', '/administration/students'),
);
router.post(
	'/students/:id/skipregistration/',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE', 'STUDENT_SKIP_REGISTRATION'], 'or'),
	skipRegistration,
);
router.get(
	'/students/:id/skipregistration',
	permissionsHelper.permissionsChecker('STUDENT_SKIP_REGISTRATION'),
	(req, res, next) => {
		api(req, { version: 'v3' }).get(`/users/admin/students/${req.params.id}`)
			.then((user) => {
				res.render('administration/users_skipregistration', {
					title: res.$t('administration.controller.link.toGiveConsent'),
					action: `/administration/students/${user._id}/skipregistration`,
					submitLabel: res.$t('administration.controller.link.toGiveConsent'),
					closeLabel: res.$t('global.button.cancel'),
					user,
					password: authHelper.generateConsentPassword(),
					referrer: req.header('Referer'),
				});
			})
			.catch((err) => {
				next(err);
			});
	},
);

router.get(
	'/students',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_LIST'], 'or'),
	async (req, res, next) => {
		const tempOrgQuery = (req.query || {}).filterQuery;
		const filterQueryString = tempOrgQuery
			? `&filterQuery=${decodeURI(tempOrgQuery)}`
			: '';

		let itemsPerPage = 25;
		let filterQuery = {};
		if (tempOrgQuery) {
			filterQuery = JSON.parse(decodeURI(req.query.filterQuery));
			if (filterQuery.$limit) {
				itemsPerPage = filterQuery.$limit;
			}
		}

		const currentPage = parseInt(req.query.p, 10) || 1;

		const canSkip = permissionsHelper.userHasPermission(res.locals.currentUser, 'STUDENT_SKIP_REGISTRATION');
		// const title = returnAdminPrefix(res.locals.currentUser.roles);

		let query = {
			$limit: itemsPerPage,
			$skip: itemsPerPage * (currentPage - 1),
		};
		query = Object.assign(query, filterQuery);
		api(req, { version: 'v3' })
			.get('/users/admin/students', {
				qs: query,
			})
			.then(async (studentsResponse) => {
				const currentUser = res.locals.currentUser;
				const hasEditPermission = permissionsHelper.userHasPermission(currentUser, 'STUDENT_EDIT');
				const users = studentsResponse.data;
				const years = getSelectableYears(res.locals.currentSchoolData);
				const title = res.$t('administration.controller.headline.students', {
					title: returnAdminPrefix(
						res.locals.currentUser.roles,
						res,
					),
				});
				let studentsWithoutConsentCount = 0;
				const head = [
					res.$t('global.label.firstName'),
					res.$t('global.label.lastName'),
					res.$t('administration.controller.global.label.email'),
					res.$t('administration.controller.global.label.class'),
					res.$t('administration.controller.global.label.createdOn'),
					res.$t('administration.controller.global.label.consentStatus'),
				];
				if (hasEditPermission) {
					head.push(''); // Add space for action buttons
				}

				const body = users.map((user) => {
					const icon = getConsentStatusIcon(user.consentStatus);
					const actions = [
						{
							link: `/administration/students/${user._id}/edit`,
							title: res.$t('administration.controller.link.editUsers'),
							icon: 'edit',
						},
					];
					if (user.importHash && canSkip) {
						actions.push({
							link: `/administration/students/${user._id}/skipregistration`,
							title: res.$t('administration.controller.link.toGiveConsent'),
							icon: 'check-square-o',
						});
					}
					if (user.consentStatus === 'missing'
						|| user.consentStatus === 'default') {
						studentsWithoutConsentCount += 1;
					}
					const row = [
						user.firstName || '',
						user.lastName || '',
						user.email || '',
						user.classes.join(', ') || '',
						timesHelper.dateToDateString(user.createdAt),
						{
							useHTML: true,
							content: `<p class="text-center m-0">${icon}</p>`,
						},
					];
					if (hasEditPermission) {
						row.push(actions);
					}
					return row;
				});

				const pagination = {
					currentPage,
					numPages: Math.ceil(studentsResponse.total / itemsPerPage),
					baseUrl: `/administration/students/?p={{page}}${filterQueryString}`,
				};

				try {
					res.render('administration/students', {
						title,
						head,
						body,
						pagination,
						filterSettings: JSON.stringify(userFilterSettings(res)),
						schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier,
						schoolCurrentYear: res.locals.currentSchoolData.currentYear,
						studentsWithoutConsentCount,
						allStudentsCount: users.length,
						years,
						CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS,
					});
				} catch (err) {
					logger.warn(
						'Can not render /administration/students in router.all("/students")',
					);
					next(err);
				}
			})
			.catch((err) => {
				logger.error(`Can not fetch data from /users/admin/students in router.all("/students")
			| message: ${err.message} | code: ${err.code}.`);
				return [];
			});
	},
);

const getUsersWithoutConsent = async (req, roleName, classId) => {
	let users = [];

	if (classId) {
		const klass = await api(req).get(`/classes/${classId}`, {
			qs: {
				$populate: ['userIds'],
			},
		});
		users = klass.userIds;
	} else {
		const role = await api(req).get('/roles', {
			qs: { name: roleName },
			$limit: false,
		});
		const qs = { roles: role.data[0]._id, $limit: false };
		users = (await api(req).get('/users', { qs, $limit: false })).data;
	}

	const usersWithMissingConsents = [];
	const batchSize = 50;
	while (users.length > 0) {
		usersWithMissingConsents.push(
			...(await api(req, { version: 'v3' }).get('/users/admin/students', {
				qs: {
					users: users
						.splice(0, batchSize)
						.map((u) => u._id),
					consentStatus: { $in: ['missing', 'parentsAgreed'] },
					$limit: batchSize,
					$sort: { lastName: 1 },
				},
			})).data,
		);
	}

	return usersWithMissingConsents;
};

router.get(
	'/users-without-consent/send-email',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_CREATE'], 'or'),
	async (req, res, next) => {
		const { role, classId } = req.query;

		const usersWithoutAccount = await generateRegistrationLink(
			{
				classId,
				role,
				save: true,
				host: HOST,
				schoolId: res.locals.currentSchool,
				patchUser: true,
			},
			true,
		)(req, res, next);

		try {
			for (const user of usersWithoutAccount) {
				const name = user.displayName
					? user.displayName
					: `${user.firstName} ${user.lastName}`;
				const content = {
					text: res.$t('administration.controller.text.emailDeclarationOfConsent', {
						name,
						link: `<a href="${user.registrationLink.shortLink}">${user.registrationLink.shortLink}</a>`,
					}),
				};

				const json = {
					headers: {},
					email: user.email,
					subject: res.$t('administration.controller.text.emailDeclarationOfConsentSubject', {
						title: res.locals.theme.short_title,
					}),
					content,
				};

				await api(req).post('/mails', {
					json,
				});
			}
			res.sendStatus(200);
		} catch (err) {
			res.status(err.statusCode || 500).send(err);
		}
	},
);

const currentUserHasPermissionsForRole = (req, res, next) => {
	const role = req.query.role;
	const currentUser = res.locals.currentUser;

	let hasPermissions = false;

	if (role === 'student') {
		hasPermissions = permissionsHelper.userHasPermission(currentUser, ['ADMIN_VIEW', 'STUDENT_LIST'], 'or');
	} else if (role === 'teacher') {
		hasPermissions = permissionsHelper.userHasPermission(currentUser, ['ADMIN_VIEW', 'TEACHER_LIST'], 'or');
	}

	if (!hasPermissions) {
		return res.status(401).send(`You are not authorized to list ${role}s`);
	}
	return next();
};

router.get(
	'/users-without-consent/get-json',
	currentUserHasPermissionsForRole,
	async (req, res, next) => {
		const { role, classId } = req.query;
		try {
			const usersWithoutAccount = await generateRegistrationLink(
				{
					classId,
					role,
					save: true,
					host: HOST,
					schoolId: res.locals.currentSchool,
					patchUser: true,
				},
				true,
			)(req, res, next);

			res.json(usersWithoutAccount);
		} catch (err) {
			res.status(err.statusCode || 500).send(err);
		}
	},
);

router.get(
	'/students/:id/edit',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'STUDENT_EDIT'], 'or'),
	(req, res, next) => {
		const userPromise = api(req, { version: 'v3' }).get(`/users/admin/students/${req.params.id}`);
		const accountPromise = api(req, { json: true, version: 'v3' })
			.get('/account', {
				qs: { type: 'userId', value: req.params.id },
			});
		const canSkip = permissionsHelper.userHasPermission(res.locals.currentUser, 'STUDENT_SKIP_REGISTRATION');

		Promise.all([userPromise, accountPromise])
			.then(([user, accountList]) => {
				const consent = user.consent || {};
				if (consent) {
					consent.parentConsent = (consent.parentConsents || []).length
						? consent.parentConsents[0]
						: {};
				}
				const canDeleteUser = res.locals.currentUser.permissions.includes('STUDENT_DELETE');
				const account = accountList.data[0];
				const hidePwChangeButton = !account;
				res.render('administration/users_edit', {
					title: res.$t('administration.controller.link.editingStudents'),
					action: `/administration/students/${user._id}`,
					submitLabel: res.$t('global.button.save'),
					closeLabel:	res.$t('global.button.cancel'),
					user,
					canDeleteUser,
					isAdmin: res.locals.currentUser.permissions.includes('ADMIN_VIEW'),
					consentStatusIcon: getConsentStatusIcon(user.consentStatus),
					consent,
					canSkipConsent: canSkip,
					hasImportHash: user.importHash,
					hidePwChangeButton,
					schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier,
					referrer: req.header('Referer'),
					CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS,
					hasAccount: !!account,
					accountId: account ? account.id : null,
					consentNecessary: res.locals.theme.consent_necessary,
				});
			})
			.catch((err) => {
				next(err);
			});
	},
);

/*
  CLASSES
*/
const skipRegistrationClass = async (req, res, next) => {
	let {
		userids,
		birthdays,
		passwords,
		emails,
		fullnames,
	} = req.body;
	if (!(userids && birthdays && passwords && emails && fullnames)) {
		req.session.notification = {
			type: 'danger',
			message: res.$t('administration.controller.text.thereWasAnError'),
		};
		redirectHelper.safeBackRedirect(req, res);
		return;
	}
	// fallback if only one user is supposed to be edited
	if (typeof (birthdays) === 'string') {
		userids = [userids];
		birthdays = [birthdays];
		passwords = [passwords];
		emails = [emails];
		fullnames = [fullnames];
	}
	if (!((userids.length === birthdays.length) && (birthdays.length === passwords.length))) {
		req.session.notification = {
			type: 'danger',
			message: res.$t('administration.controller.text.thereWasAnError'),
		};
		redirectHelper.safeBackRedirect(req, res);
		return;
	}
	const changePromises = userids.map(async (userid, i) => {
		api(req).post(`/users/${userid}/skipregistration`, {
			json: {
				password: passwords[i],
				parent_privacyConsent: true,
				parent_termsOfUseConsent: true,
				privacyConsent: true,
				termsOfUseConsent: true,
				birthday: timesHelper.dateStringToMoment(birthdays[i]),
			},
		});
	});
	Promise.all(changePromises).then(() => {
		const result = userids.map((student, i) => ({
			email: emails[i],
			password: passwords[i],
			fullname: fullnames[i],
		}));
		res.render('administration/users_registrationcomplete', {
			title: res.$t('administration.controller.text.consentGrantedSuccessfully'),
			submitLabel: res.$t('global.button.back'),
			users: result,
			linktarget: '/administration/classes',
		});
	}).catch(() => {
		req.session.notification = {
			type: 'danger',
			message: res.$t('administration.controller.text.thereWasAnError'),
		};
		redirectHelper.safeBackRedirect(req, res);
	});
};

const renderClassEdit = (req, res, next) => {
	api(req)
		.get('/classes/')
		.then(() => {
			const promises = [
				getSelectOptions(req, 'users', {
					roles: ['teacher'],
					$limit: false,
				}), // teachers
				Array.from(Array(13).keys()).map((e) => ({
					grade: e + 1,
				})),
				req.locals.class,
			];
			const mode = req.locals.mode;
			Promise.all(promises).then(
				([teachers, gradeLevels, currentClass]) => {
					const schoolyears = getSelectableYears(res.locals.currentSchoolData);

					const allSchoolYears = res.locals.currentSchoolData.years.schoolYears
						.sort((a, b) => b.startDate.localeCompare(a.startDate));

					const lastDefinedSchoolYearId = (allSchoolYears[0] || {})._id;
					const isAdmin = res.locals.currentUser.permissions.includes(
						'ADMIN_VIEW',
					);

					if (!isAdmin) {
						// preselect current teacher when creating new class
						// and the current user isn't a admin (teacher)
						teachers.forEach((t) => {
							if (
								JSON.stringify(t._id)
								=== JSON.stringify(res.locals.currentUser._id)
							) {
								t.selected = true;
							}
						});
					}

					let isCustom = false;
					let isUpgradable = false;
					if (currentClass) {
						// preselect already selected teachers
						teachers.forEach((t) => {
							if ((currentClass.teacherIds || {}).includes(t._id)) {
								t.selected = true;
							}
						});
						gradeLevels.forEach((g) => {
							// eslint-disable-next-line eqeqeq
							if (currentClass.gradeLevel == g.grade) {
								g.selected = true;
							}
						});
						schoolyears.forEach((schoolyear) => {
							if (currentClass.year === schoolyear._id) {
								schoolyear.selected = true;
							}
						});
						if (currentClass.gradeLevel) {
							currentClass.classsuffix = currentClass.name;
						} else {
							isCustom = true;
							currentClass.customName = currentClass.name;
							if (currentClass.year) {
								currentClass.keepYear = true;
							}
						}

						if (currentClass.year) {
							isUpgradable = (lastDefinedSchoolYearId !== (currentClass.year || {}))
								&& currentClass.gradeLevel
								&& currentClass.gradeLevel !== 13
								&& !currentClass.successor;
						}
					}

					teachers.forEach((teacher) => {
						teacher.isHidden = isUserHidden(teacher, res.locals.currentSchoolData);
					});

					res.render('administration/classes-edit', {
						title: {
							create: res.$t('administration.controller.link.createANewClass'),
							edit: res.$t('administration.controller.headline.editClass', {
								name: (currentClass || {}).displayName,
							}),
							upgrade: res.$t('administration.controller.headline.upgradeClass', {
								name: (currentClass || {}).displayName,
							}),
						}[mode],
						action: {
							create: '/administration/classes/create',
							edit: `/administration/classes/${(currentClass || {})._id}/edit`,
							upgrade: '/administration/classes/create',
						}[mode],
						edit: mode !== 'create',
						isUpgradable,
						mode,
						schoolyears,
						teachers,
						class: currentClass,
						gradeLevels,
						isCustom,
						referrer: Configuration.get('FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED')
							? '/administration/groups/classes/' : '/administration/classes/',
					});
				},
			);
		})
		.catch(next);
};
const getClassOverview = (req, res, next) => {
	const query = {
		$limit: 1000,
	};
	if (req.query.yearId && req.query.yearId.length > 0) {
		query.year = req.query.yearId;
	}
	api(req)
		.get('/classes', {
			qs: query,
		})
		.then((data) => {
			res.json(data);
		})
		.catch((err) => {
			next(err);
		});
};
router.get(
	'/classes/create',
	permissionsHelper.permissionsChecker(
		['ADMIN_VIEW', 'CLASS_CREATE'],
		'or',
	),
	(req, res, next) => {
		req.locals = req.locals || {};
		req.locals.mode = 'create';
		return renderClassEdit(req, res, next);
	},
);
router.get(
	'/classes/students',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'CLASS_EDIT'], 'or'),
	(req, res, next) => {
		const classIds = JSON.parse(req.query.classes);
		api(req)
			.get('/classes/', {
				qs: {
					$populate: ['userIds'],
					_id: {
						$in: classIds,
					},
				},
			})
			.then((classes) => {
				const students = classes.data
					.map((c) => c.userIds)
					// eslint-disable-next-line no-shadow
					.reduce((flat, next) => flat.concat(next), []);
				res.json(students);
			});
	},
);
router.get(
	'/classes/json',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'CLASS_EDIT'], 'or'),
	getClassOverview,
);
router.get(
	'/classes/:classId/edit',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'CLASS_EDIT'], 'or'),
	(req, res, next) => {
		req.locals = req.locals || {};
		req.locals.mode = 'edit';
		req.locals.class = api(req).get(`/classes/${req.params.classId}`);
		return renderClassEdit(req, res, next);
	},
);
router.get(
	'/classes/:classId/createSuccessor',
	permissionsHelper.permissionsChecker(['CLASS_CREATE'], 'or'),
	(req, res, next) => {
		req.locals = req.locals || {};
		req.locals.mode = 'upgrade';
		req.locals.class = api(req).get(`/classes/successor/${req.params.classId}`);
		return renderClassEdit(req, res, next);
	},
);
router.get('/classes/:id', getDetailHandler('classes'));
router.patch(
	'/classes/:id',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'CLASS_EDIT'], 'or'),
	mapEmptyClassProps,
	getUpdateHandler('classes'),
);
router.delete(
	'/classes/:id',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'CLASS_REMOVE'], 'or'),
	getDeleteHandler('classes'),
);

router.get(
	'/classes/:classId/manage',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'CLASS_EDIT'], 'or'),
	(req, res, next) => {
		api(req)
			.get(`/classes/${req.params.classId}`, {
				qs: { $populate: ['teacherIds', 'userIds'] },
			})
			.then((currentClass) => {
				const classesPromise = getSelectOptions(req, 'classes', {
					$limit: false,
				}); // TODO limit classes to scope (year before, current and without year)
				const teachersPromise = getSelectOptions(req, 'users', {
					roles: ['teacher'],
					$sort: 'lastName',
					$limit: false,
				});
				const studentsPromise = getSelectOptions(req, 'users', {
					roles: ['student'],
					$sort: 'lastName',
					$limit: false,
				});

				const usersWithConsentsPromise = getUsersWithoutConsent(req, 'student', currentClass._id);

				Promise.all([
					classesPromise,
					teachersPromise,
					studentsPromise,
					usersWithConsentsPromise,
				]).then(([classes, teachers, students, allUsersWithoutConsent]) => {
					const isAdmin = res.locals.currentUser.permissions.includes(
						'ADMIN_VIEW',
					);
					if (!isAdmin) {
						// preselect current teacher when creating new class
						// and the current user isn't a admin (teacher)
						teachers.forEach((t) => {
							if (
								JSON.stringify(t._id)
								=== JSON.stringify(res.locals.currentUser._id)
							) {
								t.selected = true;
							}
						});
					}
					// preselect current teacher when creating new class

					const teacherIds = currentClass.teacherIds.map((t) => t._id);
					teachers.forEach((teacher) => {
						if (teacherIds.includes(teacher._id)) {
							teacher.selected = true;
						}

						teacher.isHidden = isUserHidden(teacher, res.locals.currentSchoolData);
					});
					const studentIds = currentClass.userIds.map((t) => t._id);
					students.forEach((student) => {
						if (studentIds.includes(student._id)) {
							student.selected = true;
						}

						student.isHidden = isUserHidden(student, res.locals.currentSchoolData);
					});

					// checks for user's 'STUDENT_LIST' permission and filters selected students
					const filterStudents = (ctx, s) => (
						!ctx.locals.currentUser.permissions.includes('STUDENT_LIST')
							? s.filter(({ selected }) => selected) : s
					);

					// importHash exists --> not signed up
					const usersWithoutConsent = allUsersWithoutConsent.filter((obj) => {
						if (obj.importHash) return true;
						return false;
					});

					const consentNecessary = res.locals.theme.consent_necessary;
					const notes = consentNecessary ? [
						{
							title: res.$t(
								'administration.controller.link.analogueConsent',
							),
							content:
								// eslint-disable-next-line max-len
								res.$t(
									'administration.controller.text.analogueConsent',
								)
								+ res.$t(
									'administration.controller.text.analogueConsentBullets',
								),
						},
						{
							title: res.$t('administration.controller.text.yourStudentsAreUnder', {
								age: CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS,
							}),
							content: res.$t('administration.controller.text.registrationExplanation', {
								title: res.locals.theme.short_title,
							}),
						},
						{
							title: res.$t('administration.controller.text.yourStudentsAreAtLeast', {
								age: CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS,
							}),
							content:
								res.$t('administration.controller.text.passTheRegistrationLinkDirectly')
								+ res.$t('administration.controller.text.theStepsForTheParentsAreOmitted'),
						},
						{
							title: res.$t('administration.controller.link.changePassword'),
							content:
								// eslint-disable-next-line max-len
								res.$t('administration.controller.text.whenLoggingInForTheFirstTime'),
						},
					] : [
						{
							title: res.$t('administration.controller.link.changePassword'),
							content:
								// eslint-disable-next-line max-len
								res.$t('administration.controller.text.whenLoggingInForTheFirstTime'),
						},
					];

					res.render('administration/classes-manage', {
						title: res.$t('administration.controller.headline.manageClass', {
							name: currentClass.displayName,
						}),
						class: currentClass,
						classes,
						teachers,
						students: filterStudents(res, students),
						schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier,
						notes,
						referrer: Configuration.get('FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED')
							? '/administration/groups/classes/' : '/administration/classes/',
						consentsMissing: usersWithoutConsent.length !== 0,
						consentNecessary,
						// eslint-disable-next-line max-len
						noConsentNecessaryText: res.$t(`administration.classes.${res.locals.theme.name}.text.noConsentNecessary`),
					});
				});
			});
	},
);

router.post(
	'/classes/:classId/manage',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'CLASS_EDIT'], 'or'),
	(req, res, next) => {
		const changedClass = {
			teacherIds: req.body.teacherIds || [],
			userIds: req.body.userIds || [],
		};
		api(req)
			.patch(`/classes/${req.params.classId}`, {
				// TODO: sanitize
				json: changedClass,
			})
			.then(() => {
				redirectHelper.safeBackRedirect(req, res);
			})
			.catch((err) => {
				next(err);
			});
	},
);

router.post(
	'/classes/:classId/skipregistration',
	permissionsHelper.permissionsChecker('STUDENT_SKIP_REGISTRATION'),
	skipRegistrationClass,
);

router.get(
	'/classes/:classId/skipregistration',
	permissionsHelper.permissionsChecker('STUDENT_SKIP_REGISTRATION'),
	async (req, res, next) => {
		let students = await getUsersWithoutConsent(req, 'student', req.params.classId);
		students = students.filter((obj) => {
			if (obj.importHash) return true;
			return false;
		});
		const passwords = students.map(() => (authHelper.generateConsentPassword()));
		const renderUsers = students.map((student, i) => ({
			fullname: `${student.firstName} ${student.lastName}`,
			id: student._id,
			email: student.email,
			birthday: timesHelper.dateStringToMoment(student.birthday),
			password: passwords[i],
		}));

		res.render('administration/classes_skipregistration', {
			title: res.$t('administration.controller.link.toGiveConsent'),
			students: renderUsers,
		});
	},
);

router.post(
	'/classes/create',
	permissionsHelper.permissionsChecker(
		['ADMIN_VIEW', 'CLASS_CREATE'],
		'or',
	),
	(req, res, next) => {
		const newClass = {
			schoolId: req.body.schoolId,
		};

		if (req.body.predecessor) {
			newClass.predecessor = req.body.predecessor;
		}
		if (req.body.classcustom) {
			newClass.name = req.body.classcustom;
			if (req.body.keepyear) {
				newClass.year = req.body.schoolyear;
			}
		} else {
			newClass.name = req.body.classsuffix || '';
			newClass.gradeLevel = req.body.grade;
			newClass.year = req.body.schoolyear;
		}
		if (req.body.teacherIds) {
			newClass.teacherIds = req.body.teacherIds;
		}
		if (req.body.userIds) {
			newClass.userIds = req.body.userIds;
		}

		api(req)
			.post('/classes/', {
				// TODO: sanitize
				json: newClass,
			})
			.then((data) => {
				const isAdmin = res.locals.currentUser.permissions.includes(
					'ADMIN_VIEW',
				);
				if (isAdmin) {
					Configuration.get('FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED') ? res.redirect('/administration/groups/classes/') : res.redirect('/administration/classes/');
				} else {
					res.redirect(`/administration/classes/${data._id}/manage`);
				}
			})
			.catch(next);
	},
);

router.post(
	'/classes/:classId/edit',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'CLASS_EDIT'], 'or'),
	(req, res, next) => {
		const changedClass = {
			schoolId: req.body.schoolId,
		};
		if (req.body.classcustom) {
			changedClass.name = req.body.classcustom;
			if (req.body.keepyear) {
				changedClass.year = req.body.schoolyear;
			}
		} else {
			changedClass.name = req.body.classsuffix || '';
			changedClass.gradeLevel = req.body.grade;
			changedClass.year = req.body.schoolyear;
		}
		if (req.body.teacherIds) {
			changedClass.teacherIds = req.body.teacherIds;
		} else {
			changedClass.teacherIds = [];
		}
		api(req)
			.patch(`/classes/${req.params.classId}`, {
				// TODO: sanitize
				json: changedClass,
			})
			.then(() => {
				redirectHelper.safeBackRedirect(req, res);
			})
			.catch(next);
	},
);

router.patch(
	'/:classId/',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'CLASS_EDIT'], 'or'),
	mapEmptyClassProps,
	(req, res, next) => {
		api(req)
			.patch(`/classes/${req.params.classId}`, {
				// TODO: sanitize
				json: req.body,
			})
			.then(() => {
				redirectHelper.safeBackRedirect(req, res);
			})
			.catch(next);
	},
);

router.delete(
	'/:classId/',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'CLASS_REMOVE'], 'or'),
	(req, res, next) => {
		api(req)
			.delete(`/classes/${req.params.classId}`)
			.then(() => {
				res.sendStatus(200);
			})
			.catch(() => {
				res.sendStatus(500);
			});
	},
);

const classFilterSettings = ({ years, defaultYear, showTab }, res) => {
	const filterSettings = [];
	filterSettings.push({
		type: 'sort',
		title: res.$t('global.headline.sorting'),
		displayTemplate: res.$t('global.label.sortBy'),
		options: [['displayName', res.$t('administration.controller.global.label.class')]],
		defaultSelection: 'displayName',
		defaultOrder: 'DESC',
	});

	if (showTab === 'archive') {
		const yearFilter = {
			type: 'select',
			title: res.$t('administration.global.label.schoolYear'),
			displayTemplate: res.$t('administration.controller.text.schoolYearPercentage'),
			property: 'year',
			multiple: true,
			expanded: true,
			options: years,
		};
		if (defaultYear) {
			yearFilter.defaultSelection = defaultYear;
		}
		filterSettings.push(yearFilter);
	}

	filterSettings.push({
		type: 'limit',
		title: res.$t('global.headline.sorting'),
		displayTemplate: res.$t('global.label.entriesPerPage'),
		options: [25, 50, 100],
		defaultSelection: 25,
	});

	return filterSettings;
};

router.get(
	'/classes',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'CLASS_LIST'], 'or'),
	(req, res, next) => {
		const tempOrgQuery = (req.query || {}).filterQuery;
		const filterQueryString = tempOrgQuery
			? `&filterQuery=${escape(tempOrgQuery)}`
			: '';

		let itemsPerPage = 25;
		let filterQuery = {};
		if (tempOrgQuery) {
			filterQuery = JSON.parse(unescape(req.query.filterQuery));
			if (filterQuery.$limit) {
				itemsPerPage = filterQuery.$limit;
			}
		}
		const currentPage = parseInt(req.query.p, 10) || 1;

		let query = {
			$populate: ['teacherIds', 'year'],
			$limit: itemsPerPage,
			$skip: itemsPerPage * (currentPage - 1),
		};

		if (!res.locals.currentUser.permissions.includes('CLASS_FULL_ADMIN')) {
			query.teacherIds = res.locals.currentUser._id.toString();
		}

		const schoolYears = res.locals.currentSchoolData.years.schoolYears
			.sort((a, b) => b.startDate.localeCompare(a.startDate));
		const lastDefinedSchoolYear = (schoolYears[0] || {})._id;

		const showTab = (req.query || {}).showTab || 'current';

		const currentYear = res.locals.currentSchoolData.currentYear;
		const upcomingYears = schoolYears
			.filter((year) => year.startDate > currentYear.endDate);
		const archivedYears = schoolYears
			.filter((year) => year.endDate < currentYear.startDate);

		let defaultYear;
		switch (showTab) {
			case 'upcoming':
				query['year[$in]'] = upcomingYears.map((year) => year._id);
				break;
			case 'archive':
				query['year[$in]'] = archivedYears.map((year) => year._id);
				defaultYear = archivedYears && archivedYears.length ? archivedYears[0]._id : null;
				break;
			case 'current':
			default:
				query['year[$in]'] = [currentYear._id];
				break;
		}

		// apply criterias defined by filter
		query = Object.assign(query, filterQuery);

		const classesTabs = [
			{
				key: 'upcoming',
				title: `${upcomingYears.pop().name}`,
				link: `/administration/classes/?showTab=upcoming${filterQueryString}`,
				testId: 'upcoming-tab'
			},
			{
				key: 'current',
				title: `${currentYear.name}`,
				link: `/administration/classes/?showTab=current${filterQueryString}`,
				testId: 'current-tab'
			},
			{
				key: 'archive',
				title: res.$t('global.tab.label.archive'),
				link: `/administration/classes/?showTab=archive${filterQueryString}`,
				testId: 'archive-tab'
			},
		];

		api(req)
			.get('/classes', {
				qs: query,
			})
			.then(async (data) => {
				const head = [
					res.$t('administration.controller.global.label.class'),
					res.$t('global.placeholder.Lehrer'),
					res.$t('administration.global.label.schoolYear'),
					res.$t('global.link.administrationStudents'),
				];
				const hasEditPermission = permissionsHelper.userHasPermission(res.locals.currentUser, 'CLASS_EDIT');
				if (hasEditPermission) {
					head.push(''); // action buttons head
				}

				const createActionButtons = (item, basePath) => {
					const baseActions = [
						{
							link: `${basePath + item._id}/manage`,
							icon: 'users',
							title: res.$t('administration.controller.link.manageClass'),
							testId: 'manage-class'
						},
						{
							link: `${basePath + item._id}/edit`,
							icon: 'edit',
							title: res.$t('administration.controller.link.editClass'),
							testId: 'edit-class'
						},
						{
							link: basePath + item._id,
							class: 'btn-delete',
							icon: 'trash-o',
							method: 'delete',
							title: res.$t('administration.controller.link.deleteClass'),
							testId: 'delete-class'
						},
					];
					if (lastDefinedSchoolYear !== (item.year || {})._id
						&& permissionsHelper.userHasPermission(res.locals.currentUser, 'CLASS_EDIT')
					) {
						baseActions.push({
							link: `${basePath + item._id}/createSuccessor`,
							icon: 'arrow-up',
							class: item.successor || item.gradeLevel === 13 ? 'disabled' : '',
							title: res.$t('administration.controller.link.transferClassToTheNextSchoolYear'),
						});
					}
					return baseActions;
				};
				let displayName;
				const body = data.data.map((item) => {
					const cells = [
						item.displayName || '',
						(item.teacherIds || []).map((i) => `${i.lastName}${i.outdatedSince ? ' ~~' : ''}`).join(', '),
						(item.year || {}).name || '',
						item.userIds.length || '0',
					];
					displayName = item.displayName;
					if (hasEditPermission) {
						cells.push(createActionButtons(item, '/administration/classes/'));
					}
					return cells;
				});

				const pagination = {
					currentPage,
					numPages: Math.ceil(data.total / itemsPerPage),
					baseUrl: `/administration/classes/?p={{page}}&showTab=${showTab}${filterQueryString}`,
				};

				const years = schoolYears
					.filter((year) => year.endDate < currentYear.startDate)
					.map((year) => [
						year._id,
						year.name,
					]);

				res.render('administration/classes', {
					title: res.$t('administration.dashboard.headline.manageClasses'),
					head,
					body,
					displayName,
					pagination,
					limit: true,
					filterSettings: JSON.stringify(classFilterSettings({ years, defaultYear, showTab }, res)),
					classesTabs,
					showTab,
					currentPath: 'administration/classes',
				});
			});
	},
);

// general admin permissions
// ONLY useable with ADMIN_VIEW !

/*
	COURSES
*/

const getCourseCreateHandler = () => function coruseCreateHandler(req, res, next) {
	api(req)
		.post('/courses/', {
			json: req.body,
		})
		.then((course) => {
			createEventsForData(course, 'courses', req, res).then(() => {
				next();
			});
		})
		.catch((err) => {
			next(err);
		});
};

const schoolUpdateHandler = async (req, res, next) => {
	const defaultLogoName = 'logo.png';
	const {
		name,
		language,
		logo_dataUrl,
		rocketChat,
		videoconference,
	} = req.body;

	let logo;
	if (logo_dataUrl) {
		logo = {
			dataUrl: logo_dataUrl,
			name: defaultLogoName,
		};
	}

	const features = new Set(req.body.features);

	if (rocketChat) {
		features.add('rocketChat');
	} else {
		features.delete('rocketChat');
	}

	if (videoconference) {
		features.add('videoconference');
	} else {
		features.delete('videoconference');
	}

	const requestBody = {
		name,
		language,
		permissions: {
			student: { LERNSTORE_VIEW: false },
			teacher: { STUDENT_LIST: false },
		},
		features: Array.from(features),
		logo,
	};

	try {
		// Toggle teacher's studentVisibility permission
		if (Configuration.get('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE')) {
			requestBody.permissions.teacher.STUDENT_LIST = !!req.body.studentVisibility;
		}

		// Toggle sudent lernstore view permission
		const studentLernstoreFeature = Configuration.get('FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED');
		if (studentLernstoreFeature) {
			requestBody.permissions.student.LERNSTORE_VIEW = !!req.body.studentlernstorevisibility;
		}

		await api(req, { version: 'v3' }).patch(`/school/${res.locals.currentSchool}`, {
			json: requestBody,
		});

		res.redirect(req.header('Referer'));
	} catch (err) {
		next(err);
	}
};

router.use(permissionsHelper.permissionsChecker('ADMIN_VIEW'));
router.patch('/schools/:id', schoolUpdateHandler);
router.post('/schools/:id/bucket', createBucket);
router.post('/schools/policy', updatePolicy);
router.post('/courses/', mapTimeProps, getCourseCreateHandler());
router.patch(
	'/courses/:id',
	mapTimeProps,
	mapEmptyCourseProps,
	deleteEventsForData('courses'),
	getUpdateHandler('courses'),
);
router.get('/courses/:id', getDetailHandler('courses'));
router.delete(
	'/courses/:id',
	getDeleteHandler('courses'),
	deleteEventsForData('courses'),
);

const buildArchiveQuery = (courseStatus) => {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	let archiveQuery = {};
	if (courseStatus === 'active') {
		archiveQuery = {
			$or: [
				{ untilDate: { $exists: false } },
				{ untilDate: null },
				{ untilDate: { $gte: yesterday } },
			],
		};
	}
	if (courseStatus === 'archived') {
		archiveQuery = { untilDate: { $lt: yesterday } };
	}
	return archiveQuery;
};

const getCourses = (req, params = {}) => {
	const { courseStatus = 'active', itemsPerPage = 10, currentPage = 1 } = params;
	const archiveQuery = buildArchiveQuery(courseStatus);

	const query = {
		$and: [archiveQuery],
		$populate: ['classIds', 'teacherIds'],
		$limit: itemsPerPage,
		$skip: itemsPerPage * (currentPage - 1),
		$sort: req.query.sort,
	};

	return api(req).get('courses', { qs: query });
};

router.all('/courses', (req, res, next) => {
	const itemsPerPage = req.query.limit || 10;
	const currentPage = parseInt(req.query.p, 10) || 1;
	const activeTab = req.query.activeTab || 'active';

	const head = [
		res.$t('global.headline.name'),
		res.$t('global.headline.classes'),
		res.$t('global.headline.teachers'),
		'',
	];

	const coursesPromise = getCourses(req, { itemsPerPage, currentPage, courseStatus: activeTab });
	const classesPromise = getSelectOptions(req, 'classes', { $limit: 1000 });
	const teachersPromise = getSelectOptions(req, 'users', {
		roles: ['teacher'],
		$limit: 1000,
	});
	const substitutionPromise = getSelectOptions(req, 'users', {
		roles: ['teacher'],
		$limit: 1000,
	});
	const studentsPromise = getSelectOptions(req, 'users', {
		roles: ['student'],
		$limit: 1000,
	});
	const newRoomViewEnabled = Configuration.get('FEATURE_SHOW_NEW_ROOMS_VIEW_ENABLED');

	Promise.all([
		coursesPromise,
		classesPromise,
		teachersPromise,
		substitutionPromise,
		studentsPromise,
	]).then(([courses, classes, teachers, substitutions, students]) => {
		const coursesBody = courses.data.map((item) => [
			item.name,
			// eslint-disable-next-line no-shadow
			(item.classIds || []).map((item) => {
				const c = classes.find((obj) => obj._id === item.id);
				// c might be undefined, c.displayName might throw
				return c != null && typeof c === 'object'
					? c.displayName
					: undefined;
			}).join(', '),
			// eslint-disable-next-line no-shadow
			(item.teacherIds || []).map((item) => `${item.lastName}${item.outdatedSince ? ' ~~' : ''}`).join(', '),
			[
				{
					link: newRoomViewEnabled ? `/courses/${item._id}/edit?redirectUrl=/administration/rooms/new`
						: `/courses/${item._id}/edit?redirectUrl=/administration/courses`,
					icon: 'edit',
					title: res.$t('administration.controller.link.editEntry'),
				},
				{
					link: `/administration/courses/${item._id}`,
					class: 'btn-delete',
					icon: 'trash-o',
					method: 'delete',
					title: res.$t('administration.controller.link.deleteEntry'),
				},
			],
		]);

		let sortQuery = '';
		if (req.query.sort) {
			sortQuery = `&sort=${req.query.sort}`;
		}

		let limitQuery = '';
		if (req.query.limit) {
			limitQuery = `&limit=${req.query.limit}`;
		}

		const pagination = {
			currentPage,
			numPages: Math.ceil(courses.total / itemsPerPage),
			baseUrl: `/administration/courses/?p={{page}}&activeTab=${activeTab}${sortQuery}${limitQuery}`,
		};

		res.render('administration/courses', {
			title: res.$t('administration.dashboard.headline.manageCourses'),
			head,
			coursesBody,
			classes,
			teachers,
			substitutions,
			students,
			pagination,
			limit: true,
			activeTab,
		});
	});
});

/**
 *  Teams
 */

const getTeamFlags = (team, res) => {
	const createdAtOwnSchool = `<i class="fa fa-home team-flags" data-toggle="tooltip"
			data-placement="top" title="${res.$t('administration.controller.label.teamFoundedAtOwnSchool')}"></i>`;
	const hasMembersOfOtherSchools = `<i class="fa fa-bus team-flags" data-toggle="tooltip"
			data-placement="top" title="${res.$t('administration.controller.label.teamIncludesExternalMembers')}"></i>`;
	const hasOwner = `<i class="fa fa-briefcase team-flags" data-toggle="tooltip"
			data-placement="top" title="${res.$t('administration.controller.label.teamHasOwner')}"></i>`;
	const hasRocketChat = `<i class="fa fa-comments team-flags" data-toggle="tooltip"
			data-placement="top" title="${res.$t('administration.controller.label.teamChatActive')}"></i>`;

	let combined = '';

	if (team.createdAtMySchool) {
		combined += createdAtOwnSchool;
	}

	if (team.hasMembersOfOtherSchools) {
		combined += hasMembersOfOtherSchools;
	}

	if (team.ownerExist) {
		combined += hasOwner;
	}

	if (team.hasRocketChat) {
		combined += hasRocketChat;
	}

	return combined;
};

const enableStudentUpdateHandler = async function enableStudentUpdate(req, res, next) {
	await api(req, { version: 'v3' }).patch(`/school/${req.params.id}`, {
		json: {
			enableStudentTeamCreation: req.body.enablestudentteamcreation === 'true',
		},
	});
	return res.redirect(cutEditOffUrl(req.header('Referer')));
};

router.patch('/teams/enablestudents/:id', enableStudentUpdateHandler);

const getTeamMembersButton = (counter) => `
  <div class="btn-show-members" role="button">${counter}<i class="fa fa-user team-flags"></i></div>`;

const getTeamSchoolsButton = (counter) => `
  <div class="btn-show-schools" role="button">${counter}<i class="fa fa-building team-flags"></i></div>`;

router.all('/teams', async (req, res, next) => {
	const path = '/administration/teams/';

	const itemsPerPage = parseInt(req.query.limit, 10) || 25;
	const filterQuery = {};
	const currentPage = parseInt(req.query.p, 10) || 1;

	const dataLength = await api(req)
		.get('/teams/manage/admin')
		.then((dataResponse) => dataResponse.total);

	const exceedDataLimit = ((itemsPerPage * (currentPage - 1)) > dataLength);

	let query = {
		limit: itemsPerPage,
		skip: (exceedDataLimit) ? 0 : itemsPerPage * (currentPage - 1),
	};
	query = Object.assign(query, filterQuery);
	// TODO: mapping sort
	/*
		'Mitglieder': 'members',
		'Schule(n)': 'schoolIds',
		'Erstellt am': 'createdAt',
	*/

	api(req)
		.get('/teams/manage/admin', {
			qs: query,
		})
		.then((data) => {
			const head = [
				'Name',
				res.$t('administration.controller.headline.members'),
				res.$t('administration.controller.headline.schools'),
				res.$t('administration.controller.headline.createdOn'),
				`${res.$t('administration.controller.headline.status')}*`,
				res.$t('global.headline.actions'),
			];

			const classesPromise = getSelectOptions(req, 'classes', { $limit: 1000 });
			const usersPromise = getSelectOptions(req, 'users', { $limit: 1000 });
			const roleTranslations = {
				teammember: res.$t('administration.controller.headline.attendees'),
				teamexpert: res.$t('administration.controller.headline.externalExpert'),
				teamleader: res.$t('global.role.text.leader'),
				teamadministrator: res.$t('global.role.text.administrator'),
				teamowner: res.$t('global.role.text.owner'),
			};

			Promise.all([classesPromise, usersPromise]).then(([classes, users]) => {
				const body = data.data.map((item) => {
					const actions = [
						{
							link: path + item._id,
							class: 'btn-write-owner',
							icon: 'envelope-o',
							title: res.$t('administration.controller.link.sendMessageToOwner'),
							data: {
								'original-title': res.$t('administration.controller.link.sendMessageToOwner'),
								placement: 'top',
								toggle: 'tooltip',
							},
						},
						{
							link: path + item._id,
							class: item.createdAtMySchool ? 'btn-set-teamowner' : 'disabled',
							icon: 'user-plus',
							title: res.$t('administration.controller.link.addAnotherOwner'),
							data: {
								'original-title': res.$t('administration.controller.link.addAnotherOwner'),
								placement: 'top',
								toggle: 'tooltip',
							},
						},
						{
							link: path + item._id,
							class: `${
								item.createdAtMySchool ? 'disabled' : 'btn-remove-members'
							}`,
							icon: 'user-times',
							data: {
								name: item.name,
								'original-title': item.createdAtMySchool
									? res.$t('administration.controller.text.onlyAllMembers')
									: res.$t('administration.controller.link.removeMembers'),
								placement: 'top',
								toggle: 'tooltip',
							},
							title: item.createdAtMySchool
								? res.$t('administration.controller.text.removeStudentsFromYourOwnSchool')
								: res.$t('administration.controller.link.removeMembers'),
						},
						{
							link: path + item._id,
							class: `${
								item.createdAtMySchool ? 'btn-delete-team' : 'disabled'
							}`,
							icon: 'trash-o',
							data: {
								name: item.name,
								'original-title': item.createdAtMySchool
									? res.$t('global.button.deleteTeam')
									: res.$t('administration.controller.text.theTeamCanOnlyBeDeleted'),
								placement: 'top',
								toggle: 'tooltip',
							},
							// lmethod: `${item.hasMembersOfOtherSchools ? '' : 'delete'}`,
							title: item.createdAtMySchool
								? res.$t('global.button.deleteTeam')
								: res.$t('administration.controller.text.theTeamCanOnlyBeDeleted'),
						},
					];

					return [
						item.name,
						{
							useHTML: true,
							content: getTeamMembersButton(item.membersTotal),
						},
						{
							useHTML: true,
							content: getTeamSchoolsButton(item.schools.length),
						},
						timesHelper.dateToDateString(item.createdAt),
						{
							useHTML: true,
							content: getTeamFlags(item, res),
						},
						{
							payload: Buffer.from(JSON.stringify({
								members: item.schoolMembers.map((member) => {
									member.role = roleTranslations[member.role];
									return member;
								}),
								schools: item.schools,
							}, 'utf-8')).toString('base64'),
						},
						actions,
					];
				});

				let sortQuery = '';
				if (req.query.sort) {
					sortQuery = `&sort=${req.query.sort}`;
				}

				let limitQuery = '';
				if (req.query.limit) {
					limitQuery = `&limit=${req.query.limit}`;
				}

				const pagination = {
					currentPage: (exceedDataLimit) ? 1 : currentPage,
					numPages: Math.ceil(data.total / itemsPerPage),
					baseUrl: `/administration/teams/?p={{page}}${sortQuery}${limitQuery}`,
				};

				const compare = (a, b) => (a > b) - (a < b);

				users.sort((a, b) => (
					compare(a.lastName.toLowerCase(), b.lastName.toLowerCase())
					|| compare(a.firstName.toLowerCase(), b.firstName.toLowerCase())
				));

				users = users.filter((user) => !isUserHidden(user, res.locals.currentSchoolData));

				const school = res.locals.currentSchoolData;
				const isTeamCreationByStudentsEnabled =	school.instanceFeatures
					.includes('isTeamCreationByStudentsEnabled');

				res.render('administration/teams', {
					title: res.$t('administration.dashboard.headline.manageTeams'),
					head,
					body,
					classes,
					users,
					pagination,
					school,
					limit: true,
					isTeamCreationByStudentsEnabled,
				});
			});
		});
});

router.get('/teams/:id', (req, res, next) => {
	api(req)
		.get(`/teams/manage/admin/${req.params.id}`)
		.then((data) => {
			res.json(mapEventProps(data));
		})
		.catch((err) => {
			next(err);
		});
});

router.post('/teams/:id', (req, res, next) => {
	api(req)
		.post('/teams/manage/admin', {
			json: {
				teamIds: req.params.id,
				message: req.body.message,
			},
		})
		.then(() => {
			res.redirect('/administration/teams/');
		})
		.catch((err) => {
			next(err);
		});
});

router.patch('/teams/:id', (req, res, next) => {
	api(req)
		.patch(`/teams/manage/admin/${req.params.id}`, {
			json: {
				userId: req.body.userId,
			},
		})
		.then(() => {
			res.redirect('/administration/teams/');
		})
		.catch((err) => {
			next(err);
		});
});

router.delete('/teams/:id', (req, res, next) => {
	api(req)
		.delete(`/teams/manage/admin/${req.params.id}`)
		.then(() => {
			res.redirect('/administration/teams/');
		})
		.catch((err) => {
			next(err);
		});
});

/*
	SCHOOL / SYSTEMS / RSS
*/

router.post('/systems/', createSystemHandler);
router.patch('/systems/:id', getUpdateHandler('systems'));
router.get('/systems/:id', getDetailHandler('systems'));
router.delete(
	'/systems/:id',
	removeSystemFromSchoolHandler,
);

router.get('/rss/:id', async (req, res) => {
	const school = await api(req).patch(`/schools/${res.locals.currentSchool}`);

	const matchingRSSFeed = school.rssFeeds.find(
		(feed) => feed._id === req.params.id,
	);

	res.send(matchingRSSFeed);
});

// TODO: It would be nice if this route would be removed soon,
// so we don't need to worry about the call to GET schools here.
// Ticket for removal: https://ticketsystem.dbildungscloud.de/browse/BC-4231
router.post('/rss/', async (req, res) => {
	const school = await api(req).get(`/schools/${req.body.schoolId}`);

	if (
		school.rssFeeds
		&& school.rssFeeds.find((el) => el.url === req.body.rssURL)
	) {
		return res.redirect('/administration/school');
	}

	await api(req).patch(`/schools/${req.body.schoolId}`, {
		json: {
			$push: {
				rssFeeds: { url: req.body.rssURL, description: req.body.description },
			},
		},
	});
	return res.redirect('/administration/school');
});

router.delete('/rss/:id', async (req, res) => {
	await api(req).patch(`/schools/${res.locals.currentSchool}`, {
		json: {
			$pull: {
				rssFeeds: { _id: req.params.id },
			},
		},
	});

	res.redirect('/administration/school');
});

router.use(
	'/school',
	permissionsHelper.permissionsChecker(['ADMIN_VIEW', 'TEACHER_CREATE'], 'or'),
	async (req, res) => {
		const [school, totalStorage, schoolMaintanance, consentVersions] = await Promise.all([
			api(req, { version: 'v3' }).get(`/school/id/${res.locals.currentSchool}`)
				.then((result) => renameIdsInSchool(result)),
			api(req).get('/fileStorage/total'),
			api(req).get(`/schools/${res.locals.currentSchool}/maintenance`),
			api(req).get('/consentVersions', {
				qs: {
					$limit: 100,
					schoolId: res.locals.currentSchool,
					consentTypes: 'privacy',
					$sort: {
						publishedAt: -1,
					},
				},
			}),
		]);

		// In the future there should be a possibility to fetch a school with all systems populated via api/v3,
		// but at the moment they need to be fetched separately.
		school.systems = await api(req, { version: 'v3' }).get(`/school/${school._id}/systems`);

		// Maintanance - Show Menu depending on the state
		const currentTime = new Date();
		const maintananceModeStarts = new Date(schoolMaintanance.currentYear.endDate);
		// Terminate school year 14 days before maintance start possible
		const twoWeeksFromStart = new Date(maintananceModeStarts.valueOf());
		twoWeeksFromStart.setDate(twoWeeksFromStart.getDate() - 14);

		let schoolMaintananceMode = 'idle';
		if (schoolMaintanance.maintenance.active) {
			schoolMaintananceMode = 'active';
		} else if (maintananceModeStarts && twoWeeksFromStart < currentTime) {
			schoolMaintananceMode = 'standby';
		}
		// POLICIES
		const policiesHead = [
			res.$t('global.label.title'),
			res.$t('global.label.description'),
			res.$t('administration.controller.headline.uploadedOn'),
			'Link',
		];
		let policiesBody;
		if (Array.isArray(consentVersions.data)) {
			policiesBody = consentVersions.data.map((consentVersion) => {
				const title = consentVersion.title;
				const text = consentVersion.consentText;
				const publishedAt = timesHelper.dateToDateTimeString(consentVersion.publishedAt);
				const linkToPolicy = consentVersion.consentDataId;
				const links = [];
				if (linkToPolicy) {
					links.push({
						link: `/base64Files/${linkToPolicy}`,
						class: 'base64File-download-btn',
						icon: 'file-o',
						title: res.$t('global.text.dataProtection'),
					});
				}
				return [title, text, publishedAt, links];
			});
		}

		// SYSTEMS
		const getSystemsBody = (systems) => systems.map((item) => {
			const name = getSSOTypes().filter((type) => item.type === type.value);
			let tableActions = [];
			const editable = item.ldapConfig?.provider === 'general';
			const hasSystemEditPermission = permissionsHelper.userHasPermission(res.locals.currentUser, 'SYSTEM_EDIT');
			const hasSystemCreatePermission = permissionsHelper.userHasPermission(res.locals.currentUser, 'SYSTEM_CREATE');

			if (editable) {
				if (hasSystemEditPermission) {
					tableActions = tableActions.concat([
						{
							link: item.type === 'ldap' ? `/administration/ldap/config?id=${item.id}`
								: `/administration/systems/${item.id}`,
							class: item.type === 'ldap' ? 'btn-edit-ldap' : 'btn-edit',
							icon: 'edit',
							title: res.$t('administration.controller.link.editEntry'),
						},
					]);
				}

				if (hasSystemCreatePermission) {
					tableActions = tableActions.concat([
						{
							link: `/administration/systems/${item.id}`,
							class: 'btn-delete--systems',
							icon: 'trash-o',
							method: 'delete',
							title: res.$t('administration.controller.link.deleteEntry'),
						},
					]);
				}
			}
			return [
				item.type === 'ldap' && item.ldapConfig.active === false
					? res.$t('administration.controller.label.inactive', {
						alias: item.alias,
					})
					: item.alias,
				name,
				tableActions,
			];
		});

		const systemsHead = [
			res.$t('administration.controller.headline.alias'),
			res.$t('global.label.type'),
			'',
		];
		let systemsBody;
		let systems;
		let ldapAddable = true;
		if (Array.isArray(school.systems)) {
			school.systems = _.orderBy(school.systems, req.query.sort, 'desc');
			systems = school.systems.filter((system) => system.type !== 'local');
			ldapAddable = !systems.some((e) => e.type === 'ldap');
			systemsBody = getSystemsBody(systems);
		}

		// RSS
		const rssHead = ['URL', res.$t('administration.controller.headline.briefDescription'), 'Status', ''];
		let rssBody;
		if (school.rssFeeds) {
			rssBody = school.rssFeeds.map(({
				_id, url, status, description,
			}) => [
				url,
				description,
				// eslint-disable-next-line no-nested-ternary
				status === 'success'
					? res.$t('administration.controller.text.active')
					: status === 'error'
						? res.$t('administration.controller.text.retrieveFailed')
						: res.$t('administration.controller.text.inTheQueue'),
				[
					{
						link: `/administration/rss/${_id}`,
						class: 'btn-delete--rss',
						icon: 'trash-o',
						method: 'delete',
						title: res.$t('administration.controller.link.deleteEntry'),
					},
				],
			]);
		}

		// SCHOOL
		let provider = getStorageProviders(res);
		provider = (provider || []).map((prov) => {
			// eslint-disable-next-line eqeqeq
			if (prov.value == school.fileStorageType) {
				return Object.assign(prov, {
					selected: true,
				});
			}
			return prov;
		});

		if (!school.permissions) {
			school.permissions = {};
		}

		if (!school.permissions.teacher) {
			school.permissions.teacher = {};
		}

		if (!school.permissions.student) {
			school.permissions.student = {};
		}

		const ssoTypes = getSSOTypes();
		const availableSSOTypes = getSSOTypes().filter((type) => type.value !== 'itslearning');

		res.render('administration/school', {
			title: res.$t('administration.dashboard.headline.manageSchool'),
			school,
			schoolMaintanance,
			schoolMaintananceMode,
			systems,
			ldapAddable,
			provider,
			availableSSOTypes,
			ssoTypes,
			totalStorage,
			systemsHead,
			systemsBody,
			policiesHead,
			policiesBody,
			rssHead,
			rssBody,
			hasRSS: rssBody && !!rssBody.length,
			schoolUsesLdap: res.locals.currentSchoolData.ldapSchoolIdentifier,
			timezone: `${timesHelper.schoolTimezoneToString(true)}`,
		});
	},
);

router.get('/policies/:id', async (req, res, next) => {
	try {
		const base64File = await Promise.resolve(
			api(req).get(`/base64Files/${req.params.id}`),
		);
		const fileData = base64File.data;
		res.json(fileData);
	} catch (err) {
		next(err);
	}
});

/*

	Change School Year

*/

// Terminate
router.post('/terminateschoolyear', async (req, res, next) => {
	await api(req).post(`/schools/${res.locals.currentSchool}/maintenance`, {
		json: {
			maintenance: true,
		},
	})
		.then(() => res.redirect('/administration/school'))
		.catch((err) => {
			next(err);
		});
});

// Start
router.use('/startschoolyear', async (req, res, next) => {
	await api(req).post(`/schools/${res.locals.currentSchool}/maintenance`, {
		json: {
			maintenance: false,
		},
	})
		.then(() => res.redirect('/administration/school'))
		.catch((err) => {
			next(err);
		});
});

// Start preview LDAP
router.get('/startldapschoolyear', async (req, res) => {
	// Find LDAP-System
	const school = await Promise.resolve(
		api(req, { version: 'v3' }).get(`/school/id/${res.locals.currentSchool}`)
			.then((result) => renameIdsInSchool(result)),
	);

	// In the future there should be a possibility to fetch a school with all systems populated via api/v3,
	// but at the moment they need to be fetched separately.
	school.systems = await Promise.all(school.systemIds.map((systemId) => api(req).get(`/systems/${systemId}`)));

	const system = school.systems.filter(
		// eslint-disable-next-line no-shadow
		(system) => system.type === 'ldap',
	);

	const ldapData = await Promise.resolve(api(req).get(`/ldap/${system[0]._id}`));

	const bodyClasses = [];
	ldapData.classes.forEach((singleClass) => {
		if (singleClass.uniqueMembers && singleClass.uniqueMembers.length) {
			bodyClasses.push([
				singleClass.className,
				singleClass.ldapDn,
				(singleClass.uniqueMembers || []).join('; '),
			]);
		}
	});

	const bodyUsers = [];
	ldapData.users.forEach((user) => {
		bodyUsers.push([
			user.firstName,
			user.lastName,
			user.email,
			user.ldapUID,
			user.roles.join(),
			user.ldapDn,
			user.ldapUUID,
		]);
	});

	const headUser = [
		res.$t('global.label.firstName'),
		res.$t('global.label.lastName'),
		res.$t('administration.controller.label.email'),
		'uid',
		res.$t('administration.controller.label.roles'),
		res.$t('administration.controller.label.domainName'),
		'uuid',
	];
	const headClasses = [
		res.$t('global.headline.name'),
		res.$t('global.headline.name'),
		res.$t('administration.controller.global.label.classUsers'),
	];

	res.render('administration/ldap-schoolyear-start', {
		title: res.$t('administration.controller.text.checkingTheLDAPData'),
		headUser,
		bodyUsers,
		headClasses,
		bodyClasses,
	});
});

/*
	LDAP SYSTEMS
*/

router.post(
	'/systems/ldap/add',
	permissionsHelper.permissionsChecker('ADMIN_VIEW'),
	async (req, res, next) => {
		// Check if LDAP-System already exists
		const school = await Promise.resolve(
			api(req, { version: 'v3' }).get(`/school/id/${res.locals.currentSchool}`)
				.then((result) => renameIdsInSchool(result)),
		);

		// In the future there should be a possibility to fetch a school with all systems populated via api/v3,
		// but at the moment they need to be fetched separately.
		school.systems = await Promise.all(school.systemIds.map((systemId) => api(req).get(`/systems/${systemId}`)));

		// eslint-disable-next-line no-shadow
		const system = school.systems.filter((system) => system.type === 'ldap');

		if (system.length === 1) {
			// LDAP System already available, do not create another one
			res.redirect('/administration/school');
		} else {
			// Create System for LDAP
			const ldapTemplate = {
				type: 'ldap',
				alias: res.locals.currentSchoolData.name,
				ldapConfig: {
					active: false,
					url: 'ldaps://',
					rootPath: '',
					searchUser: '',
					searchUserPassword: '',
					provider: 'general',
					providerOptions: {
						schoolName: res.locals.currentSchoolData.name,
						userPathAdditions: '',
						classPathAdditions: '',
						roleType: 'text',
						userAttributeNameMapping: {
							givenName: 'givenName',
							sn: 'sn',
							dn: 'dn',
							uuid: 'objectGUID',
							uid: 'cn',
							mail: 'mail',
							role: 'description',
						},
						roleAttributeNameMapping: {
							roleStudent: 'student',
							roleTeacher: 'teacher',
							roleAdmin: 'admin',
							roleNoSc: 'no-sc',
						},
						classAttributeNameMapping: {
							description: 'name',
							dn: 'dn',
							uniqueMember: 'member',
						},
					},
				},
			};

			api(req)
				.post('/systems/', { json: ldapTemplate })
				// eslint-disable-next-line no-shadow
				.then((system) => {
					api(req)
						// TODO move to server. Should be one transaction
						.patch(`/schools/${res.locals.currentSchool}`, {
							json: {
								$push: {
									systems: system.id,
								},
							},
						})
						.then(() => {
							res.redirect(`/administration/ldap/config?id=${system.id}`);
						})
						.catch((err) => {
							next(err);
						});
				});
		}
	},
);

module.exports = router;
