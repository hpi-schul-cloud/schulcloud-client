const api = require('./helpers/apiHelper');
const { KEEP_ALIVE, BACKEND_URL } = require('./config/global');

module.exports = api(BACKEND_URL, { keepAlive: KEEP_ALIVE });
