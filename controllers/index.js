const express = require('express');
const router = express.Router();

router.use(require('./login'));
router.use(require('./registration'));

router.use('/account/', require('./account'));
router.use('/calendar/', require('./calendar'));
router.use('/content/', require('./content'));
router.use('/courses/', require('./courses'));
router.use('/courses/:courseId/lessons/', require('./lessons'));
router.use('/courses/:courseId/tools/', require('./tools'));
router.use('/dashboard/', require('./dashboard'));
router.use('/files/', require('./files'));
router.use('/homework/', require('./homework'));
router.use('/helpdesk/', require('./helpdesk'));

router.use('/administration/', require('./administration'));


module.exports = router;