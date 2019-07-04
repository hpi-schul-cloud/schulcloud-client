const express = require('express');
const router = express.Router();
const api = require('../api');
const logger = require('winston');

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.post('/', function (req, res, next) {
    if (!req.body.subject && req.body.target) {
        if(req.body.target === "HPI"){ // Contact Admin
            // title? Y: Feedback N: Problem
            req.body.subject = req.body.type + ((req.body.title) ? `: ${req.body.title}` : '');
        }
        req.body.type = `contact${req.body.target}`;
    }
	api(req).post('/helpdesk', {
        json: {
            type: req.body.type,
			subject: req.body.subject,
			title: req.body.title,
            category: req.body.category,
            role: req.body.role,
            desire: req.body.desire,
            benefit: req.body.benefit,
            acceptanceCriteria: req.body.acceptanceCriteria,
            currentState: req.body.currentState,
            targetState: req.body.targetState,
            schoolName: res.locals.currentSchoolData.name,
            userId: res.locals.currentUser._id,
            email: req.body.email,
            schoolId: res.locals.currentSchoolData._id,
            cloud: res.locals.theme.title,
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
