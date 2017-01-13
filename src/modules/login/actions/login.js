import React from 'react';
import {browserHistory} from 'react-router';
import { Server, Notification } from '../../core/helpers';

import signupActions from '../../signup/actions/signup';

const accountService = Server.service('/accounts');

const authenticate = ({username, password}) => {
	return Server.authenticateUser({
		strategy: 'local',
		username,
		password,
		storage: window.localStorage
	});
}

export default {
	login: ({username, schoolId, systemId, password, email}) => {
		if(!username) username = email;

		// check if account already exists
		return accountService.find({query: {username, schoolId, systemId}}).then((result) => {
			// account exists => login with _id from account
			if(result.data.length) {
				// we can't just use account to login as it has hashed password
				return authenticate({username, password});
			} else {
				// account exists not => signup Account
				return signupActions.signupAccount({username, schoolId, systemId, password})
					.then((account) => {
						return authenticate({username: account.username, password});
					}).catch(() => {
						// account credentials not valid
						return new Error('Could not create new account for this credentials.');
					});
			}
		});
	}
};


