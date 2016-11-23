import React from 'react';
import {browserHistory} from 'react-router';
import { Server } from '../../core/helpers';

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
					});
				}
			})
			.catch(error => {
				console.error(error);
				return false;	// TODO: return or display error
			});
	}
};


