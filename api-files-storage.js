const { Configuration } = require('@hpi-schul-cloud/commons');
const api = require('./helpers/apiHelper');

const keepAlive = Configuration.get('API__KEEP_ALIVE');
const url = Configuration.get('FILES_STORAGE__SERVICE_BASE_URL');
const timeout = Configuration.get('FILES_STORAGE__SERVICE_BASE_URL');

module.exports = api(`${url}/api/`, { keepAlive, timeout });
