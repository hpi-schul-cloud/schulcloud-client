const express = require('express');

const router = express.Router();
const logger = require('winston');
const fileUpload = require('express-fileupload');
const UAParser = require('ua-parser-js');
const redirectHelper = require('../helpers/redirect');
const api = require('../api');
const { MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE } = require('../config/global');

// secure routes
router.use(require('../helpers/authentication').authChecker);

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
			throw new Error(res.$t('helpdesk.text.fileWrongFormat', { filename: element.name }));
		}
		fileSize += element.size;
	});
	if (fileSize > MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE) {
		if (files.length > 1) {
			throw new Error(res.$t('helpdesk.text.filesTooLarge'));
		} else {
			throw new Error(res.$t('helpdesk.text.fileTooLarge'));
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

module.exports = router;
