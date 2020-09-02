const express = require('express');

const router = express.Router();
const logger = require('winston');
const fileUpload = require('express-fileupload');
const UAParser = require('ua-parser-js');
const moment = require('moment');
const redirectHelper = require('../helpers/redirect');
const api = require('../api');
const { MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE } = require('../config/global');
const recurringEventsHelper = require('../helpers/recurringEvents');

const { CALENDAR_SERVICE_ENABLED } = require('../config/global');

const permissionsHelper = require('../helpers/permissions');

// secure routes
router.use(require('../helpers/authentication').authChecker);

/**
 * Truncates string to 25 chars
 * @param string given string to truncate
 * @returns {string}
 */
const truncate = (string) => {
	if ((string || {}).length > 25) {
		return `${string.substring(0, 25)}...`;
	}
	return string;
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

const returnAdminPrefix = (roles, res) => {
	let prefix;
	// eslint-disable-next-line array-callback-return
	roles.map((role) => {
		// eslint-disable-next-line no-unused-expressions
		role.name === 'teacher'
			? (prefix = res.$t('administration.controller.headline.management'))
			: (prefix = res.$t('administration.controller.headline.administration'));
	});
	return prefix;
};

const getTableActionsSend = (item, path, state, res) => {
	const actions = [];
	if (state === 'submitted' || state === 'closed') {
		actions.push(
			{
				link: path + item._id,
				class: 'btn-edit',
				icon: 'edit',
				title: res.$t('administration.controller.link.editEntry'),
			},
			{
				class: 'disabled',
				icon: 'archive',
			},
			{
				class: 'disabled',
				icon: 'paper-plane',
			},
		);
	} else {
		actions.push(
			{
				link: path + item._id,
				class: 'btn-edit',
				icon: 'edit',
				title: res.$t('administration.controller.link.editEntry'),
			},
			{
				link: path + item._id,
				class: 'btn-disable',
				icon: 'archive',
				method: 'delete',
				title: res.$t('administration.controller.link.completeEntry'),
			},
			{
				link: path + item._id,
				class: 'btn',
				icon: 'paper-plane',
				method: 'post',
				title: res.$t('administration.controller.link.sendEntryToDevelopmentTeam'),
			},
		);
	}
	return actions;
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
		CALENDAR_SERVICE_ENABLED
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

/**
 * Set state to closed of helpdesk problem
 * @param service usually helpdesk, to disable instead of delete entry
 * @returns {Function}
 */
const getDisableHandler = (service) => function diasableHandler(req, res, next) {
	api(req)
		.patch(`/${service}/${req.params.id}`, {
			json: {
				state: 'closed',
				order: 2,
			},
		})
		.then(() => {
			redirectHelper.safeBackRedirect(req, res);
		});
};

/**
 * send out problem to the sc helpdesk
 * @param service currently only used for helpdesk
 * @returns {Function}
 */
const getSendHelper = (service) => function send(req, res, next) {
	api(req)
		.get(`/${service}/${req.params.id}`)
		.then((data) => {
			const user = res.locals.currentUser;

			api(req)
				.post('/helpdesk', {
					json: {
						type: 'contactHPI',
						subject: data.subject,
						role: '',
						desire: '',
						benefit: '',
						acceptanceCriteria: '',
						currentState: data.currentState,
						targetState: data.targetState,
						notes: data.notes,
						schoolName: res.locals.currentSchoolData.name,
						userId: user._id,
						email: user.email ? user.email : '',
						schoolId: res.locals.currentSchoolData._id,
						cloud: res.locals.theme.title,
						browserName: '',
						browserVersion: '',
						os: '',
						device: '',
						deviceUserAgent: '',
					},
				})
				.then(() => {
					api(req).patch(`/${service}/${req.params.id}`, {
						json: {
							state: 'submitted',
							order: 1,
						},
					});
				})
				.catch((err) => {
					res.status(err.statusCode || 500).send(err);
				});
			redirectHelper.safeBackRedirect(req, res);
		});
};

/*
    HELPDESK
*/

router.patch(
	'/:id',
	permissionsHelper.permissionsChecker('HELPDESK_VIEW'),
	getUpdateHandler('helpdesk'),
);
router.get(
	'/:id',
	permissionsHelper.permissionsChecker('HELPDESK_VIEW'),
	getDetailHandler('helpdesk'),
);
router.delete(
	'/:id',
	permissionsHelper.permissionsChecker('HELPDESK_VIEW'),
	getDisableHandler('helpdesk'),
);
router.post(
	'/:id',
	permissionsHelper.permissionsChecker('HELPDESK_VIEW'),
	getSendHelper('helpdesk'),
);

router.post('/', fileUpload({
	createParentPath: true,
}), (req, res, next) => {
	if (!req.body.subject && req.body.target) {
		if (req.body.target === 'HPI') { // Contact Admin
			// title? Y: Feedback N: Problem
			req.body.subject = req.body.type + ((req.body.title) ? `: ${req.body.title}` : '');
		}
	}
	req.body.type = `contact${req.body.target}`;

	// read User-Agent
	const parser = new UAParser();
	const { consent } = req.body;
	if (consent) {
		parser.setUA(req.headers['user-agent']);
	}
	const result = parser.getResult();
	if (!consent) {
		result.browser.name = '';
		result.browser.version = '';
		result.os.name = '';
	}

	let fileSize = 0;
	let files = [];
	if (req.files) {
		if (Array.isArray(req.files.file)) {
			files = req.files.file;
		} else {
			files.push(req.files.file);
		}
	}
	files.forEach((element) => {
		if (!element.mimetype.includes('image/')
			&& !element.mimetype.includes('video/')
			&& !element.mimetype.includes('application/msword')
			&& !element.mimetype.includes('application/pdf')) {
			throw new Error(res.$t('global.text.fileWrongFormat', { filename: element.name }));
		}
		fileSize += element.size;
	});
	if (fileSize > MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE) {
		if (files.length > 1) {
			throw new Error(res.$t('global.text.filesTooLarge'));
		} else {
			throw new Error(res.$t('global.text.fileTooLarge'));
		}
	}

	api(req).post('/helpdesk', {
		json: {
			type: req.body.type,
			subject: req.body.subject,
			title: req.body.title,
			role: req.body.role,
			desire: req.body.desire,
			benefit: req.body.benefit,
			acceptanceCriteria: req.body.acceptanceCriteria,
			currentState: req.body.currentState,
			targetState: req.body.targetState,
			problemDescription: req.body.problemDescription,
			schoolName: res.locals.currentSchoolData.name,
			userId: res.locals.currentUser._id,
			email: req.body.email,
			replyEmail: req.body.replyEmail,
			schoolId: res.locals.currentSchoolData._id,
			cloud: res.locals.theme.title,
			browserName: result.browser.name,
			browserVersion: result.browser.version,
			os: (result.os.version !== undefined) ? `${result.os.name} ${result.os.version}` : result.os.name,
			device: req.body.device ? req.body.device : '',
			deviceUserAgent: result.device.model,
			files,
		},
	})
		.then(() => {
			req.session.notification = {
				type: 'success',
				message:
					res.$t('helpdesk.text.feedbackSuccessful'),
			};
			redirectHelper.safeBackRedirect(req, res);
		}).catch((err) => {
			req.session.notification = {
				type: 'danger',
				message:
				res.$t('helpdesk.text.feedbackError'),
			};
			logger.warn(err);
			redirectHelper.safeBackRedirect(req, res);
		});
});
router.all(
	'/',
	permissionsHelper.permissionsChecker('HELPDESK_VIEW'),
	(req, res, next) => {
		const itemsPerPage = req.query.limit || 10;
		const currentPage = parseInt(req.query.p, 10) || 1;
		const title = returnAdminPrefix(res.locals.currentUser.roles, res);

		api(req)
			.get('/helpdesk', {
				qs: {
					$limit: itemsPerPage,
					$skip: itemsPerPage * (currentPage - 1),
					$sort: req.query.sort ? req.query.sort : { order: 1 },
					schoolId: res.locals.currentSchool,
				},
			})
			.then((data) => {
				const head = [
					res.$t('global.label.title'),
					res.$t('administration.controller.headline.itsOn'),
					res.$t('administration.controller.headline.targetState'),
					res.$t('administration.controller.headline.status'),
					res.$t('administration.controller.headline.creationDate'),
					res.$t('administration.controller.headline.remarks'),
					'',
				];

				const body = data.data.map((item) => [
					truncate(item.subject || ''),
					truncate(item.currentState || ''),
					truncate(item.targetState || ''),
					res.$t(`administration.controller.text.${item.state}`),
					moment(item.createdAt).format('DD.MM.YYYY'),
					truncate(item.notes || ''),
					getTableActionsSend(item, '/helpdesk/', item.state, res),
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
					numPages: Math.ceil(data.total / itemsPerPage),
					baseUrl: `/helpdesk/?p={{page}}${sortQuery}${limitQuery}`,
				};

				res.render('helpdesk/overview', {
					title: res.$t('administration.controller.headline.helpdesk', {
						title,
					}),
					head,
					body,
					pagination,
					limit: true,
				});
			});
	},
);

module.exports = router;
