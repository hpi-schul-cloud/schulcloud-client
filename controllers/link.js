const express = require('express');

const router = express.Router();
const api = require('../api');
const logger = require('../helpers/logger');

const { HOST } = require('../config/global');

router.post('/', (req, res, next) => {
	// check first if target already exists (preventing db to be wasted)
	const target = `${(req.headers.origin || HOST)}/${req.body.target}`;
	api(req).get('/link/', { qs: { target } }).then((result) => {
		const existingLink = result.data[0];
		if (!existingLink) {
			api(req).post('/link/', { json: { target } }).then((data) => {
				data.newUrl = `${(req.headers.origin || HOST)}/link/${data._id}`;
				res.json(data);
			});
		} else {
			existingLink.newUrl = `${(req.headers.origin || HOST)}/link/${existingLink._id}`;
			res.json(existingLink);
		}
	}).catch((err) => next(err));
});

// handles redirecting from client
router.get('/:id', (req, res, next) => {
	if (!req.params || !req.params.id) {
		return res.send(400);
	}
	const customError = { message: res.$t('link.text.invalidLink'), statusCode: 404 };
	return api(req).get(`/link/${req.params.id}?includeShortId=true&redirect=false`)
		.then((result) => {
			if (result.target) {
				return res.redirect(result.target);
			}
			return next(customError);
		}).catch((err) => {
			if (err && err.error && err.error.code === 404) {
				logger.error('invalid link has been requested', err);
				return next(customError);
			}
			return next(err);
		});
});

module.exports = router;
