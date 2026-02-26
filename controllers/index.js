const express = require('express');

const router = express.Router();

// only execute middleware on this router
const handlebarsHelper = require('../helpers/handlebars');

router.use(handlebarsHelper.middleware);

router.use(require('./login'));
router.use(require('./registration'));

router.use('/account/', require('./account'));
router.use('/calendar/', require('./calendar'));
router.use('/courses/', require('./courses'));
router.use('/courses/:courseId/topics/', require('./topics'));
router.use('/courses/:courseId/groups/', require('./coursegroups'));
router.use('/teams/', require('./teams'));
router.use('/teams/:targetId/news', require('./news'));
router.use('/teams/:teamId/topics/', require('./topics'));
router.use('/dashboard/', require('./dashboard'));
router.use('/files/', require('./files'));
router.use('/homework/', require('./homework'));
router.use('/news/', require('./news'));
router.use('/pwrecovery/', require('./pwrecovery'));
router.use('/link/', require('./link'));
router.use('/community/', require('./community'));
router.use('/help/', require('./help'));
router.use('/privacypolicy/', require('./dataprivacy'));
router.use('/termsofuse/', require('./termsofuse'));
router.use('/base64Files', require('./base64Files'));
router.use('/firstLogin', require('./firstLogin'));
router.use('/forcePasswordChange', require('./forcePasswordChange'));
router.use('/oauth2', require('./oauth2'));
router.use('/welcome', require('./welcome'));
router.use('/schools/', require('./schools'));
router.use('/users/', require('./users'));
router.use('/rocketChat/', require('./rocketChat'));
router.use('/messenger/', require('./messenger'));
router.use('/videoconference', require('./videoconference'));
router.use('/administration/', require('./administration'));
router.use('/alerts', require('./alerts'));
router.use('/ghost', require('./ghost'));
router.use('/blog', require('./blog'));
router.use('/system/', require('./system'));

module.exports = router;
