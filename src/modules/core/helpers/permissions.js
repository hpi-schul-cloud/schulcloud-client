import {browserHistory} from 'react-router';

class Permissions {
	constructor() {}

	userHasPermission(user, permissions) {
		if(!Array.isArray(permissions)) {
			permissions = [permissions];
		}

		if (!user) {
			browserHistory.push('/login/');
			return;
		}

		const userPermissions = user.permissions || [];

		return permissions.every((permission) => {
			return userPermissions.includes(permission);
		});
	}
}

export default new Permissions();
