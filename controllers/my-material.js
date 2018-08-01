const express = require('express');
const router = express.Router();

const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const api = require('../api');

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {
    return res.render('my-material/my-material');
});

router.get('/publish', function (req, res, next) {
    return res.render('my-material/my-material');
});

router.get('/review', function (req, res, next) {
    return res.render('my-material/review'); 
});

module.exports = router;
