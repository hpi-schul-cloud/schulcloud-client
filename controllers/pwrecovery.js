
const express = require('express');

const router = express.Router();
const api = require('../api');

router.get('/response', (req, res, next) => {
	res.render('pwRecovery/pwRecoveryResponse');
});

router.get('/failed', (req, res, next) => {
	res.render('pwRecovery/pwRecoveryFailed');
});

router.get('/:pwId', (req, res, next) => {
	api(req)
		.get(`/passwordRecovery/${req.params.pwId}`)
		.then((result) => {
			if (result.changed) {
				const error = new Error(
					'Ihr Passwort wurde bereits über diese URL geändert.',
				);
				error.status = 400;
				throw error;
			}
			if (Date.now() - Date.parse(result.createdAt) >= 86400000) {
				const error = new Error('Zeit abgelaufen für Passwort Recovery.');
				error.status = 400;
				throw error;
			}
			return res.render('pwRecovery/pwrecovery', {
				title: 'Passwort-Wiederherstellung',
				resetId: req.params.pwId,
				action: '/pwrecovery/reset/',
				buttonLabel: 'Neues Passwort anlegen',
				inline: true,
				hideMenu: true,
			});
		})
		.catch(next);
});

router.post('/', (req, res, next) => {
	const username = req.body.username.toLowerCase();
	api(req).post('/passwordRecovery', { json: { username } }).then((result) => {
		res.locals.result = result;
		res.redirect('response');
		next();
	}).catch((err) => {
		if (err.statusCode === 400 && err.error.message === 'EMAIL_DOMAIN_BLOCKED') {
			res.redirect('failed');
		} else {
			res.redirect('response');
		}
	});
});

router.post('/reset', (req, res, next) => {
	api(req).post('/passwordRecovery/reset', { json: req.body }).then(() => {
		res.redirect('/login/');
	}).catch((err) => {
		next(err);
	});
});


module.exports = router;
