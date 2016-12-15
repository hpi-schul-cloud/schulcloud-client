import { browserHistory } from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { SubsManager } from 'feathers-subscriptions-manager';

import { Permissions, Server } from '../../core/helpers/';

import permissions from '../permissions';
import component from '../components/newTool';
import actions from '../actions/newTool';

const toolsService = Server.service('/ltiTools');

function composer(props, onData) {

	const currentUser = Server.get('user');

	if(Permissions.userHasPermission(currentUser, permissions.NEW_VIEW)) {
		// load tools
		toolsService.find()
			.then(result => {
				let tools = result.data || [];
				tools = tools.filter((t) => {
					return t.isTemplate;
				});

				tools.forEach((t) => {
					t._id = undefined;
					t.isTemplate = false;
				});

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

		/**
		 * subManager.addSubscription(toolsService.find(), (tools) => {
	return {tools: tools.data};
});

		 subManager.ready((data, initial) => {
	const componentData = Object.assign({}, {actions}, data);
	onData(null, componentData);
});
		 */
	} else {
		onData(new Error('You don\'t have the permission to see this page.'));
	}
}

export default compose(composer)(component);
