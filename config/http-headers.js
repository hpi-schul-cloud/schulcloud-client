/* eslint-disable max-len */

const config = {
	enabled: process.env.CORS === '1',

	// Settings for HTTP Content-Security-Policy Header
	contentSecurityPolicy: {
		// Default Content-Security-Policy Header for every site
		corsDefault: {
			defaultSrc: "data: blob: 'self' 'unsafe-inline' https://scchat.schul-cloud.org https://storage.schul-cloud.org https://libreoffice.schul-cloud.org https://docs.schul-cloud.org https://etherpad.schul-cloud.org https://blog.schul-cloud.org https://sc-content-resources.schul-cloud.org",
			scriptSrc: "data: blob: 'self' 'unsafe-inline'",
			objectSrc: '',
		},
		/*
			Content-Security-Policy Header (added to default header) depending on the site
			site is matched with called website URL and regex key within corsSiteSpecific
			use * as value for defaultSrc, scriptSrc, objectSrc to ignore corsDefault and allow any external content
		*/
		corsSiteSpecific: {
			'^/$': {
				defaultSrc: 'https://www10-fms.hpi.uni-potsdam.de https://blog.schul-cloud.org https://play.google.com https://s3.hidrive.strato.com https://schul-cloud-hpi.s3.hidrive.strato.com',
				scriptSrc: "'unsafe-eval'",
			},
			'^/about': {
				defaultSrc: 'https://www10-fms.hpi.uni-potsdam.de https://schul-cloud-hpi.s3.hidrive.strato.com https://play.google.com',
				scriptSrc: "'unsafe-eval'",
			},
			'^/help/faq/documents': {
				scriptSrc: "'unsafe-eval'",
			},
			'^/administration': {
				defaultSrc: 'https://fonts.gstatic.com',
				scriptSrc: "'unsafe-eval'",
			},
			'^/calendar': {
				scriptSrc: "'unsafe-eval'",
			},
			'^/content': {
				defaultSrc: "* 'unsafe-inline'",
				scriptSrc: "* 'unsafe-eval' 'unsafe-inline'",
				objectSrc: '*',
			},
			'^/community': {
				defaultSrc: 'https://play.google.com',
			},
			'^/files': {
				defaultSrc: 'https://vjs.zencdn.net',
			},
			'^/homework': {
				defaultSrc: 'https://fonts.gstatic.com',
				scriptSrc: "'unsafe-eval'",
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
		'^/rocketChat/authGet': 'https://scchat.schul-cloud.org',
	},
	// Additional default Security header can be set - key reprensents the HTTP header and the value the value of the header
	additionalSecurityHeader: {
		'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
		'X-Frame-Options': 'sameorigin',
		'X-Content-Type-Options': 'nosniff',
		'X-XSS-Protection': '1; mode=block',
		'Referrer-Policy': 'same-origin',
		'Feature-Policy': "vibrate 'self'; speaker *; fullscreen *; sync-xhr *; notifications 'self'; push 'self'; geolocation 'self'; midi 'self'; microphone 'self'; camera 'self'; magnetometer 'self'; gyroscope 'self'; payment 'none';",
	},
};


module.exports = config;
