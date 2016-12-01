import { browserHistory } from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import { Permissions, Server } from '../../core/helpers/';

import permissions from '../permissions';
import component from '../components/tools';
import actions from '../actions/tools';

const toolsService = Server.service('/ltiTools');

function composer(props, onData) {

	const currentUser = Server.get('user');

	if(Permissions.userHasPermission(currentUser, permissions.VIEW)) {
		// load tools
		toolsService.find()
			.then(result => {
				let tools = result.data || [];
				return tools;
			})
			.then(toolsArray => {
				let componentData = {
					actions,
					tools: toolsArray
				};

				onData(null, componentData);
			})
			.catch(error => {
				onData(error);
			});
	} else {
		onData(new Error('You don\'t have the permission to see this page.'));
	}
}

export default compose(composer)(component);
