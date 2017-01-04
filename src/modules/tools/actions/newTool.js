import React from 'react';
import {browserHistory} from 'react-router';
import { Server } from '../../core/helpers';

const toolService = Server.service('/ltiTools');

export default {
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


