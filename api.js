const { Configuration } = require('@hpi-schul-cloud/commons');
const api = require('./helpers/apiHelper');

const xApiKey = Configuration.get('API__API_KEY');
const timeout = Configuration.get('API__REQUEST_TIMEOUT_MS');
const keepAlive = Configuration.get('API__KEEP_ALIVE');
const url = Configuration.get('BACKEND_URL');

module.exports = api(url, { keepAlive, xApiKey, timeout });
