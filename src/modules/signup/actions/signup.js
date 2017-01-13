import React from 'react';
import {browserHistory} from 'react-router';
import { Server, Notification } from '../../core/helpers';

const accountService = Server.service('/accounts');
const userService = Server.service('/users');

export default {
	signupAccount(data) {
		return accountService.create(data);
	},

	signupUser(data, accountId) {
		return userService.create(data).then((user) => {
			if(accountId) {
				// use sso account
				return accountService.patch(accountId, {
					userId: user._id
				});
			} else {
				// create schulcloud account
				data.userId = user._id;
				return accountService.create(data);
			}
		}).then(() => {
			return Server.authenticateUser();
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


