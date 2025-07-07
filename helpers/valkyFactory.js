const { Configuration } = require('@hpi-schul-cloud/commons');
const Valkey = require('iovalkey');
const RedisStore = require('connect-redis').default;
const util = require('util');
const session = require('express-session');
const dns = require('dns');
const logger = require('./logger');

class ValkeyFactory {
	static async build() {
		let storageClient;
		const mode = Configuration.get('SESSION_VALKEY__MODE');

		if (mode === 'cluster') {
			storageClient = await ValkeyFactory.createValkeySentinelInstanceStore();
		} else if (mode === 'single') {
			storageClient = ValkeyFactory.createValkeyInstanceStore();
		} else if (mode === 'in-memory') {
			storageClient = ValkeyFactory.createInMemoryStorage();
		} else {
			throw new Error(`Undefined valkey mode ${mode}`);
		}

		return storageClient;
	}

	static createInMemoryStorage() {
		const storageClient = new session.MemoryStore();
		logger.info('Using in-memory session store.');

		return storageClient;
	}

	static createValkeyInstance(params) {
		const redisInstance = new Valkey(params);
		redisInstance.on('error', (error) => logger.error(error));
		redisInstance.on('connect', (msg) => logger.info(msg));

		return redisInstance;
	}

	static createValkeyInstanceStore() {
		const redisUri = Configuration.get('SESSION_VALKEY__URI');
		try {
			const client = ValkeyFactory.createValkeyInstance(redisUri);
			logger.info(`Using Valkey session store at '${redisUri}'.`);

			const sessionStore = new RedisStore({ client });

			return sessionStore;
		} catch (err) {
			throw new Error('Can not create valky instance.', { cause: err });
		}
	}

	static async createValkeySentinelInstanceStore() {
		const sentinelName = Configuration.get('SESSION_VALKEY__SENTINEL_NAME');
		const sentinelPassword = Configuration.get('SESSION_VALKEY__SENTINEL_PASSWORD');
		const sentinalServiceName = Configuration.get('SESSION_VALKEY__SENTINEL_SERVICE_NAME');

		try {
			const sentinels = await ValkeyFactory.discoverSentinelHosts(sentinalServiceName);
			logger.info(`Using discovered Valkey sentinels: ${JSON.stringify(sentinels)}`);

			const client = ValkeyFactory.createValkeyInstance({
				sentinels,
				sentinelPassword,
				password: sentinelPassword,
				name: sentinelName,
			});

			const sessionStore = new RedisStore({ client });

			return sessionStore;
		} catch (err) {
			throw new Error('Can not create valky "sentinal" instance.', { cause: err });
		}
	}

	static async discoverSentinelHosts(sentinalServiceName) {
		const resolveSrv = util.promisify(dns.resolveSrv);
		const records = await resolveSrv(sentinalServiceName);

		const hosts = records.map((record) => ({
			host: record.name,
			port: record.port,
		}));

		return hosts;
	}
}

module.exports = {
	ValkeyFactory,
};
