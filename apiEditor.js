const api = require('./helpers/apiHelper');
const { BACKEND_URL } = require('./config/global');

module.exports = api(BACKEND_URL);
