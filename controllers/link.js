const express = require('express');

const router = express.Router();
const api = require('../api');

router.post('/', (req, res, next) => {
	// check first if target already exists (preventing db to be wasted)
	const target = `${(req.headers.origin || process.env.HOST)}/${req.body.target}`;
	api(req).get('/link/', { qs: { target } }).then((result) => {
		const existingLink = result.data[0];
		if (!existingLink) {
			api(req).post('/link/', { json: { target } }).then((data) => {
				data.newUrl = `${(req.headers.origin || process.env.HOST)}/link/${data._id}`;
				res.json(data);
			});
		} else {
			existingLink.newUrl = `${(req.headers.origin || process.env.HOST)}/link/${existingLink._id}`;
			res.json(existingLink);
		}
	}).catch(err => next(err));
});

// handles expired registration links
router.get('/expired', (req, res, next) => {
	res.render('link/expired');
});

// handles invalid or nonexistent links
router.get('/invalid', (req, res, next) => {
	res.render('link/invalid');
});

// handles redirecting from client
router.get('/:id', (req, res, next) => {
	const baseUrl = process.env.PUBLIC_BACKEND_URL || 'http://localhost:3030';
	res.redirect(`${baseUrl}/link/${req.params.id}?includeShortId=true`);
});

module.exports = router;
