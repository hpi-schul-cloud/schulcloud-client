const {
	filterLog, filterQuery, filter,
} = require('./logFilter');
const { nonceValueSet } = require('./csp');
const prometheus = require('./prometheus');
const { tokenInjector, duplicateTokenHandler, csrfErrorHandler } = require('./csrf');
const logger = require('./logger');

module.exports = {
	filterLog,
	filterQuery,
	filter,
	nonceValueSet,
	prometheus,
	tokenInjector,
	duplicateTokenHandler,
	csrfErrorHandler,
	logger,
};
