/* eslint-disable max-len */

const config = {
	content_security_policy: {
		cors_default: {
			defaultSrc: "default-src 'self' 'unsafe-inline' blob: data:",
			scriptSrc: "data: blob: 'self' 'unsafe-inline'",
			objectSrc: '',
		},
		cors_site_specific: {
			'^/$': {
				defaultSrc: 'https://www10-fms.hpi.uni-potsdam.de https://blog.schul-cloud.org https://play.google.com https://s3.hidrive.strato.com https://schul-cloud-hpi.s3.hidrive.strato.com',
				scriptSrc: "'unsafe-eval'",
			},
			'^/about': {
				defaultSrc: 'https://www10-fms.hpi.uni-potsdam.de https://schul-cloud-hpi.s3.hidrive.strato.com https://play.google.com',
				scriptSrc: "'unsafe-eval'",
			},
			'^/calendar': {
				scriptSrc: "'unsafe-eval'",
			},
			'^/content': {
				defaultSrc: '*',
				scriptSrc: '*',
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
			'^/rocketChat': {
				defaultSrc: 'https://scchat.schul-cloud.org',
			},
		},
	},
	access_control_allow_origin: {
		'^/rocketChat/authGet': 'https://scchat.schul-cloud.org',
	},
	additional_security_header: {
		'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
		'X-Frame-Options': 'sameorigin',
		'X-Content-Type-Options': 'nosniff',
		'X-XSS-Protection': '1; mode=block',
		'Referrer-Policy': 'same-origin',
		'Feature-Policy': "vibrate 'self'; speaker *; fullscreen *; sync-xhr *; notifications 'self'; push 'self'; geolocation 'self'; midi 'self'; microphone 'self'; camera 'self'; magnetometer 'self'; gyroscope 'self'; payment 'none';",
	},
};


module.exports = config;
