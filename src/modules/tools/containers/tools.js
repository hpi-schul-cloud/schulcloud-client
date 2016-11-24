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
				/**let schools = result.data || [];

				return Promise.all(schools.map(school => {
					// load systems
					Promise.all(school.systems.map(id => systemService.get(id)))
						.then(systems => {
							school.systems = systems.map(system => {
								system.type = system.type.substr(0, 1).toUpperCase() + system.type.substr(1);	// capitalize
								return system;
							});
							return school.systems;
						})
						.catch(error => {
							onData(error);
						});

					return school;
				}));**/
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
