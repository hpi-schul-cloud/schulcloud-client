const express = require('express');
const router = express.Router();
const api = require('../api');

router.post('/', function (req, res, next) {
    api(req).post("/link/", {json: {target: `${req.headers.origin}/${req.body.target}` }}).then(data => {
        data.newUrl = `${req.headers.origin}/link/${data._id}`;
        res.json(data);
    }).catch(err => next(err));
});

// handles redirecting from client
router.get('/:id', function (req, res, next) {
    let baseUrl = process.env.BACKEND_URL || 'http://localhost:3030/';
    res.redirect(`${baseUrl}link/${req.params.id}`);
});

module.exports = router;
