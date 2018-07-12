const express = require('express');
const router = express.Router();

const authHelper = require('../helpers/authentication');
const permissionsHelper = require('../helpers/permissions');
const api = require('../api');

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res, next) {
    return res.render('my-material/my-material', {
        title: 'Suche in Lehrer-generierten Materialien'
    });
});

router.get('/search', function (req, res, next) {
    return res.render('my-material/my-material', {
        title: 'Suche in Lehrer-generierten Materialien'
    });

});

router.post('/search', function (req, res, next) {
    const query = req.body;
    const itemsPerPage = (req.query.limit || 9);
    const currentPage = parseInt(req.query.p) || 1;

    // Featured Content
    api(req)({
      uri: '/content/search/',
      qs: {
          query: query,
          $limit: itemsPerPage,
          $skip: itemsPerPage * (currentPage - 1),
      },
      json: true
    }).then(searchResults => {
      const pagination = {
          currentPage,
          numPages: Math.ceil(searchResults.total / itemsPerPage),
          baseUrl: req.baseUrl + '/?' + 'q=' + query + '&p={{page}}'
      };

      return res.render('my-material/my-material', {
          title: 'Vorgeschlagene Materialien aus der Suche',
          query: query,
          searchResults: searchResults.hits.hits,
          hits: searchResults.hits.total,
          pagination
      });
    });

});

module.exports = router;
