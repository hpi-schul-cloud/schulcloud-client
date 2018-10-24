const express = require('express');
const router = express.Router();
const api = require('../api');
const logger = require('winston');

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.post('/', function (req, res, next) {
    api(req).post('/helpdesk', {
        json: {
            type: req.body.type,
            subject: req.body.subject,
            category: req.body.category,
            role: req.body.role,
            desire: req.body.desire,
            benefit: req.body.benefit,
            acceptanceCriteria: req.body.acceptanceCriteria,
            currentState : req.body.currentState,
            targetState: req.body.targetState,
            schoolName: res.locals.currentSchoolData.name,
            userId: res.locals.currentUser._id,
            email: req.body.email,
            schoolId: res.locals.currentSchoolData._id,
            cloud: res.locals.theme.title
        }
    })
    .then(_ => {
        res.sendStatus(200);
    }).catch(err => {
        logger.warn(err);
    });
});

module.exports = router;
