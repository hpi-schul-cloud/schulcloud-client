const express = require('express');

const router = express.Router();
const api = require('../api');

const { HOST } = process.env;

router.post('/', async (req, res, next) => {
	// create link without duplicate prevention, moved to server
	const target = `${(req.headers.origin || HOST)}/${req.body.target}`;
	try {
		const data = await api(req).post('/link/', { json: { target } });
		data.newUrl = `${(req.headers.origin || HOST)}/link/${data._id}`;
		res.json(data);
	} catch (error) {
		next(error);
	}
});

// handles redirect to link and error pages
router.get('/:id', (req, res, next) => {
	api(req).get(`/link/${req.params.id}`).then((result) => {
		// redirect to target provided by server
		res.redirect(result.target);
	}).catch((err) => {
		switch (err.statusCode) {
			// if link has expired
			case 403:
				res.render('link/expired');
				break;
			// if link doesn't exist
			default:
				res.render('link/invalid');
				break;
		}
	});
});

module.exports = router;
