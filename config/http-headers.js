/* eslint-disable max-len */
const { Configuration } = require('@hpi-schul-cloud/commons');

if (Configuration.has('CORS') !== true) {
	throw new Error('CORS missing in Configuration');
}

const config = {
	enabled: Configuration.get('CORS'),
	// Settings for HTTP Content-Security-Policy Header
	/*
	Use:
		defaultSrc, fontSrc, styleSrc, scriptSrc, imageSrc,
		connectSrc, mediaSrc, objectSrc, prefetchSrc, childSrc,
		frameSrc, workerSrc, frameAncestors, formactionSrc, baseuriSrc
		manifestSrc, sandboxSrc, upgradeInsecureRequestsSrc and blockAllMixedContentSrc

		For more Information: https://report-uri.com/home/generate
	*/
	contentSecurityPolicy: {
		// Default Content-Security-Policy Header for every site
		// Use 'strict-dynamic' 'nonce-<nonceValue>' (nonceValue auto generated) to create a whitelist
		corsDefault: {
			defaultSrc: '\'self\' data: blob: wss://dbildungscloud.de wss://scchat.dbildungscloud.de https://api.dbildungscloud.de https://scchat.dbildungscloud.de https://s3.hidrive.strato.com https://libreoffice.dbildungscloud.de https://docs.dbildungscloud.de https://etherpad.dbildungscloud.de https://blog.niedersachsen.cloud https://blog.dbildungscloud.de https://sc-content-resources.hpi-schul-cloud.de https://open.hpi.de https://upload.wikimedia.org',
			fontSrc: '\'self\' data:',
			styleSrc: '\'self\' \'unsafe-inline\'',
			scriptSrc: '\'self\' \'unsafe-eval\'',
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
			frameSrc, workerSrc, frameAncestors, formactionSrc, baseuriSrc
			and manifestSrc to ignore corsDefault and allow any external content
		*/
		corsSiteSpecific: {
			'^/$': {
				defaultSrc: 'https://www10-fms.hpi.uni-potsdam.de https://cloud-instances.s3.hidrive.strato.com',
			},
			'^/dashboard': {
				defaultSrc: 'https://www10-fms.hpi.uni-potsdam.de https://cloud-instances.s3.hidrive.strato.com',
			},
			'^/courses': {
				defaultSrc: 'https://nexboard.nexenio.com https://www.geogebra.org https://lti.tools https://acc.bettermarks.com https://repo.test.mediathek.dev.dbildungsplattform.de',
				fontSrc: 'https://vjs.zencdn.net https://cdn.jsdelivr.net',
				styleSrc: 'https://vjs.zencdn.net',
			},
			'^/teams': {
				fontSrc: 'https://vjs.zencdn.net',
				styleSrc: 'https://vjs.zencdn.net',
			},
			'^/files': {
				fontSrc: 'https://vjs.zencdn.net',
				styleSrc: 'https://vjs.zencdn.net',
			},
			'^/about': {
				defaultSrc: 'https://www10-fms.hpi.uni-potsdam.de https://cloud-instances.s3.hidrive.strato.com',
			},
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
		'^/rocketChat/authGet': 'https://scchat.dbildungscloud.de',
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
