const express = require('express');
const router = express.Router();
const api = require('../api');

// users

router.get('/', async function(req, res, next) {

    try {
        let users = await api(req).get('/users/', {
            qs: {
                schoolId: req.query.schoolId,
                roles: ['teacher'],
                //teamsearchable: true,
                $sort: 'firstName'
            }
        });

        const result = users.data.map((user) => {
            return {
                _id : user._id,
                firstName: user.firstName,
                lastName: user.lastName
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