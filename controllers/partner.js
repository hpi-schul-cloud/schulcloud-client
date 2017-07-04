const express = require('express');
const router = express.Router();
const _orderBy = require('lodash').orderBy;
const authHelper = require('../helpers/authentication');

// Partners
const partners = require('../helpers/partner/partners.json');

// Sort Content-Partners, Sponsors & Advisers by Name
partners.content_partners = _orderBy(partners.content_partners,
    [x => x.name.toLowerCase()], ['asc']);
partners.sponsors = _orderBy(partners.sponsors,
    [x => x.name.toLowerCase()], ['asc']);
partners.advisers = _orderBy(partners.advisers,
    [x => x.name.toLowerCase()], ['asc']);

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {
    res.render('partner/partner', {
        title: 'Partner',
        logo_prefix: "/images/partner/",
        partners: partners
    });
});

module.exports = router;
