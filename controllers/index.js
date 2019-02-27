const express = require('express');
const router = express.Router();

// only execute middleware on this router
const handlebarsHelper = require('../helpers/handlebars');
router.use(handlebarsHelper.middleware);

// Track page views in Google Analytics
const googleAnalyticsHelper = require('../helpers/googleAnalytics');
router.use(googleAnalyticsHelper.middleware());

router.use(require('./login'));
router.use(require('./registration'));

router.use('/account/', require('./account'));
router.use('/calendar/', require('./calendar'));
router.use('/content/', require('./content'));
router.use('/courses/', require('./courses'));
router.use('/courses/:courseId/topics/', require('./topics'));
router.use('/courses/:courseId/tools/', require('./tools'));
router.use('/courses/:courseId/groups/', require('./coursegroups'));
router.use('/dashboard/', require('./dashboard'));
router.use('/files/', require('./files'));
router.use('/homework/', require('./homework'));
router.use('/news/', require('./news'));
router.use('/helpdesk/', require('./helpdesk'));
router.use('/pwrecovery/', require('./pwrecovery'));
router.use('/notification/', require('./notification'));
router.use('/link/', require('./link'));
router.use('/partner/', require('./partner'));
router.use('/community/', require('./community'));
router.use('/about/', require('./about'));
router.use('/help/', require('./help'));
router.use('/impressum/', require('./imprint'));
router.use('/team', require('./team'));
router.use('/my-material', require('./my-material'));
router.use('/logs', require('./logs'));
router.use('/firstLogin', require('./firstLogin'));
router.use('/welcome', require('./welcome'));

router.use('/administration/', require('./administration'));


module.exports = router;
