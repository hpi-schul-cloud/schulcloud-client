import React from 'react';
import {browserHistory} from 'react-router';
import { Server, Notification } from '../../core/helpers';

const accountService = Server.service('/accounts');
const userService = Server.service('/users');

const afterSignupUserRegular = (user, data) => {
	data.userId = user._id;
	data.username = user.email;

	return accountService.create(data).then(() => {
		return Server.authenticateUser({
			strategy: 'local',
			username: data.username,
			password: data.password,
			storage: window.localStorage
		});
	});
};

const afterSignupUserSSO = (user, {accountId}) => {
	return accountService.patch(accountId, {
		userId: user._id
	}).then(() => {
		return Server.authenticateUser();
	});
};

export default {
	signupAccount(data) {
		return accountService.create(data);
	},

	signupUser(data, accountId) {
		return userService.create(data).then((user) => {
			if(accountId) {
				return afterSignupUserSSO(user, {accountId});
			} else {
				return afterSignupUserRegular(user, data);
			}
		});
	},

	finishSetup(userId) {
		return userService.patch(userId, {
			system: {
				finishedSignup: true
			}
		});
	}
};


