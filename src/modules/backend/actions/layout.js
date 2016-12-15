import React from 'react';
import {browserHistory} from 'react-router';
import { Server } from '../../core/helpers';

export default {
	logout: () => {
		Server.logout();
		console.info('User successfully logged out.');
		browserHistory.push('/login/');
	}
};


