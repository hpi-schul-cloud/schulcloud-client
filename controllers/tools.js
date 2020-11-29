const express = require('express');

const router = express.Router({ mergeParams: true });
const { api } = require('../api');
const authHelper = require('../helpers/authentication');
const ltiCustomer = require('../helpers/ltiCustomer');
const { Configuration } = require('@schul-cloud/commons');

const createToolHandler = (req, res, next) => {
	const context = req.originalUrl.split('/')[1];
	api(req).post('/ltiTools/', {
		json: req.body,
	}).then((tool) => {
		if (tool._id) {
			api(req).patch(`/${context}/${req.body.courseId}`, {
				json: {
					$push: {
						ltiToolIds: tool._id,
					},
				},
			}).then((course) => {
				res.redirect(`/${context}/${course._id}/?activeTab=tools`);
			});
		}
	});
};

const addToolHandler = (req, res, next) => {
	const context = req.originalUrl.split('/')[1];
	const action = `/${context}/${req.params.courseId}/tools/add`;

	api(req).get('/ltiTools', { qs: { isTemplate: true } })
		.then((tools) => {
			api(req).get(`/${context}/${req.params.courseId}`)
				.then((course) => {
					res.render('courses/add-tool', {
						action,
						title: res.$t('courses._course.tools.add.headline.createToolForCourse', {
							coursename: course.name,
						}),
						submitLabel: res.$t('courses._course.tools.add.button.createTool'),
						ltiTools: tools.data,
						courseId: req.params.courseId,
					});
				});
		});
};

const runToolHandler = (req, res, next) => {
	const { currentUser } = res.locals;
	Promise.all([
		api(req).get(`/ltiTools/${req.params.ltiToolId}`),
		api(req).get(`/roles/${currentUser.roles[0]._id}`),
		api(req).get(`/pseudonym?userId=${currentUser._id}&toolId=${req.params.ltiToolId}`),
	]).then(([tool, role, pseudonym]) => {
		const customer = new ltiCustomer.LTICustomer();
		let userId = '';
		if (tool.privacy_permission === 'pseudonymous') {
			userId = pseudonym.data[0].pseudonym;
		} else if (tool.privacy_permission === 'name' || tool.privacy_permission === 'e-mail') {
			userId = currentUser._id;
		}

		const payload = {
			lti_version: tool.lti_version,
			lti_message_type: tool.lti_message_type,
			resource_link_id: tool.resource_link_id || req.params.courseId,
			roles: customer.mapSchulcloudRoleToLTIRole(role.name),
			launch_presentation_document_target: 'window',
			launch_presentation_locale: 'en',
			user_id: userId,
		};

		if (tool.privacy_permission === 'name') {
			payload.lis_person_name_full = currentUser.displayName
				|| `${currentUser.firstName} ${currentUser.lastName}`;
		}
		if (tool.privacy_permission === 'e-mail') {
			payload.lis_person_contact_email_primary = currentUser.email;
		}

		tool.customs.forEach((custom) => {
			payload[customer.customFieldToString(custom)] = custom.value;
		});

		api(req).post('/tools/sign/lti11/', {
			body: {
				id: req.params.ltiToolId,
				payload,
				url: tool.url,
			},
		}).then((formData) => {
			res.render('courses/components/run-lti-frame', {
				url: tool.url,
				method: 'POST',
				csrf: (formData.lti_version === '1.3.0'),
				formData: Object.keys(formData).map(key => ({ name: key, value: formData[key] })),
			});
		});
	});
};

const getDetailHandler = (req, res, next) => {
	Promise.all([
		api(req).get(`/ltiTools/${req.params.id}`)])
		.then((tool) => {
			res.json({
				tool,
			});
		}).catch((err) => {
			next(err);
		});
};

const showToolHandler = (req, res, next) => {
	const context = req.originalUrl.split('/')[1];
	const { ltiToolId } = req.params;

	if (ltiToolId && ltiToolId === 'portfolio' && Configuration.get('FEATURE_EXTENSION_PORTFOLIO_ENABLED') !== true) {
		return res.render('lib/error', {
			loggedin: res.locals.loggedin,
			message: res.$t('courses._course.tools.add.text.toolPortfolioCouldNotBeFound'),
		});
	}

	Promise.all((req.params.courseId
		? [
			api(req).get(`/ltiTools/${req.params.ltiToolId}`),
			api(req).get(`/${context}/${req.params.courseId}`),
		]
		: [
			api(req).get('/ltiTools/', { qs: { friendlyUrl: req.params.ltiToolId } }),
			Promise.resolve({ name: '' }),
		]
	)).then(([tool, course]) => {
		// eslint-disable-next-line no-param-reassign
		tool = (req.params.courseId ? tool : tool.data[0]);
		if (!tool) {
			res.render('lib/error', {
				loggedin: res.locals.loggedin,
				message: res.$t('courses._course.tools.add.text.toolCouldNotBeFound'),
			});
		} else {
			const renderPath = tool.isLocal ? 'courses/run-tool-local' : 'courses/run-lti';
			res.render(renderPath, {
				course,
				title: `${tool.name}${(course.name
					? res.$t('courses._course.tools.add.headline.course', { coursename: course.name })
					: ''
				)}`,
				tool,
			});
		}
	});
};


// secure routes
router.use(authHelper.authChecker);

router.get('/', (req, res, next) => {
	const context = req.originalUrl.split('/')[1];
	res.redirect(`/${context}/${req.params.courseId}/?activeTab=tools`);
});

router.get('/add', addToolHandler);
router.post('/add', createToolHandler);

router.get('/run/:ltiToolId', runToolHandler);
router.get('/show/:ltiToolId', showToolHandler);

router.get('/:id', getDetailHandler);

router.delete('/delete/:ltiToolId', (req, res, next) => {
	const context = req.originalUrl.split('/')[1];
	api(req).patch(`/${context}/${req.params.courseId}`, {
		json: {
			$pull: {
				ltiToolIds: req.params.ltiToolId,
			},
		},
	}).then(() => {
		api(req).delete(`/ltiTools/${req.params.ltiToolId}`).then(() => {
			res.sendStatus(200);
		});
	});
});

module.exports = router;
