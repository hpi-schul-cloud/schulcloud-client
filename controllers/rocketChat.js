
const express = require('express');
const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');

router.use(authHelper.authChecker);

router.get('/Iframe', function(req, res, next) {
    return api(req).get('/rocketChat/login/' + res.locals.currentUser._id).then(result => {
        let shortURL = process.env.ROCKET_CHAT_URI;
        let rocketChatURL = `${shortURL}/home`;
        return res.send(`<script>
            window.parent.postMessage({
                event: 'login-with-token',
                loginToken: '${result.authToken}'
                }, '${rocketChatURL}');
            </script>`
        )
    }) 
})

router.get('/authGet', function(req, res, next) {
    return api(req).get('/rocketChat/login/' + res.locals.currentUser._id , {}).then(result => {
        return res.send({
            loginToken: result.authToken
        })
    })
})

module.exports = router;