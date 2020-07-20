
const express = require('express');

const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');
const { ROCKET_CHAT_URI } = require('../config/global');

router.use(authHelper.authChecker);

router.get('/Iframe', (req, res, next) => api(req).get(`/rocketChat/login/${res.locals.currentUser._id}`).then((result) => {
	const shortURL = ROCKET_CHAT_URI;
	const rocketChatURL = `${shortURL}/home`;
	return res.send(`<script>
            window.parent.postMessage({
                event: 'login-with-token',
                loginToken: '${result.authToken}'
                }, '${rocketChatURL}');
            </script>`);
}));

router.get('/authGet', (req, res, next) => api(req).get(`/rocketChat/login/${res.locals.currentUser._id}`, {}).then((result) => res.send({
	loginToken: result.authToken,
})));

module.exports = router;
