const dns = require('dns');
const Redis = require('iovalkey');
const RedisStore = require('connect-redis').default;
const session = require('express-session');
const util = require('util');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { logger } = require('.');
const {
	SESSION_VALKEY_URI,
	SESSION_VALKEY_CLUSTER_ENABLED,
	SESSION_VALKEY_SENTINEL_NAME,
	SESSION_VALKEY_SENTINEL_PASSWORD,
	SESSION_VALKEY_SENTINEL_SERVICE_NAME,
} = require('../config/global');

function getValkeyInstance(params) {
	const redisInstance = new Redis(params);
	redisInstance.on('error', (error) => logger.error(error));
	redisInstance.on('connect', (msg) => logger.info(msg));

	return redisInstance;
}

async function discoverSentinelHosts() {
	const serviceName = SESSION_VALKEY_SENTINEL_SERVICE_NAME;
	if (!serviceName) {
		throw new Error(
			'SENTINEL_SERVICE_NAME is required for service discovery',
		);
	}

	const resolveSrv = util.promisify(dns.resolveSrv);
	try {
		const records = await resolveSrv(serviceName);

		const hosts = records.map((record) => ({
			host: record.name,
			port: record.port,
		}));

		return hosts;
	} catch (err) {
		logger.info('Error during service discovery:');
		throw err;
	}
}

function createNewValkeyInstance() {
	const redisUri = SESSION_VALKEY_URI;
	if (!redisUri) {
		throw new Error('URI is required for creating a new Valkey instance');
	}

	const redisInstance = getValkeyInstance(redisUri);
	logger.info(`Using Valkey session store at '${redisUri}'.`);

	return redisInstance;
}

async function createValkeySentinelInstance() {
	const sentinelName = SESSION_VALKEY_SENTINEL_NAME;
	const sentinelPassword = SESSION_VALKEY_SENTINEL_PASSWORD;
	if (!sentinelName) {
		throw new Error(
			'SENTINEL_NAME is required for creating a Valkey Sentinel instance',
		);
	}

	if (!sentinelPassword) {
		throw new Error(
			'SENTINEL_PASSWORD is required for creating a Valkey Sentinel instance',
		);
	}

	const sentinels = await discoverSentinelHosts();
	logger.info(`Using discovered Valkey sentinels: ${JSON.stringify(sentinels)}`);

	const redisInstance = getValkeyInstance({
		sentinels,
		sentinelPassword,
		password: sentinelPassword,
		name: sentinelName,
	});

	return redisInstance;
}

function initSessionMiddleware(app, store) {
	const SIX_HOURS = 1000 * 60 * 60 * 6;
	app.use(
		session({
			cookie: {
				httpOnly: true,
				sameSite: Configuration.get('SESSION_COOKIE_SAME_SITE'),
				secure: 'auto',
				maxAge: SIX_HOURS,
			},
			rolling: true, // refresh session with every request within maxAge
			store,
			saveUninitialized: true,
			resave: false,
			secret: Configuration.get('COOKIE_SECRET'), // Secret used to sign the session ID cookie
		}),
	);
}

const initializeSessionStorage = async (app) => {
	let sessionStore = null;

	if (SESSION_VALKEY_CLUSTER_ENABLED) {
		const client = await createValkeySentinelInstance();
		sessionStore = new RedisStore({ client });
	} else if (SESSION_VALKEY_URI && !SESSION_VALKEY_CLUSTER_ENABLED) {
		const client = createNewValkeyInstance();
		sessionStore = new RedisStore({ client });
	} else {
		sessionStore = new session.MemoryStore();
		logger.info('Using in-memory session store.');
	}

	initSessionMiddleware(app, sessionStore);
};

module.exports = {
	initializeSessionStorage,
};
