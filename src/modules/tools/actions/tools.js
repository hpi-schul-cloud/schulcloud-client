import React from 'react';
import {browserHistory} from 'react-router';
import { Server } from '../../core/helpers';

const toolsConnectService = Server.service('/ltiTools/connect');
const toolService = Server.service('/ltiTools');

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
	},
	createNew: (tool) => {
		toolService.create(tool)
			.then(result => {
				window.location.href = '/tools/'
			})
			.catch(err => {
				console.log(err);
			});
	}
};


