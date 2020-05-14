const { Configuration } = require('@schul-cloud/commons');
const { contentSecurityPolicy, accessControlAllowOrigin, enabled } = require('../config/http-headers');
const logger = require('../helpers/logger');

if (Configuration.has('CORS') !== true) {
	throw new Error('CORS missing in Configuration');
}

if (!Configuration.get('CORS')) 	{
	logger.info('CORS env has not been defined, to enable route specific CORS'
	+ ' header set value to 1 and update values in config.cors');
}

const cspHeadersForRoute = (path, regexs, corsDefault, nonceValue) => {
	let {
		defaultSrc = '',
		scriptSrc = '',
		styleSrc = '',
		imageSrc = '',
		fontSrc = '',
		connectSrc = '',
		mediaSrc = '',
		objectSrc = '',
		prefetchSrc = '',
		childSrc = '',
		frameSrc = '',
		workerSrc = '',
		frameancestorsSrc = '',
		formactionSrc = '',
		upgradeInsecureRequestsSrc = '',
		blockAllMixedContentSrc = '',
		sandboxSrc = '',
		baseuriSrc = '',
		manifestSrc = '',
	} = corsDefault;

	if (defaultSrc.includes('nonce-<nonceValue>')) {
		defaultSrc = defaultSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (scriptSrc.includes('nonce-<nonceValue>')) {
		scriptSrc = scriptSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (styleSrc.includes('nonce-<nonceValue>')) {
		styleSrc = styleSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (imageSrc.includes('nonce-<nonceValue>')) {
		imageSrc = imageSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (fontSrc.includes('nonce-<nonceValue>')) {
		fontSrc = fontSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (connectSrc.includes('nonce-<nonceValue>')) {
		connectSrc = connectSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (mediaSrc.includes('nonce-<nonceValue>')) {
		mediaSrc = mediaSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (objectSrc.includes('nonce-<nonceValue>')) {
		objectSrc = objectSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (prefetchSrc.includes('nonce-<nonceValue>')) {
		prefetchSrc = prefetchSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (childSrc.includes('nonce-<nonceValue>')) {
		childSrc = childSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (frameSrc.includes('nonce-<nonceValue>')) {
		frameSrc = frameSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (workerSrc.includes('nonce-<nonceValue>')) {
		workerSrc = workerSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (frameancestorsSrc.includes('nonce-<nonceValue>')) {
		frameancestorsSrc = frameancestorsSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (formactionSrc.includes('nonce-<nonceValue>')) {
		formactionSrc = formactionSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (baseuriSrc.includes('nonce-<nonceValue>')) {
		baseuriSrc = baseuriSrc.replace(/<nonceValue>/g, nonceValue);
	}
	if (manifestSrc.includes('nonce-<nonceValue>')) {
		manifestSrc = manifestSrc.replace(/<nonceValue>/g, nonceValue);
	}

	const matchingKeys = Object.keys(regexs)
		.filter((key) => path.match(key));
	const corsHeaders = matchingKeys.map((key) => regexs[key]);
	corsHeaders.forEach((matchingHeader) => {
		if (matchingHeader.defaultSrc && matchingHeader.defaultSrc.includes('*')) {
			defaultSrc = '*';
			if (matchingHeader.defaultSrc.includes('unsafe-inline')) {
				defaultSrc += " 'unsafe-inline'";
			}
			if (matchingHeader.defaultSrc.includes('unsafe-eval')) {
				defaultSrc += " 'unsafe-eval'";
			}
			if (matchingHeader.defaultSrc.includes('nonce-<nonceValue>')) {
				defaultSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.defaultSrc) {
			defaultSrc = `${defaultSrc} ${matchingHeader.defaultSrc}`;
			if (matchingHeader.defaultSrc.includes('nonce-<nonceValue>')) {
				defaultSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.scriptSrc && matchingHeader.scriptSrc.includes('*')) {
			scriptSrc = '*';
			if (matchingHeader.scriptSrc.includes('unsafe-inline')) {
				scriptSrc += " 'unsafe-inline'";
			}
			if (matchingHeader.scriptSrc.includes('unsafe-eval')) {
				scriptSrc += " 'unsafe-eval'";
			}
			if (matchingHeader.scriptSrc.includes('nonce-<nonceValue>')) {
				scriptSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.scriptSrc) {
			scriptSrc = `${scriptSrc} ${matchingHeader.scriptSrc}`;
			if (matchingHeader.scriptSrc.includes('nonce-<nonceValue>')) {
				scriptSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.styleSrc && matchingHeader.styleSrc.includes('*')) {
			styleSrc = '*';
			if (matchingHeader.styleSrc.includes('unsafe-inline')) {
				styleSrc += " 'unsafe-inline'";
			}
			if (matchingHeader.styleSrc.includes('unsafe-eval')) {
				styleSrc += " 'unsafe-eval'";
			}
			if (matchingHeader.styleSrc.includes('nonce-<nonceValue>')) {
				styleSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.styleSrc) {
			styleSrc = `${styleSrc} ${matchingHeader.styleSrc}`;
			if (matchingHeader.styleSrc.includes('nonce-<nonceValue>')) {
				styleSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.imageSrc && matchingHeader.imageSrc.includes('*')) {
			imageSrc = '*';
			if (matchingHeader.imageSrc.includes('nonce-<nonceValue>')) {
				imageSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.imageSrc) {
			imageSrc = `${imageSrc} ${matchingHeader.imageSrc}`;
			if (matchingHeader.imageSrc.includes('nonce-<nonceValue>')) {
				imageSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.fontSrc && matchingHeader.fontSrc.includes('*')) {
			fontSrc = '*';
			if (matchingHeader.fontSrc.includes('nonce-<nonceValue>')) {
				fontSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.fontSrc) {
			fontSrc = `${fontSrc} ${matchingHeader.fontSrc}`;
			if (matchingHeader.fontSrc.includes('nonce-<nonceValue>')) {
				fontSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.connectSrc && matchingHeader.connectSrc.includes('*')) {
			connectSrc = '*';
			if (matchingHeader.connectSrc.includes('nonce-<nonceValue>')) {
				connectSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.connectSrc) {
			connectSrc = `${connectSrc} ${matchingHeader.connectSrc}`;
			if (matchingHeader.connectSrc.includes('nonce-<nonceValue>')) {
				connectSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.mediaSrc && matchingHeader.mediaSrc.includes('*')) {
			mediaSrc = '*';
			if (matchingHeader.mediaSrc.includes('nonce-<nonceValue>')) {
				mediaSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.mediaSrc) {
			mediaSrc = `${mediaSrc} ${matchingHeader.mediaSrc}`;
			if (matchingHeader.mediaSrc.includes('nonce-<nonceValue>')) {
				mediaSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.objectSrc && matchingHeader.objectSrc.includes('*')) {
			objectSrc = '*';
			if (matchingHeader.objectSrc.includes('nonce-<nonceValue>')) {
				objectSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.objectSrc) {
			objectSrc = `${objectSrc} ${matchingHeader.objectSrc}`;
			if (matchingHeader.objectSrc.includes('nonce-<nonceValue>')) {
				objectSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.prefetchSrc && matchingHeader.prefetchSrc.includes('*')) {
			prefetchSrc = '*';
			if (matchingHeader.prefetchSrc.includes('nonce-<nonceValue>')) {
				prefetchSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.prefetchSrc) {
			prefetchSrc = `${prefetchSrc} ${matchingHeader.prefetchSrc}`;
			if (matchingHeader.prefetchSrc.includes('nonce-<nonceValue>')) {
				prefetchSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.childSrc && matchingHeader.childSrc.includes('*')) {
			childSrc = '*';
			if (matchingHeader.childSrc.includes('nonce-<nonceValue>')) {
				childSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.childSrc) {
			childSrc = `${childSrc} ${matchingHeader.childSrc}`;
			if (matchingHeader.childSrc.includes('nonce-<nonceValue>')) {
				childSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.frameSrc && matchingHeader.frameSrc.includes('*')) {
			frameSrc = '*';
			if (matchingHeader.frameSrc.includes('nonce-<nonceValue>')) {
				frameSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.frameSrc) {
			frameSrc = `${frameSrc} ${matchingHeader.frameSrc}`;
			if (matchingHeader.frameSrc.includes('nonce-<nonceValue>')) {
				frameSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.workerSrc && matchingHeader.workerSrc.includes('*')) {
			workerSrc = '*';
			if (matchingHeader.workerSrc.includes('nonce-<nonceValue>')) {
				workerSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.workerSrc) {
			workerSrc = `${workerSrc} ${matchingHeader.workerSrc}`;
			if (matchingHeader.workerSrc.includes('nonce-<nonceValue>')) {
				workerSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.frameancestorsSrc && matchingHeader.frameancestorsSrc.includes('*')) {
			frameancestorsSrc = '*';
			if (matchingHeader.frameancestorsSrc.includes('nonce-<nonceValue>')) {
				frameancestorsSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.frameancestorsSrc) {
			frameancestorsSrc = `${frameancestorsSrc} ${matchingHeader.frameancestorsSrc}`;
			if (matchingHeader.frameancestorsSrc.includes('nonce-<nonceValue>')) {
				frameancestorsSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.formactionSrc && matchingHeader.formactionSrc.includes('*')) {
			formactionSrc = '*';
			if (matchingHeader.formactionSrc.includes('nonce-<nonceValue>')) {
				formactionSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.formactionSrc) {
			formactionSrc = `${formactionSrc} ${matchingHeader.formactionSrc}`;
			if (matchingHeader.formactionSrc.includes('nonce-<nonceValue>')) {
				formactionSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.upgradeInsecureRequestsSrc) {
			upgradeInsecureRequestsSrc = `${matchingHeader.upgradeInsecureRequestsSrc}`;
		}
		if (matchingHeader.blockAllMixedContentSrc) {
			blockAllMixedContentSrc = `${matchingHeader.blockAllMixedContentSrc}`;
		}
		if (matchingHeader.sandboxSrc) {
			sandboxSrc = `${sandboxSrc} ${matchingHeader.sandboxSrc}`;
		}
		if (matchingHeader.baseuriSrc && matchingHeader.baseuriSrc.includes('*')) {
			baseuriSrc = '*';
			if (matchingHeader.baseuriSrc.includes('nonce-<nonceValue>')) {
				baseuriSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.baseuriSrc) {
			baseuriSrc = `${baseuriSrc} ${matchingHeader.baseuriSrc}`;
			if (matchingHeader.baseuriSrc.includes('nonce-<nonceValue>')) {
				baseuriSrc += ` 'nonce-${nonceValue}'`;
			}
		}
		if (matchingHeader.manifestSrc && matchingHeader.manifestSrc.includes('*')) {
			manifestSrc = '*';
			if (matchingHeader.manifestSrc.includes('nonce-<nonceValue>')) {
				manifestSrc += ` 'nonce-${nonceValue}'`;
			}
		} else if (matchingHeader.manifestSrc) {
			manifestSrc = `${manifestSrc} ${matchingHeader.manifestSrc}`;
			if (matchingHeader.manifestSrc.includes('nonce-<nonceValue>')) {
				manifestSrc += ` 'nonce-${nonceValue}'`;
			}
		}
	});
	const finalCors = {
		defaultSrc,
		scriptSrc,
		styleSrc,
		imageSrc,
		fontSrc,
		connectSrc,
		mediaSrc,
		objectSrc,
		prefetchSrc,
		childSrc,
		frameSrc,
		workerSrc,
		frameancestorsSrc,
		formactionSrc,
		upgradeInsecureRequestsSrc,
		blockAllMixedContentSrc,
		sandboxSrc,
		baseuriSrc,
		manifestSrc,
	};
	logger.debug(`cors headers for route ${path}`, finalCors);
	return finalCors;
};

const accessControlHeadersForRoute = (path, regexs) => {
	const matchingKeys = Object.keys(regexs)
		.filter((key) => path.match(key));
	const corsHeaders = matchingKeys.map((key) => regexs[key]);
	logger.debug(`cors headers for route ${path}`, corsHeaders);
	return corsHeaders;
};

const cors = (req, res, next) => {
	if (enabled) {
		try {
			// Content-Security-Policy
			const { corsDefault, corsSiteSpecific } = contentSecurityPolicy;
			const corsAllowContentOrigins = cspHeadersForRoute(
				req.path, corsSiteSpecific,
				corsDefault,
				res.locals.nonceValue,
			);
			if (corsAllowContentOrigins) {
				let cspString = '';
				if (corsAllowContentOrigins.defaultSrc) {
					cspString += `default-src ${corsAllowContentOrigins.defaultSrc}; `;
				}
				if (corsAllowContentOrigins.scriptSrc) {
					cspString += `script-src ${corsAllowContentOrigins.scriptSrc}; `;
				}
				if (corsAllowContentOrigins.styleSrc) {
					cspString += `style-src ${corsAllowContentOrigins.styleSrc}; `;
				}
				if (corsAllowContentOrigins.imageSrc) {
					cspString += `img-src ${corsAllowContentOrigins.imageSrc}; `;
				}
				if (corsAllowContentOrigins.fontSrc) {
					cspString += `font-src ${corsAllowContentOrigins.fontSrc}; `;
				}
				if (corsAllowContentOrigins.connectSrc) {
					cspString += `connect-src ${corsAllowContentOrigins.connectSrc}; `;
				}
				if (corsAllowContentOrigins.mediaSrc) {
					cspString += `media-src ${corsAllowContentOrigins.mediaSrc}; `;
				}
				if (corsAllowContentOrigins.objectSrc) {
					cspString += `object-src ${corsAllowContentOrigins.objectSrc}; `;
				}
				if (corsAllowContentOrigins.prefetchSrc) {
					cspString += `prefetch-src ${corsAllowContentOrigins.prefetchSrc}; `;
				}
				if (corsAllowContentOrigins.childSrc) {
					cspString += `child-src ${corsAllowContentOrigins.childSrc}; `;
				}
				if (corsAllowContentOrigins.frameSrc) {
					cspString += `frame-src ${corsAllowContentOrigins.frameSrc}; `;
				}
				if (corsAllowContentOrigins.workerSrc) {
					cspString += `worker-src ${corsAllowContentOrigins.workerSrc}; `;
				}
				if (corsAllowContentOrigins.frameancestorsSrc) {
					cspString += `frame-ancestors ${corsAllowContentOrigins.frameancestorsSrc}; `;
				}
				if (corsAllowContentOrigins.formactionSrc) {
					cspString += `form-action ${corsAllowContentOrigins.formactionSrc}; `;
				}
				if (corsAllowContentOrigins.upgradeInsecureRequestsSrc) {
					cspString += `${corsAllowContentOrigins.upgradeInsecureRequestsSrc}; `;
				}
				if (corsAllowContentOrigins.blockAllMixedContentSrc) {
					cspString += `${corsAllowContentOrigins.blockAllMixedContentSrc}; `;
				}
				if (corsAllowContentOrigins.sandboxSrc) {
					cspString += `sandbox ${corsAllowContentOrigins.sandboxSrc}; `;
				}
				if (corsAllowContentOrigins.baseuriSrc) {
					cspString += `base-uri ${corsAllowContentOrigins.baseuriSrc}; `;
				}
				if (corsAllowContentOrigins.manifestSrc) {
					cspString += `manifest-src ${corsAllowContentOrigins.manifestSrc}; `;
				}
				if (cspString) {
					// eslint-disable-next-line max-len
					res.setHeader('Content-Security-Policy', cspString);
				} else {
					logger.debug('Content-Security-Policy header string not found');
				}
			} else {
				logger.debug('Content-Security-Policy header not set, because config does not contain valid content');
			}

			// Access-Control-Allow-Origin
			const corsAllowOrigins = accessControlHeadersForRoute(req.path, accessControlAllowOrigin);
			if (corsAllowOrigins.length !== 0) {
				res.setHeader('Access-Control-Allow-Origin', corsAllowOrigins.join(' | '));
			} else {
				logger.debug('do not set cors header, because config does not contain valid content');
			}
		} catch (error) {
			logger.error('error while setting cors header', error);
		}
	}
	return next();
};

module.exports = cors;
