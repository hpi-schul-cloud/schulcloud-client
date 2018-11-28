const express = require('express');
const router = express.Router();

const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const api = require('../api');

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {

    const query = req.query.q;
    return res.render('my-material/my-material', {
        title: 'Meine Materialien',
    });

});

module.exports = router;