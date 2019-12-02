const express = require('express');
const api = require('../api');

const router = express.Router();

router.get('/', async (req, res, next) => {
	const alert = await api(req).get('/alert');
	const contype = req.headers['content-type'];
	if (!contype || contype.indexOf('application/json') !== 0) {
		res.redirect('/');
		// TODO add new page for incidents
		// res.render('help/alerts', {
		// 	title: 'Aktuelle Vorfälle',
		// 	incidents: alert,
		// });
	}
	res.send(alert);
});

module.exports = router;
