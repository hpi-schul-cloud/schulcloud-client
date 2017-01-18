import React from 'react';
import {browserHistory} from 'react-router';
import { Server } from '../../core/helpers';

export default {
	logout: () => {
		Server.logout().then(() => {
			console.info('User successfully logged out.');
			Server.set('user', null);
			browserHistory.push('/login/');
		});
	}
};


