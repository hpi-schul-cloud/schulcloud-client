const express = require('express');
const api = require('../api');

const router = express.Router();

router.use(require('../helpers/authentication').authChecker);

router.post('/', (req, res, next) => {
    if(req.body.resetTimer){
        api(req).post('/accounts/jwtTimer').then(result => {
            return res.sendStatus(200);
        }).catch(err => {
            return res.status(500).send('Could not update remaining session time');
        });
    }else{
        api(req).get('/accounts/jwtTimer').then(result => {
            return res.send(result);
        }).catch(err => {
            return res.status(500).send('Could not get remaining session time');
        });
    }
});

module.exports = router;
