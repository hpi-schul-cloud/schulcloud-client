/* eslint-disable max-len */
const { Configuration } = require('@hpi-schul-cloud/commons');

if (Configuration.has('CORS') !== true) {
	throw new Error('CORS missing in Configuration');
}

/*
	The matrix based messenger loads its assets (scripts, styles, fonts, images) from a specified domain.
	After initialization the chat protocol communicates with its home server.
	The discover domain is used in the client initialization.
 */
let matrixMessengerEmbed = '';
let matrixMessengerHomeserver = '';
let matrixMessengerDiscoverUri = '';
if (Configuration.get('FEATURE_MATRIX_MESSENGER_ENABLED')) {
	matrixMessengerEmbed = Configuration.get('MATRIX_MESSENGER__EMBED_URI');
	matrixMessengerHomeserver = Configuration.get('MATRIX_MESSENGER__URI');
	matrixMessengerDiscoverUri = Configuration.get('MATRIX_MESSENGER__DISCOVER_URI');
}

const storageProvider = Configuration.get('DOCUMENT_BASE_DIR');
const instance = Configuration.get('INSTANCE_NAME');

const config = {
	enabled: Configuration.get('CORS'),
	// Settings for HTTP Content-Security-Policy Header
	/*
	Use:
		defaultSrc, fontSrc, styleSrc, scriptSrc, imageSrc,
		connectSrc, mediaSrc, objectSrc, prefetchSrc, childSrc,
		frameSrc, workerSrc, frameancestorsSrc, formactionSrc, baseuriSrc
		manifestSrc, sandboxSrc, upgradeInsecureRequestsSrc and blockAllMixedContentSrc

		For more Information: https://report-uri.com/home/generate
	*/
	contentSecurityPolicy: {
		// Default Content-Security-Policy Header for every site
		// Use 'strict-dynamic' 'nonce-<nonceValue>' (nonceValue auto generated) to create a whitelist
		corsDefault: {
			defaultSrc: `'self' data: blob: wss://${instance} wss://scchat.${instance} https://api.${instance} https://scchat.${instance} https://s3.hidrive.strato.com https://libreoffice.${instance} https://docs.${instance} https://edtrio.${instance} https://etherpad.${instance} https://blog.hpi-schul-cloud.de https://sc-content-resources.${instance} https://sentry.schul-cloud.dev https://open.hpi.de https://upload.wikimedia.org https://user-images.githubusercontent.com https://dev-storage.${instance}:9001 https://hydra.test.${instance} ${matrixMessengerEmbed} ${matrixMessengerHomeserver} ${matrixMessengerDiscoverUri}`,
			fontSrc: `'self' data: ${matrixMessengerEmbed}`,
			styleSrc: `'self' 'unsafe-inline' ${matrixMessengerEmbed}`,
			// scriptSrc: "'strict-dynamic' 'unsafe-eval' 'nonce-<nonceValue>'",
			scriptSrc: `'self' 'unsafe-eval' 'unsafe-inline' ${matrixMessengerEmbed}`,
			// Please activate for production
			// upgradeInsecureRequestsSrc: 'upgrade-insecure-requests',
			// blockAllMixedContentSrc: 'block-all-mixed-content',
		},
		/*
			Content-Security-Policy Header (added to default header) depending on the site
			site is matched with called website URL and regex key within corsSiteSpecific
			use * as value for
			defaultSrc, fontSrc, styleSrc, scriptSrc, imageSrc,
			connectSrc, mediaSrc, objectSrc, prefetchSrc, childSrc,
			frameSrc, workerSrc, frameancestorsSrc, formactionSrc, baseuriSrc
			and manifestSrc to ignore corsDefault and allow any external content
		*/
		corsSiteSpecific: {
			'^/$': {
				defaultSrc: `https://www10-fms.hpi.uni-potsdam.de https://play.google.com ${storageProvider}`,
			},
			'^/dashboard': {
				defaultSrc: `https://www10-fms.hpi.uni-potsdam.de ${storageProvider}`,
			},
			'^/courses': {
				defaultSrc: 'https://nexboard.nexenio.com https://www.geogebra.org https://lti.tools https://codeocean.openhpi.de https://acc.bettermarks.com https://moodle.${instance}',
				fontSrc: 'https://vjs.zencdn.net https://fonts.googleapis.com https://cdn.jsdelivr.net',
				styleSrc: 'https://vjs.zencdn.net',
			},
			'^/teams': {
				fontSrc: 'https://vjs.zencdn.net',
				styleSrc: 'https://vjs.zencdn.net',
			},
			'^/homework': {
				fontSrc: 'https://fonts.gstatic.com',
			},
			'^/files': {
				fontSrc: 'https://vjs.zencdn.net',
				styleSrc: 'https://vjs.zencdn.net',
			},
			/* '^/news': {
			},
			'^/calendar': {
			}, */
			'^/content': {
				defaultSrc: 'https://pichasso.xopic.de',
				fontSrc: 'https://fonts.gstatic.com',
			},
			/* '^/(content|(courses/[a-f0-9]{24}/topics/[a-f0-9]{24}))': {
			}, */
			'^/administration': {
				fontSrc: 'https://fonts.gstatic.com',
			},
			/* '^/account': {
			},
			'^/logout': {
			},
			'^/impressum': {
			},
			'^/datenschutz': {
			}, */
			'^/about': {
				defaultSrc: `https://www10-fms.hpi.uni-potsdam.de ${storageProvider}`,
			},
			'^/community': {
				defaultSrc: 'https://play.google.com',
			},
			/* '^/partner': {
			},
			'^/help': {
			}, */
		},
	},
	/*
		Access-Control-Allow-Origin header depending on the site
		site is matched with called website URL and regex key within accessControlAllowOrigin
		several allowed origins per route can be added by seperation with |
		if several regex match the URL routes will be joined
		if no regex is given for URLs the Access-Control-Allow-Origin will not be set
	*/
	accessControlAllowOrigin: {
		'^/rocketChat/authGet': `https://scchat.${instance}`,
	},
	// Additional default Security header can be set - key reprensents the HTTP header and the value the value of the header
	additionalSecurityHeader: {
		// "X-Frame-Options": "sameorigin", disabled: Some browser override with this options the CSP rules
		'X-Download-Options': 'noopen',
		'X-Content-Type-Options': 'nosniff',
		'X-XSS-Protection': '1; mode=block',
		'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
		'Access-Control-Allow-Credentials': 'true',
		'Referrer-Policy': 'same-origin',
		'Feature-Policy': "vibrate 'self'; speaker *; fullscreen *; sync-xhr *; notifications 'self'; push 'self'; geolocation 'self'; midi 'self'; microphone 'self'; camera 'self'; magnetometer 'self'; gyroscope 'self'; payment 'none';",
	},
};

module.exports = config;
