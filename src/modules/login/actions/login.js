import React from 'react';
import {browserHistory} from 'react-router';
import { Server } from '../../core/helpers';

const authService = Server.service('/auth');

export default {
	login: ({email, password, school, system}) => {

		authService.create({username: email, password: password, systemId: system})
			.then(user => {
				browserHistory.push('/dashboard/');
			})
			.catch(error => {
				console.error(error);
				return false;	// TODO: return or display error
			});
	}
};
