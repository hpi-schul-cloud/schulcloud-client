import React from 'react';
import {browserHistory} from 'react-router';
import { Server } from '../../core/helpers';

const toolsConnectService = Server.service('/ltiTools/connect');

export default {
	connect: (toolId) => {
		toolsConnectService.create({ toolId })
			.then(result => {
				if (result.type === 'url') {
					window.open(result.data);
				} else {
					let win = window.open("");
					win.document.write(result.data);
				}
			});
	}
};


