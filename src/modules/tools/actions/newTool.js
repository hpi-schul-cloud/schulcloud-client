import React from 'react';
import {browserHistory} from 'react-router';
import { Server } from '../../core/helpers';

const toolsConnectService = Server.service('/ltiTools/connect');
const toolService = Server.service('/ltiTools');

export default {
	createNew: (tool) => {
		toolService.create(tool)
			.then(result => {
				// Todo: remove when subsmanager is implemented
				window.location.href = '/tools/'
			})
			.catch(err => {
				console.log(err);
			});
	}
};


