import React from 'react';
import {browserHistory} from 'react-router';
import { Server, Notification } from '../../core/helpers';

const authService = Server.service('/auth');

export default {
	login: ({email, password, school, system}) => {

		// generate JWT
		authService.create({username: email, password: password, systemId: system})
			.then(user => {
				if (user.token) {
					// Login with JWT
					Server.authenticate({
						type: 'token',
						'token': user.token,
						path: '/auth'
					}).then(function(result) {
						console.info('Authenticated!', Server.get('token'));
						browserHistory.push('/dashboard/');
					}).catch(function(error) {
						console.error('Error authenticating!', error);
						Notification.showError('Error authenticating!');
					});
				}
			})
			.catch(error => {
				Notification.showError(error.message);
				return false;
			});
	}
};


