import React from 'react';
import {browserHistory} from 'react-router';
import { Server, Notification } from '../../core/helpers';

const accountService = Server.service('/accounts');
const userService = Server.service('/users');

const afterSignupUserRegular = (user, data) => {
	data.userId = user._id;
	data.username = user.email;

	return accountService.create(data).then((account) => {
		return Server.authenticateUser({
			strategy: 'local',
			username: data.username,
			password: data.password,
			storage: window.localStorage
		}).then(_ => {
			return Promise.resolve(account);
		});
	});
};

const afterSignupUserSSO = (user, {accountId}) => {
	return accountService.patch(accountId, {
		userId: user._id
	}).then(account => {
		return Server.authenticateUser().then(_ => {
			return Promise.resolve(account);
		});
	});
};

export default {
	signupAccount(data) {
		return accountService.create(data);
	},

	signupUser(data) {
		let userPromise;

		if(data.userId) {
			userPromise = userService.update(data.userId, data);
		} else {
			userPromise = userService.create(data);
		}

		return userPromise.then((user) => {
			if(data.accountId) {
				return afterSignupUserSSO(user, {accountId: data.accountId});
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


