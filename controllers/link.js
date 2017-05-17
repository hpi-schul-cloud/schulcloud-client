const express = require('express');
const router = express.Router();
const api = require('../api');

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.post('/', function (req, res, next) {
    let target = `${req.protocol}://${req.get('host')}/register/${req.body.schoolId}`;
    api(req).post("/link/", {json: {target: target}}).then(data => {
        data.newUrl = `${req.protocol}://${req.get('host')}/link/${data._id}`;
        res.json(data);
    }).catch(err => next(err));
});

// handles redirecting from client
router.get('/:id', function (req, res, next) {
    let baseUrl = process.env.BACKEND_URL || 'http://localhost:3030';
    res.redirect(`${baseUrl}/link/${req.params.id}`);
});

module.exports = router;
