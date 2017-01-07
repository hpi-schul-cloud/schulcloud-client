import React from 'react';
import {browserHistory} from 'react-router';
import { Server, Notification } from '../../core/helpers';

const userService = Server.service('/users');

export default {
	finishSignup(userId) {
		return userService.patch(userId, {
			system: {
				finishedSignup: true
			}
		});
	}
};


