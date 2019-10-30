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
