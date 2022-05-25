const { Configuration } = require('@hpi-schul-cloud/commons');
const api = require('./helpers/apiHelper');

const timeout = Configuration.get('REQUEST_OPTION__TIMEOUT_MS');
const keepAlive = Configuration.get('REQUEST_OPTION__KEEP_ALIVE');
const url = Configuration.get('API_HOST');

module.exports = api(`${url}/`, { keepAlive, timeout });
