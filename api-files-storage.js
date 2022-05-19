const api = require('./helpers/apiHelper');
const { KEEP_ALIVE, FILES_STORAGE__SERVICE_BASE_URL } = require('./config/global');

module.exports = api(`${FILES_STORAGE__SERVICE_BASE_URL}/api/`, { keepAlive: KEEP_ALIVE });
