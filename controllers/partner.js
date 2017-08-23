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

router.get('/', function (req, res, next) {

    authHelper.isAuthenticated(req).then(isAuthenticated => {
        let template = isAuthenticated ? 'partner/partner_loggedin' : 'partner/partner_guests';
        if(isAuthenticated) {
            return authHelper.populateCurrentUser(req, res)
                .then(_ => authHelper.restrictSidebar(req, res))
                .then(_ => Promise.resolve(template));
        }
        return Promise.resolve(template);
    }).then( template =>
        res.render(template, {
            title: 'Partner',
            logo_prefix: "/images/partner/",
            inline: true,
            partners: partners,
        })
    );
});

module.exports = router;
