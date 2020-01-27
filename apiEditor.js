const api = require('./helpers/apiHelper');
const { EDITOR_URL } = require('./config/global');

module.exports = api(EDITOR_URL);
