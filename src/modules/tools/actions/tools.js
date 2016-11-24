import React from 'react';
import {browserHistory} from 'react-router';
import { Server } from '../../core/helpers';

const toolsConnectService = Server.service('/ltiTools/connect');

export default {
	connect: (toolId) => {
		toolsConnectService.create({ toolId })
			.then(result => {
				//window.location.href = result;
				console.log(result);
				//TODO: Redirect
			});
	}
};


