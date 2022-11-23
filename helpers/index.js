const {
	filterLog, filterQuery, filter, formatError,
} = require('./logFilter');
const { nonceValueSet } = require('./csp');
const prometheus = require('./prometheus');
const { tokenInjector, duplicateTokenHandler, csrfErrorHandler } = require('./csrf');
const logger = require('./logger');

module.exports = {
	filterLog,
	filterQuery,
	filter,
	formatError,
	nonceValueSet,
	prometheus,
	tokenInjector,
	duplicateTokenHandler,
	csrfErrorHandler,
	logger,
};
