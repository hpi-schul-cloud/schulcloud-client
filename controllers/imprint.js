const _ = require('lodash');
const express = require('express');
const router = express.Router();
const api = require('../api');

router.get('/', function (req, res, next) {
    res.render('imprint/imprint', {
        title: 'Impressum',
    });
});

module.exports = router;