const userHasPermission = (user, permissions, operator) => {
	if (!Array.isArray(permissions)) {
		permissions = [permissions];
	}

	if (!user) return false;

	const userPermissions = user.permissions || [];

	if (operator === 'or') {
		return permissions.some((permission) => {
			return userPermissions.includes(permission);
		});
	}
	return permissions.every((permission) => userPermissions.includes(permission));
};

module.exports = {
	userHasPermission,
	permissionsChecker: (permission, operator) => (req, res, next) => {
		if (userHasPermission(res.locals.currentUser, permission, operator)) {
			return next();
		}

		const error = new Error('Not authorized');
		error.status = 401;
		return next(error);
	},
};
