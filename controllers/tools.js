const express = require('express');
const jwt = require('jsonwebtoken');

const api = require('../api');
const authHelper = require('../helpers/authentication');
const ltiCustomer = require('../helpers/ltiCustomer');
const { Configuration } = require('@schul-cloud/commons');
const { HOST } = require('../config/global');

const router = express.Router({ mergeParams: true });

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

const generateNonce = (length) => {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < length; i += 1) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

const runToolHandler = (req, res, next) => {
	const { currentUser } = res.locals;
	Promise.all([
		api(req).get(`/ltiTools/${req.params.ltiToolId}`),
		api(req).get(`/roles/${currentUser.roles[0]._id}`),
		api(req).get(`/pseudonym?userId=${currentUser._id}&toolId=${req.params.ltiToolId}`),
	]).then(([tool, role, pseudonym]) => {
		let userId = '';
		let name = null;

		if (tool.privacy_permission === 'pseudonymous') {
			userId = pseudonym.data[0].pseudonym;
			name = encodeURI(pseudonym.data[0].user.iframe);
		} else if (tool.privacy_permission === 'name' || tool.privacy_permission === 'e-mail') {
			userId = currentUser._id;
		}

		const customer = new ltiCustomer.LTICustomer();
		if (tool.lti_version === 'LTI-1p0') {
			const payload = {
				lti_version: tool.lti_version,
				lti_message_type: tool.lti_message_type,
				resource_link_id: tool.resource_link_id || req.params.courseId,
				roles: customer.mapSchulcloudRoleToLTIRole(role.name),
				launch_presentation_document_target: 'window',
				launch_presentation_locale: 'en',
				lis_person_name_full: (tool.privacy_permission === 'name'
					? currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}`
					: ''),
				lis_person_contact_email_primary: (tool.privacy_permission === 'e-mail'
					? currentUser.email
					: ''),
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
					csrf: false,
					formData: Object.keys(formData).map(key => ({ name: key, value: formData[key] })),
				});
			});
		} else if (tool.lti_version === '1.3.0') {
			const current = new Date();
			const iss = process.env.FRONTEND_URL || 'http://localhost:3100/';
			const roleName = customer.mapSchulcloudRoleToLTIRole(role.name);
			const idToken = {
				iss,
				aud: tool.oAuthClientId,
				sub: userId,
				name,
				exp: current.getTime() + 3 * 60,
				iat: current.getTime(),
				nonce: generateNonce(16),
				'https://purl.imsglobal.org/spec/lti/claim/message_type': tool.lti_message_type,
				'https://purl.imsglobal.org/spec/lti/claim/roles': [
					`http://purl.imsglobal.org/vocab/lis/v2/membership#${roleName}`,
				],
				'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
					id: tool._id,
				},
				'https://purl.imsglobal.org/spec/lti/claim/version': tool.lti_version,
				'https://purl.imsglobal.org/spec/lti/claim/deployment_id': tool._id,
				'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings':
					(tool.lti_message_type === 'LtiDeepLinkingRequest'
						? {
							accept_types: ['ltiLink'],
							accept_media_types: 'image/*,text/html',
							accept_presentation_document_targets: ['iframe', 'window'],
							deep_link_return_url: `${iss}courses/x/tools/link/${tool._id}`,
						}
						: undefined),
			};

			api(req).post('/tools/sign/lti13/', { json: { request: idToken } }).then((signedToken) => {
				res.render('courses/components/run-lti-frame', {
					url: tool.url,
					method: 'POST',
					csrf: true,
					formData: [{ name: 'id_token', value: signedToken }],
				});
			});
		}
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

const addLinkHandler = (req, res, next) => {
	// TODO: validate LTI response
	api(req).get(`/ltiTools/${req.params.ltiToolId}`)
		.then((tool) => {
			const idToken = jwt.verify(req.body.id_token, tool.key, { algorithm: 'RS256' });
			if (idToken.iss !== tool.oAuthClientId) {
				res.send('Issuer stimmt nicht überein.');
			}
			if (idToken.aud !== (HOST || 'http://localhost:3100/')) {
				res.send('Audience stimmt nicht überein.');
			}

			const content = idToken['https://purl.imsglobal.org/spec/lti-dl/claim/content_items'];
			res.render('courses/deep-link', {
				url: content.url,
				title: content.title,
			});
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
router.post('/link/:ltiToolId', addLinkHandler);

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
