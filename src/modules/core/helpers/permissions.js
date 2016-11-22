class Permissions {
	constructor() {}

	userHasPermission(user, permissions) {
		if(!Array.isArray(permissions)) {
			permissions = [permissions];
		}

		const userPermissions = user.permissions || [];

		return new Promise((resolve, reject) => {
			const hasPermission = permissions.every((permission) => {
				return userPermissions.includes(permission);
			});

			if(hasPermission) {
				resolve(true);
			} else {
				reject(false);
			}
		});
	}
}

export default new Permissions();
