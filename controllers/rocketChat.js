const { Configuration } = require('@hpi-schul-cloud/commons');
const express = require('express');

const router = express.Router();
const api = require('../api');
const authHelper = require('../helpers/authentication');

const ROCKET_CHAT_URI = Configuration.get('ROCKET_CHAT_URI');

router.use(authHelper.authChecker);

router.get('/Iframe', async (req, res, next) => {
	try {
		const result = await api(req).get(`/rocketChat/login/${res.locals.currentUser._id}`);
		const shortURL = ROCKET_CHAT_URI;
		const rocketChatURL = `${shortURL}/home`;
		res.send(`<script>
                window.parent.postMessage({
                    event: 'login-with-token',
                    loginToken: '${result.authToken}'
                    }, '${rocketChatURL}');
                </script>`);
		return result;
	} catch (err) {
		next(err);
	}
});

router.get('/authGet', async (req, res, next) => {
	try {
		const result = await api(req).get(`/rocketChat/login/${res.locals.currentUser._id}`, {});
		res.send({
			loginToken: result.authToken,
		});
		return result;
	} catch (err) {
		next(err);
	}
});

module.exports = router;
