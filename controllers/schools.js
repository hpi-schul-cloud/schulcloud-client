const express = require('express');
const router = express.Router();
const api = require('../api');

// schools

// retrieve schools except specified purpose
router.get('/exc/:purpose', async function(req, res, next) {
    try {
        let schools = await api(req).get('/schools/', {
            qs: {
                $limit: req.query.$limit,
                federalState: req.query.federalState,
                $sort: 'name',
                purpose: { $ne: req.params.purpose }
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
    
router.get('/', async function(req, res, next) {
    try {
        let schools = await api(req).get('/schools/', {
            qs: {
                $limit: req.query.$limit,
                federalState: req.query.federalState,
                $sort: 'name'
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