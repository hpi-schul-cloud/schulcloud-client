const api = require('../api');

// /**
//  * check api for new consent versions after registration or last consense date with publishedAt less than now
//  */
const userConsentVersions = async (user, consent, req, limit = 0) => {
	const dateOfPrivacyConsent = (consent.userConsent || {}).dateOfPrivacyConsent || user.createdAt;
	const dateOfTermsOfUseConsent = (consent.userConsent || {}).dateOfTermsOfUseConsent || user.createdAt;
	const newPrivacyVersions = await api(req).get('/consentVersions', {
		qs: {
			publishedAt: {
				$gt: new Date(dateOfPrivacyConsent),
				$lt: new Date(),
			},
			consentTypes: 'privacy',
			$limit: limit,
		},
	});
	const newTermsOfUseVersions = await api(req).get('/consentVersions', {
		qs: {
			publishedAt: {
				$gt: new Date(dateOfTermsOfUseConsent),
				$lt: new Date(),
			},
			consentTypes: 'termsOfUse',
			$limit: limit,
		},
	});
	const allNewVersionsMap = new Map();
	newTermsOfUseVersions.data.concat(newPrivacyVersions.data).forEach((version) => {
		if (!allNewVersionsMap.has(version._id)) {
			allNewVersionsMap.set(version._id, version);
		}
	});
	const allNewVersions = Array.from(allNewVersionsMap.values());
	const haveBeenUpdated = newTermsOfUseVersions.total + newPrivacyVersions.total !== 0;
	return {
		privacy: newPrivacyVersions,
		termsOfUse: newTermsOfUseVersions,
		all: {
			data: allNewVersions,
		},
		haveBeenUpdated,
	};
};

module.exports = userConsentVersions;
