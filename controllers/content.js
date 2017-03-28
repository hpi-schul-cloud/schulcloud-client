/*
 * One Controller per layout view
 */


const url = require('url');
const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');
const _subjects = require('../helpers/content/subjects.json');
const _ = require('lodash');
const subjects = _.mapValues(_subjects, v => ({name: v}));

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {
    const query = req.query.q;

    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;

    if(!query && !req.query.filter) {
        res.render('content/search', {title: 'Inhalte', query, results: [], subjects});
        return;
    }

    api(req).get('/contents/', {
        qs: {
            query,
            filter: req.query.filter,
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

        let selectedSubjects = _.cloneDeep(subjects);
        let querySubjects = ((req.query.filter || {}).subjects || []);
        if(!Array.isArray(querySubjects)) querySubjects = [querySubjects];
        querySubjects.forEach(s => {selectedSubjects[s].selected = true;});

        res.render('content/search', {title: 'Inhalte', query, results, pagination, subjects: selectedSubjects});
    });
});

module.exports = router;
