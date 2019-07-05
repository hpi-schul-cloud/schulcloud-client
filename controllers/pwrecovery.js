
const express = require('express');
const router = express.Router();
const api = require('../api');

const obscure_email = (email) => {
    let parts = email.split("@");
    let name = parts[0];
    let result = name.charAt(0);
    for(var i=1; i<name.length; i++) {
        result += "*";
    }
    result += name.charAt(name.length - 1);
    result += "@";
    let domain = parts[1];
    result += domain.charAt(0);
    let dot = domain.indexOf(".");
    for(var j=1; j<dot; j++) {
        result += "*";
    }
    result += domain.substring(dot);

    return result;
};

router.get('/response', (req, res, next) => {
	res.render('pwRecovery/pwRecoveryResponse');
});

router.get('/:pwId', (req, res, next) => {
	api(req)
		.get(`/passwordRecovery/${req.params.pwId}`, {
			qs: { $populate: ['account'] },
		})
		.then((result) => {
			if (result.changed) {
				const error = new Error(
					'Ihr Passwort wurde bereits über diese URL geändert.'
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
				title: 'Passwort Recovery',
				subtitle: obscure_email(result.account.username),
				accountId: result.account._id,
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
	}).catch(() => {
		res.redirect('response');
	});
});

router.post('/reset', function (req, res, next) {
    api(req).post('/passwordRecovery/reset', {json: req.body}).then(_ => {
        res.redirect('/login/');
    }).catch(err => {
        next(err);
    });
});



module.exports = router;
