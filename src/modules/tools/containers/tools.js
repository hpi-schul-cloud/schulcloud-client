import { browserHistory } from 'react-router';
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/tools';
import actions from '../actions/tools';

import { Server } from '../../core/helpers';

const toolsService = Server.service('/ltiTools');

function composer(props, onData) {
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
}

export default compose(composer)(component);
