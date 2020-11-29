const apiHelper = require('./helpers/apiHelper');
const { KEEP_ALIVE, BACKEND_URL } = require('./config/global');

module.exports = {
	api: apiHelper(BACKEND_URL, { keepAlive: KEEP_ALIVE }),
};
