import React from 'react';
import {browserHistory} from 'react-router';
import { Server } from '../../core/helpers';
import cookieHelper from 'react-cookie';
import cookies from '../../core/helpers/cookies';

const authService = Server.service('/auth');

export default {
	login: ({email, password, school, system}) => {
		cookieHelper.remove(cookies.loggedIn);
		authService.create({username: email, password: password, systemId: system})
			.then(user => {
				if (user.token) {
					cookieHelper.save(cookies.loggedIn, user.token, { path: '/'});
					browserHistory.push('/dashboard/');
				}
			})
			.catch(error => {
				console.error(error);
				return false;	// TODO: return or display error
			});
	}
};
