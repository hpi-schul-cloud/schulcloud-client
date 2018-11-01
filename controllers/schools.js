const express = require('express');
const router = express.Router();
const api = require('../api');

// schools

router.get('/', async function(req, res, next) {

    try {
        let schools = await api(req).get('/schools/', {
            qs: {
                federalState: req.query.federalState/*,
                _id : {
                    $ne : res.locals.currentUser.school
                }*/
            }
        });

        const result = schools.data.map((school) => {
            return {
                _id : school._id,
                name: school.name
            };
        });

        return res.json(result);
    } catch(e) {
        let error = new Error('Ungültige Anfrage');
        error.status = 400;
        return next(error);
    }
});

module.exports = router;