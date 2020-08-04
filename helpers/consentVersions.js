const api = require('../api');

// /**
//  * check api for new consent versions after registration or last consense date with publishedAt less than now
//  */
const userConsentVersions = async (user, consent, req, limit = 0) => {
	if (!consent || (!consent.userConsent && !consent.parentConsents.length)) {
		// consent not existing, this update routine not neccesary, we need a consent first.
		return { haveBeenUpdated: false };
	}
	// users should have either a userConsent or a parentConsent. We prefere using the userConsent.
	const selectedConsent = consent.userConsent || consent.parentConsents[0];
	const { dateOfPrivacyConsent } = (selectedConsent || {});
	const { dateOfTermsOfUseConsent } = (selectedConsent || {});
	const newPrivacyVersions = await api(req).get('/consentVersions', {
		qs: {
			publishedAt: {
				$gt: new Date(dateOfPrivacyConsent),
				$lt: new Date(),
			},
			schoolId: user.schoolId,
			consentTypes: 'privacy',
			$limit: limit,
			$sort: { publishedAt: -1 },
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
