const express = require('express');

const router = express.Router();
const logger = require('winston');
const UAParser = require('ua-parser-js');
const api = require('../api');

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.post('/', (req, res, next) => {
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

	const fileMaxSize = 10 * 1024 * 1024; // 10 MB
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
			throw new Error(`"${element.name}" ist kein Bild, Video oder Textdatei!`);
		}
		fileSize += element.size;
	});
	if (fileSize > fileMaxSize) {
		if (files.length > 1) {
			throw new Error('Die angehängten Dateien überschreitet die maximal zulässige Gesamtgröße!');
		} else {
			throw new Error('Die angehängte Datei überschreitet die maximal zulässige Größe!');
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
                'Feedback erfolgreich versendet!',
			};
			res.redirect(req.header('Referer'));
		}).catch((err) => {
			req.session.notification = {
				type: 'danger',
				message:
                'Fehler beim Senden des Feedbacks.',
			};
			logger.warn(err);
			res.status((err.statusCode || 500)).send(err);
		});
});

module.exports = router;
