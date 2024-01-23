const isUserHidden = (user, school) => {
	const isOutdated = !!user.outdatedSince;
	const showOutdatedUsers = school.features.includes('showOutdatedUsers');

	return !showOutdatedUsers && isOutdated;
};

module.exports = {
	isUserHidden,
};
