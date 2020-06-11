const express = require('express');
const api = require('../api');

const router = express.Router();

router.get('/:id', async (req, res, next) => {
	try {
		const base64File = await Promise.resolve(
			api(req).get(`/base64Files/${req.params.id}`),
		);
		const fileData = base64File.data;
		res.json(fileData);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
