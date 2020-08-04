const crypto = require('crypto');

const nonceValueSet = (req, res, next) => {
	const nonceValue = crypto.randomBytes(16).toString('base64');
	res.locals.nonceValue = nonceValue;
	next();
};

module.exports = { nonceValueSet };
