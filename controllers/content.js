/*
 * One Controller per layout view
 */


const url = require('url');
const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {
    const query = req.query.q;

    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/contents/', {
        qs: {
            query,
            $limit: itemsPerPage,
            $skip: itemsPerPage * (currentPage - 1)
        }
    }).then(result => {
        const {meta = {}, data = []} = result;

        // get base url with all filters and query
        const urlParts = url.parse(req.originalUrl, true);
        urlParts.query.p = '{{page}}';
        delete urlParts.search;
        const baseUrl = url.format(urlParts);

        const pagination = {
            currentPage,
            numPages: Math.ceil(meta.page.total / itemsPerPage),
            maxItems: 10,
            baseUrl
        };

        const results = data.map(result => {
            return result.attributes;
        });

        res.render('content/search', {title: 'Inhalte', query, results, pagination});
    });
});

module.exports = router;
