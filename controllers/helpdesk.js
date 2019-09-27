const express = require('express');
const router = express.Router();
const api = require('../api');
const logger = require('winston');
const UAParser = require('ua-parser-js');

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.post('/', function (req, res, next) {
    if (!req.body.subject && req.body.target) {
        if(req.body.target === "HPI"){ // Contact Admin
            // title? Y: Feedback N: Problem
            req.body.subject = req.body.type + ((req.body.title) ? `: ${req.body.title}` : '');
        }
    }
    req.body.type = `contact${req.body.target}`;

	// read User-Agent
	const parser = new UAParser();
	parser.setUA(req.headers['user-agent']);
	const result = parser.getResult();

	api(req).post('/helpdesk', {
        json: {
            type: req.body.type,
			subject: req.body.subject,
			title: req.body.title,
			category: req.body.category ? req.body.category : 'nothing selected',
            role: req.body.role,
            desire: req.body.desire,
            benefit: req.body.benefit,
            acceptanceCriteria: req.body.acceptanceCriteria,
            currentState: req.body.currentState,
            targetState: req.body.targetState,
            schoolName: res.locals.currentSchoolData.name,
            userId: res.locals.currentUser._id,
            email: req.body.email,
			replyEmail: req.body.replyEmail,
			schoolId: res.locals.currentSchoolData._id,
            cloud: res.locals.theme.title,
			browserName: result.browser.name,
			browserVersion: result.browser.version,
			os: (result.os.version != undefined) ? result.os.name + ' ' + result.os.version : result.os.name,
        }
    })
    .then(_ => {
        res.redirect(req.header('Referer'));
    }).catch(err => {
        logger.warn(err);
        res.status((err.statusCode || 500)).send(err);
    });
});

module.exports = router;
