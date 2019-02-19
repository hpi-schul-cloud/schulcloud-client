const express = require('express');

const router = express.Router();
const winston = require('winston');
const api = require('../api');
const { authChecker } = require('../helpers/authentication');

const logger = winston.createLogger({
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
			),
		}),
	],
});

const postRequest = (req, res, next) => {
	if (process.env.NOTIFICATION_SERVICE_ENABLED) {
		api(req).post(res.locals.url, {
			body: res.locals.body,
		}).then((response) => {
			res.json(response);
		}).catch(err => res.status(500).send('notification service error'));
	} else {
		res.status(500).send('notification service not enabled');
	}
};

const cleanupConfig = (config) => {
	const retValue = {};
	const keys = Object.keys(config);
	for (const key of keys) {
		if (config.hasOwnProperty(key)) {
			const r = { push: false, mail: false };
			if (config[key].mail) r.mail = true;
			if (config[key].push) r.push = true;
			retValue[key] = r;
		}
	}
	return retValue;
};

router.delete('/device', authChecker, (req, res, next) => {
	if (process.env.NOTIFICATION_SERVICE_ENABLED) {
		api(req).delete(`notification/devices/${req.body.id}`)
			.then(() => res.sendStatus(200));
	} else {
		res.status(500).send('notification service not enabled');
	}
});

router.post('/devices', authChecker, (req, res, next) => {
	res.locals.url = 'notification/devices';
	res.locals.body = {
		userId: res.locals.currentUser._id,
		token: req.body.id,
		service: req.body.service,
	};
	next();
}, postRequest);

router.post('/getDevices', authChecker, (req, res, next) => {
	api(req).get('/notification/devices').then((devices) => {
		res.json(devices);
	}).catch((err) => {
		winston.error(err);
		res.send(500);
	});
});

router.get('/configuration/:config', authChecker, (req, res, next) => {
	api(req).get(`/notification/configuration/${req.params.config}`).then((config) => {
		res.json(config);
	}).catch((err) => {
		winston.error(err);
		res.send(500);
	});
});

router.post('/configuration/:config', authChecker, (req, res, next) => {
	const body = cleanupConfig(req.body);
	api(req).patch(`/notification/configuration/${req.params.config}`, {
		body,
	}).then(options => res.json(options))
		.catch((err) => {
			winston.error(err);
			res.send(500);
		});
});

router.post('/callback', (req, res, next) => {
	res.locals.url = 'notification/callback';
	res.locals.body = req.body;

	const sendClientResponse = (response) => {
		if (response && response.redirect && response.redirect !== null) {
			return res.redirect(response.redirect);
		}
		return res.redirect('/');
	};

	res.locals.url = 'notification/callback';
	res.locals.body = {
		messageId: req.params.messageId,
		receiverId: req.params.receiverId,
		redirect: req.query.redirect || null,
	};
	if (process.env.NOTIFICATION_SERVICE_ENABLED) {
		api(req).post(res.locals.url, {
			body: res.locals.body,
		}).then(response => sendClientResponse(response)).catch((err) => {
			logger.error('could not mark message as read', err);
			return sendClientResponse();
		});
	} else {
		logger.error('could not mark message as read because notification service was disabled, redirect');
		return sendClientResponse();
	}
});

router.post('/message', authChecker, (req, res, next) => {
	res.locals.url = 'notification/messages';
	res.locals.body = req.body;

	next();
}, postRequest);

router.post('/push/test', authChecker, (req, res, next) => {
	const user = res.locals.currentUser;
	user.id = user._id;
	res.locals.url = 'notification/push';
	res.locals.body = {
		payload: {
			title: 'Test-Benachrichtigung',
			message: 'wurde erfolgreich zugestellt!',
		},
		users: [user],
		template: 'global-push-message',
	};
	next();
}, postRequest);

module.exports = router;
