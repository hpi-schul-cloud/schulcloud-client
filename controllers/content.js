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

router.get('/:id', function (req, res, next) {
    Promise.all([
        api(req).get('/courses/', {
            qs: {
                teacherIds: res.locals.currentUser._id}
        }),
        api(req).get('/contents/' + req.params.id)]).
    then(([courses, content]) => {
        res.json({
            courses: courses,
            content: content
        });
    }).catch(err => {
        next(err);
    });
});

router.get('/', function (req, res, next) {
    const query = req.query.q;

    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;

    if(!query && !req.query.filter) {
        res.render('content/search', {title: 'Inhalte', query, results: [], subjects});
        return;
    }

    let selectedSubjects = _.cloneDeep(subjects);
    let querySubjects = ((req.query.filter || {}).subjects || []);
    if(!Array.isArray(querySubjects)) querySubjects = [querySubjects];
    querySubjects.forEach(s => {selectedSubjects[s].selected = true;});

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
            numPages: Math.ceil((meta.page || {}).total / itemsPerPage),
            maxItems: 10,
            baseUrl
        };

        const total = result.total || "keine";

        const results = data.map(result => {
            let res = result.attributes;
            res.href = result.id;
            return res;
        });

        let action = 'addToLesson';
        res.render('content/search', {title: 'Inhalte', query, results, pagination, action, subjects: selectedSubjects, total});
    })
        .catch(error => {
            res.render('content/search', {title: 'Inhalte', query, subjects: selectedSubjects, notification: {
                type: 'danger',
                message: `${error.name} ${error.message}`
            }});
        });
});

router.post('/addToLesson', function (req, res, next) {
   api(req).post('/materials/', {
       json: req.body
   }).then(material => {
       api(req).patch('/lessons/' + req.body.lessonId, {
           json: {
               $push: {
                   materialIds: material._id
               }
           }
       }).then(result => {
           res.redirect('/content/?q=' + req.body.query);
       });
   }); 
});

module.exports = router;
