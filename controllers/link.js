const express = require('express');
const router = express.Router();
const api = require('../api');

router.post('/', function (req, res, next) {
    // check first if target already exists (preventing db to be wasted)
    let target = `${req.headers.origin}/${req.body.target}`;
    api(req).get("/link/", {qs: {target: target}}).then(result => {
        let existingLink = result.data[0];
        if (!existingLink) {
            api(req).post("/link/", {json: {target:  target}}).then(data => {
                data.newUrl = `${req.headers.origin}/link/${data._id}`;
                res.json(data);
            });
        } else {
            existingLink.newUrl = `${req.headers.origin}/link/${existingLink._id}`;
            res.json(existingLink);
        }
    }).catch(err => next(err));
});

// handles redirecting from client
router.get('/:id', function (req, res, next) {
    let baseUrl = process.env.BACKEND_URL || 'http://localhost:3030';
    res.redirect(`${baseUrl}/link/${req.params.id}`);
});

module.exports = router;
