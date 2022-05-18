const api = require('./helpers/apiHelper');
const { KEEP_ALIVE, FILES_STORAGE_BACKEND_URL } = require('./config/global');

module.exports = api(FILES_STORAGE_BACKEND_URL, { keepAlive: KEEP_ALIVE });
